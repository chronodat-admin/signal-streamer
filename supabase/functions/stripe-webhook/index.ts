import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Stripe environment variables not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe-signature header");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400 }
      );
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature (use async version for Deno/Edge Runtime compatibility)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400 }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as "PRO" | "ELITE";

        console.log(`[checkout.session.completed] Processing:`, {
          sessionId: session.id,
          userId,
          plan,
          subscriptionId: session.subscription,
          customerId: session.customer,
          metadata: session.metadata,
        });

        if (userId && plan) {
          console.log(`Checkout completed for user ${userId}, plan ${plan}, subscription: ${session.subscription}`);

          // First, try direct SQL update (most reliable with service role)
          const { error: directError, data: directResult } = await supabase
            .from("profiles")
            .update({
              plan: plan,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select()
            .single();

          if (directError) {
            console.error("Direct update failed:", directError);
            
            // Fallback: try RPC function
            const { data: updateResult, error: updateError } = await supabase.rpc('update_user_plan', {
              p_user_id: userId,
              p_plan: plan,
              p_stripe_subscription_id: session.subscription as string,
            });

            if (updateError) {
              console.error("RPC update also failed:", updateError);
              
              // Last resort: try raw SQL via admin
              console.error("CRITICAL: All update methods failed for user:", userId);
            } else {
              console.log(`RPC update succeeded. Result:`, updateResult);
            }
          } else {
            console.log(`Direct update succeeded. Updated profile:`, {
              user_id: userId,
              plan: directResult?.plan,
              subscription_id: directResult?.stripe_subscription_id,
            });
          }
          
          // Always verify the update
          const { data: verifyProfile, error: verifyError } = await supabase
            .from("profiles")
            .select("user_id, plan, stripe_subscription_id, stripe_customer_id, updated_at")
            .eq("user_id", userId)
            .single();
          
          if (verifyError) {
            console.error("Failed to verify profile:", verifyError);
          } else {
            console.log("Final profile state after checkout:", verifyProfile);
            
            // Check if the update actually took effect
            if (verifyProfile.plan !== plan) {
              console.error("CRITICAL: Plan mismatch after update!", {
                expected: plan,
                actual: verifyProfile.plan,
              });
            }
          }
        } else {
          console.error("Missing userId or plan in checkout session metadata:", {
            sessionId: session.id,
            userId,
            plan,
            metadata: session.metadata,
            customer: session.customer,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription ${event.type} for customer ${customerId}, status: ${subscription.status}`);

        // Get user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, plan")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.error("Profile not found for customer:", customerId, profileError);
          break;
        }

        // Get plan from subscription metadata or price
        let plan: "PRO" | "ELITE" | null = subscription.metadata?.plan as "PRO" | "ELITE" | null;

        // If no plan in metadata, determine from price
        if (!plan && subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
          const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");
          
          console.log(`Determining plan from price ID: ${priceId}, PRO: ${proPriceId}, ELITE: ${elitePriceId}`);
          
          if (priceId === proPriceId) plan = "PRO";
          else if (priceId === elitePriceId) plan = "ELITE";
        }

        // Update plan and expiry
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const status = subscription.status;

        if (status === "active" || status === "trialing") {
          // If we couldn't determine plan, try to get it from the current profile or subscription
          if (!plan) {
            // Try to get plan from subscription items by fetching the price details
            try {
              if (subscription.items.data.length > 0) {
                const priceId = subscription.items.data[0].price.id;
                const price = await stripe.prices.retrieve(priceId);
                console.log(`Retrieved price details:`, { id: price.id, nickname: price.nickname, metadata: price.metadata });
                
                // Check if price has plan in metadata
                if (price.metadata?.plan) {
                  plan = price.metadata.plan as "PRO" | "ELITE";
                }
              }
            } catch (priceError) {
              console.error("Error retrieving price:", priceError);
            }
          }

          // If still no plan, log warning but still update subscription info
          if (!plan) {
            console.warn(`Could not determine plan for subscription ${subscription.id}. Current profile plan: ${profile.plan}. Will update subscription info but keep current plan.`);
          }

          // Use RPC function to update (bypasses RLS)
          if (plan) {
            const { data: updateResult, error: rpcError } = await supabase.rpc('update_user_plan', {
              p_user_id: profile.user_id,
              p_plan: plan,
              p_stripe_subscription_id: subscription.id,
              p_plan_expires_at: periodEnd,
            });

            if (rpcError) {
              console.error("Error updating subscription via RPC:", rpcError);
              
              // Fallback: direct update
              const { error: updateError, data: updatedProfile } = await supabase
                .from("profiles")
                .update({
                  plan,
                  stripe_subscription_id: subscription.id,
                  plan_expires_at: periodEnd,
                })
                .eq("user_id", profile.user_id)
                .select()
                .single();

              if (updateError) {
                console.error("Fallback update also failed:", updateError);
              } else {
                console.log(`Fallback update succeeded:`, {
                  plan: updatedProfile?.plan,
                  expires: periodEnd,
                  subscription_id: subscription.id,
                });
              }
            } else {
              console.log(`Successfully updated subscription via RPC for user ${profile.user_id}:`, {
                plan,
                expires: periodEnd,
                subscription_id: subscription.id,
                result: updateResult,
              });
            }
          } else {
            // Update subscription info without changing plan
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                stripe_subscription_id: subscription.id,
                plan_expires_at: periodEnd,
              })
              .eq("user_id", profile.user_id);

            if (updateError) {
              console.error("Error updating subscription info:", updateError);
            } else {
              console.log(`Updated subscription info (without plan change) for user ${profile.user_id}`);
            }
          }
        } else {
          console.log(`Subscription status is ${status}, not updating plan (only active/trialing subscriptions update plan)`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription deleted for customer ${customerId}`);

        // Get user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.error("Profile not found for customer:", customerId);
          break;
        }

        // Downgrade to FREE
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            plan: "FREE",
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error("Error downgrading user:", updateError);
        } else {
          console.log(`User ${profile.user_id} downgraded to FREE`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        // Could send a thank you email here
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`Payment failed for invoice ${invoice.id}, customer ${customerId}`);

        // Get user by Stripe customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Could send a payment failed notification here
          console.log(`Payment failed for user ${profile.user_id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook handler failed" }),
      { status: 500 }
    );
  }
});


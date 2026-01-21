import { Link } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SEO } from '@/components/SEO';

const Terms = () => {
  return (
    <>
      <SEO 
        title="Terms of Service - TradeMoq"
        description="Read TradeMoq's Terms of Service to understand the rules and guidelines for using our trading signal tracking platform."
        keywords="terms of service, user agreement, trading platform terms"
        canonical="https://trademoq.com/terms"
      />
      <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight">TradeMoq</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 8, 2026</p>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using TradeMoq ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. We reserve the right to update these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                TradeMoq is a trading signal tracking and analytics platform that allows users to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                <li>Receive and store trading signals via webhook integrations</li>
                <li>Organize signals into strategies</li>
                <li>View analytics and performance metrics</li>
                <li>Export signal data</li>
                <li>Share strategies publicly (optional)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">4. Subscription Plans and Billing</h2>
              <h3 className="font-heading text-lg font-medium mb-2 mt-4">4.1 Free Plan</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Free plan provides limited access to our Service with restrictions on the number of strategies and data retention period.
              </p>

              <h3 className="font-heading text-lg font-medium mb-2 mt-4">4.2 Paid Plans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pro and Elite plans are billed monthly. Payments are processed through our payment provider. All fees are non-refundable except as required by law.
              </p>

              <h3 className="font-heading text-lg font-medium mb-2 mt-4">4.3 Cancellation</h3>
              <p className="text-muted-foreground leading-relaxed">
                You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. You will retain access to paid features until then.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Transmit malicious code or harmful data</li>
                <li>Exceed rate limits or abuse the webhook endpoints</li>
                <li>Resell or redistribute the Service without permission</li>
                <li>Use automated systems to access the Service in a manner that exceeds reasonable use</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by TradeMoq and are protected by international copyright, trademark, and other intellectual property laws. Your trading data and signals remain your property.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-muted-foreground leading-relaxed font-medium">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                TradeMoq is a signal tracking tool only. We do not provide financial advice, and the Service should not be used as the sole basis for any trading decisions.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-muted-foreground leading-relaxed font-medium">
                  IN NO EVENT SHALL SIGNALPULSE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">9. Platform Disclaimer</h2>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5 mb-4">
                <p className="text-sm text-muted-foreground leading-relaxed uppercase tracking-wide">
                  <strong className="text-foreground block mb-3">IMPORTANT – PLEASE READ CAREFULLY:</strong>
                  SIGNALPULSE IS A SIGNAL ROUTING AND NOTIFICATION PLATFORM THAT ALLOWS USERS TO RECEIVE, MANAGE, AND FORWARD TRADING ALERTS FROM THEIR CHOSEN ALERT SOURCES (SUCH AS TRADINGVIEW, TRENDSPIDER, OR CUSTOM APIS) TO THEIR PREFERRED NOTIFICATION CHANNELS (SUCH AS DISCORD, TELEGRAM, EMAIL, OR WEBHOOKS).
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">No Trading Advice</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    TradeMoq does not generate, provide, or recommend any trading signals, alerts, investment advice, market analysis, or research of any kind. We do not recommend any securities, cryptocurrencies, forex pairs, or other financial instruments to buy, sell, or hold. The platform is designed solely to assist traders and investors in organizing and receiving their own trading alerts. All trading decisions are made entirely by the user based on their own judgment and analysis.
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">No Delivery Guarantees</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    TradeMoq shall not be liable for any delays, failures, or interruptions in the delivery of alerts or notifications. We do not guarantee real-time delivery or 100% uptime. Signal delivery depends on third-party services and network conditions outside our control.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">10. Trading Risk Disclaimer</h2>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-5">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">⚠️ HIGH RISK WARNING:</strong>
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-destructive">•</span>
                    Trading and investing in financial markets involves substantial risk of loss and is not suitable for all investors.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-destructive">•</span>
                    Past performance is not indicative of future results.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-destructive">•</span>
                    You should only trade with capital you can afford to lose.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-destructive">•</span>
                    Consult with a qualified financial advisor before making any investment decisions.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-destructive">•</span>
                    TradeMoq does not guarantee the accuracy, completeness, or timeliness of any signal data.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-destructive">•</span>
                    You are solely responsible for your trading decisions and any resulting gains or losses.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless TradeMoq and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately. You may request export of your data before account deletion.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">14. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@trademoq.com" className="text-primary hover:underline">
                  legal@trademoq.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-muted/10">
        <div className="container mx-auto max-w-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 TradeMoq. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-foreground font-medium">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Terms;







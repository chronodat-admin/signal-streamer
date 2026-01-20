import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Send, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { useLanguage } from '@/i18n';

export default function Contact() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Honeypot field for bot detection
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bot check: If honeypot field is filled, it's likely a bot
    if (honeypot) {
      // Silently fail - don't show error to bot
      console.log('Bot detected via honeypot');
      return;
    }

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: t.contact.missingFields,
        description: t.contact.missingFieldsDescription,
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: t.contact.invalidEmail,
        description: t.contact.invalidEmailDescription,
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Check rate limiting (max 3 messages per hour per email)
      const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_contact_rate_limit', {
        _email: formData.email,
      });

      if (rateLimitError) {
        // If function doesn't exist yet, continue (graceful degradation)
        console.warn('Rate limit check failed:', rateLimitError);
      } else if (rateLimitCheck === false) {
        toast({
          title: t.contact.tooManyMessages,
          description: t.contact.tooManyMessagesDescription,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'new',
      });

      if (error) {
        if (error.code === '42P01') {
          toast({
            title: t.contact.systemNotAvailable,
            description: t.contact.systemNotAvailableDescription,
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
        setHoneypot(''); // Reset honeypot
        toast({
          title: t.contact.messageSent,
          description: t.contact.messageSentDescription,
        });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: t.common.error,
        description: t.contact.failedToSend,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">TradeMoq</span>
              </Link>
              <div className="flex items-center gap-2">
                <ColorSchemePicker />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Success Message */}
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Message Sent Successfully!</CardTitle>
              <CardDescription className="text-base mt-2">
                Thank you for contacting us. We've received your message and will get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">TradeMoq</span>
            </Link>
            <div className="flex items-center gap-2">
              <ColorSchemePicker />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Email</CardTitle>
                </div>
                <CardDescription>
                  Send us an email anytime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@trademoq.com" className="text-sm text-primary hover:underline">
                  support@trademoq.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Response Time</CardTitle>
                </div>
                <CardDescription>
                  We typically respond within 24 hours
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 relative">
                  {/* Honeypot field - hidden from users but visible to bots */}
                  <div className="absolute opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                    <Label htmlFor="website">Website (leave blank)</Label>
                    <Input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subject <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="What is this regarding?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


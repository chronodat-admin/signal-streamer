import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    name: '',
  });

  const feedbackCategories = [
    { value: 'Bug Report', label: t.feedback.bug },
    { value: 'Feature Request', label: t.feedback.feature },
    { value: 'UI/UX Improvement', label: t.feedback.improvement },
    { value: 'Performance Issue', label: t.feedback.performance },
    { value: 'Documentation', label: t.feedback.documentation },
    { value: 'Other', label: t.feedback.other },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.subject || !formData.message) {
      toast({
        title: t.feedback.missingFields,
        description: t.feedback.missingFieldsDescription,
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Try to insert into user_feedback table
      const { error } = await supabase.from('user_feedback').insert({
        user_id: user?.id || null,
        email: user?.email || null,
        category: formData.category,
        feedback: formData.message,
        subject: formData.subject,
        name: formData.name || null,
        status: 'new',
      });

      if (error) {
        // If table doesn't exist, show a helpful message
        if (error.code === '42P01') {
          toast({
            title: t.feedback.systemNotAvailable,
            description: t.feedback.systemNotAvailableDescription,
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: t.feedback.feedbackSubmitted,
          description: t.feedback.feedbackReceived,
        });
        // Reset form
        setFormData({
          category: '',
          subject: '',
          message: '',
          name: '',
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: t.feedback.error,
        description: t.feedback.failedToSubmit,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{t.feedback.submitFeedback}</DialogTitle>
              <DialogDescription>
                {t.feedback.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">
              {t.feedback.category} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={t.feedback.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {feedbackCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              {t.feedback.subject} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder={t.feedback.subjectPlaceholder}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              {t.feedback.message} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder={t.feedback.messagePlaceholder}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t.feedback.nameOptional}</Label>
            <Input
              id="name"
              placeholder={t.feedback.namePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t.feedback.cancel}
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.feedback.submitting}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t.feedback.submitFeedback}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};





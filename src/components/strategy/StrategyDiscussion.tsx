import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, formatDateTime } from '@/lib/formatUtils';
import { usePreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/i18n';
import { MessageSquare, Send, Loader2, Reply, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Comment {
  id: string;
  strategy_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  replies?: Comment[];
}

interface StrategyDiscussionProps {
  strategyId: string;
}

const StrategyDiscussion = ({ strategyId }: StrategyDiscussionProps) => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [strategyId]);

  const fetchComments = async () => {
    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('strategy_comments')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch all unique user IDs
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      // Add profiles to comments
      const commentsWithProfiles = commentsData.map((comment) => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id),
      }));

      // Organize comments into threads (parent comments with replies)
      const parentComments = commentsWithProfiles.filter((c) => !c.parent_id);
      const replies = commentsWithProfiles.filter((c) => c.parent_id);

      const commentsWithReplies = parentComments.map((parent) => ({
        ...parent,
        replies: replies.filter((r) => r.parent_id === parent.id),
      }));

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: t.common.error,
        description: t.publicStrategy.discussion.failedToLoad,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('strategy_comments').insert({
        strategy_id: strategyId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: null,
      });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      toast({
        title: t.common.success,
        description: t.publicStrategy.discussion.commentPosted,
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: t.common.error,
        description: error.message || t.publicStrategy.discussion.failedToPost,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('strategy_comments').insert({
        strategy_id: strategyId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId,
      });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
      toast({
        title: t.common.success,
        description: t.publicStrategy.discussion.replyPosted,
      });
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast({
        title: t.common.error,
        description: error.message || t.publicStrategy.discussion.failedToPost,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !user) return;

    try {
      const { error } = await supabase
        .from('strategy_comments')
        .update({ is_deleted: true })
        .eq('id', commentToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchComments();
      toast({
        title: t.common.success,
        description: t.publicStrategy.discussion.commentDeleted,
      });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: t.common.error,
        description: error.message || t.publicStrategy.discussion.failedToDelete,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getUserDisplayName = (comment: Comment) => {
    if (comment.profiles?.full_name) return comment.profiles.full_name;
    if (comment.profiles?.email) return comment.profiles.email.split('@')[0];
    return 'Anonymous';
  };

  if (loading) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t.publicStrategy.discussion.title}</h2>
          <span className="text-sm text-muted-foreground">({comments.length})</span>
        </div>

        {/* Comment Form - Only for logged-in users */}
        {user ? (
          <div className="mb-6 space-y-3">
            <Textarea
              placeholder={t.publicStrategy.discussion.writeComment}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t.publicStrategy.discussion.postComment}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t.publicStrategy.discussion.loginToComment}
            </p>
            <Button asChild size="sm" variant="outline">
              <a href="/auth">{t.publicStrategy.discussion.login}</a>
            </Button>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t.publicStrategy.discussion.noComments}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                {/* Parent Comment */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.profiles?.full_name || null, comment.profiles?.email || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{getUserDisplayName(comment)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at, preferences.dateFormat)}
                      </span>
                      {user && user.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 ml-auto"
                          onClick={() => {
                            setCommentToDelete(comment.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        {t.publicStrategy.discussion.reply}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && user && (
                  <div className="ml-11 mt-3 space-y-2">
                    <Textarea
                      placeholder={t.publicStrategy.discussion.writeReply}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                        size="sm"
                        className="h-7"
                      >
                        {submitting ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        {t.publicStrategy.discussion.postReply}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        {t.common.cancel}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(reply.profiles?.full_name || null, reply.profiles?.email || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs">{getUserDisplayName(reply)}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.created_at, preferences.dateFormat)}
                            </span>
                            {user && user.id === reply.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 ml-auto"
                                onClick={() => {
                                  setCommentToDelete(reply.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.publicStrategy.discussion.deleteComment}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.publicStrategy.discussion.deleteCommentDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-destructive-foreground">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default StrategyDiscussion;


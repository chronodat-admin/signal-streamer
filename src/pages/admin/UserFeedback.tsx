import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Search, Loader2, Star } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatUtils';

interface UserFeedback {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  rating: number | null;
  feedback?: string;
  subject?: string;
  category: string | null;
  status?: 'new' | 'reviewed' | 'resolved';
  created_at: string;
}

export const UserFeedback = () => {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Note: This assumes a user_feedback table exists
    // If it doesn't exist yet, this will show an empty state
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      
      // Fetch feedback without join (user_id references auth.users, not profiles directly)
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet, that's okay
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('user_feedback table does not exist yet');
          setFeedback([]);
        } else {
          throw error;
        }
      } else {
        // Feedback already contains email and name fields from submission
        setFeedback(data || []);
      }
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesSearch = 
        !searchQuery ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.feedback?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [feedback, searchQuery]);

  const statusColors: Record<'new' | 'reviewed' | 'resolved', string> = {
    new: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    reviewed: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    resolved: 'bg-green-500/20 text-green-600 dark:text-green-400',
  };

  const newFeedbackCount = feedback.filter((f) => f.status === 'new').length;
  const ratedFeedback = feedback.filter((f) => f.rating);
  const averageRating = ratedFeedback.length > 0
    ? ratedFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFeedback.length
    : 0;

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">User Feedback</h1>
        <p className="text-muted-foreground">View and manage user feedback submissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.length}</div>
            <p className="text-xs text-muted-foreground">All feedback submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Feedback</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newFeedbackCount}</div>
            <p className="text-xs text-muted-foreground">Unreviewed feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>All Feedback ({filteredFeedback.length})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, feedback, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No user feedback yet</p>
              <p className="text-sm text-muted-foreground">
                User feedback will appear here once users submit feedback.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedback.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No feedback matches your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeedback.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name || 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          {item.email || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.subject || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{item.rating}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">{item.feedback || 'N/A'}</TableCell>
                        <TableCell>
                          {item.category ? (
                            <Badge variant="outline">{item.category}</Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[item.status || 'new']}>
                            {(item.status || 'new').charAt(0).toUpperCase() + (item.status || 'new').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};


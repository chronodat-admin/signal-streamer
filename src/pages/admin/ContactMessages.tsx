import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Search, Loader2, Mail } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatUtils';

interface ContactMessage {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: 'new' | 'read' | 'replied';
  created_at: string;
}

export const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Note: This assumes a contact_messages table exists
    // If it doesn't exist yet, this will show an empty state
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from contact_messages table
      // If table doesn't exist, this will return an error which we'll handle gracefully
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet, that's okay
        if (error.code === '42P01') {
          console.log('contact_messages table does not exist yet');
          setMessages([]);
        } else {
          throw error;
        }
      } else {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesSearch = 
        !searchQuery ||
        message.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.message?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [messages, searchQuery]);

  const statusColors: Record<'new' | 'read' | 'replied', string> = {
    new: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    read: 'bg-muted text-muted-foreground',
    replied: 'bg-green-500/20 text-green-600 dark:text-green-400',
  };

  const newMessagesCount = messages.filter((m) => m.status === 'new').length;

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Messages</h1>
        <p className="text-muted-foreground">View and manage contact form submissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">All contact messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <Mail className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newMessagesCount}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replied</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages.filter((m) => m.status === 'replied').length}
            </div>
            <p className="text-xs text-muted-foreground">Messages with replies</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>All Messages ({filteredMessages.length})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or subject..."
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
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No contact messages yet</p>
              <p className="text-sm text-muted-foreground">
                Contact messages will appear here once users submit the contact form.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No messages match your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">{message.name || 'N/A'}</TableCell>
                        <TableCell>{message.email || 'N/A'}</TableCell>
                        <TableCell>{message.subject || 'N/A'}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{message.message || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[message.status || 'new']}>
                            {(message.status || 'new').charAt(0).toUpperCase() + (message.status || 'new').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(message.created_at)}</TableCell>
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


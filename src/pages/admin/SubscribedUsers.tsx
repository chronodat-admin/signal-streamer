import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Search, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/formatUtils';

interface SubscribedUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  plan: 'FREE' | 'PRO' | 'ELITE';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_expires_at: string | null;
  created_at: string;
}

export const SubscribedUsers = () => {
  const [users, setUsers] = useState<SubscribedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscribedUsers();
  }, []);

  const fetchSubscribedUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with active subscriptions (PRO or ELITE plans with subscription ID)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('plan', ['PRO', 'ELITE'])
        .not('stripe_subscription_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching subscribed users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        !searchQuery ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchQuery]);

  const planColors: Record<'FREE' | 'PRO' | 'ELITE', string> = {
    FREE: 'bg-muted text-muted-foreground',
    PRO: 'bg-primary/20 text-primary',
    ELITE: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
  };

  const isSubscriptionActive = (expiresAt: string | null) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) > new Date();
  };

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Subscribed Users</h1>
        <p className="text-muted-foreground">View and manage user subscriptions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRO Users</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.plan === 'PRO').length}
            </div>
            <p className="text-xs text-muted-foreground">PRO plan subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ELITE Users</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.plan === 'ELITE').length}
            </div>
            <p className="text-xs text-muted-foreground">ELITE plan subscribers</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscribed Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>All Subscribed Users ({filteredUsers.length})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
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
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Subscription ID</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {users.length === 0 ? 'No subscribed users found' : 'No users match your search'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={planColors[user.plan]}>
                            {user.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {user.stripe_subscription_id ? (
                            <span className="truncate max-w-[200px] block">
                              {user.stripe_subscription_id}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {user.plan_expires_at ? formatDate(user.plan_expires_at) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isSubscriptionActive(user.plan_expires_at) ? 'default' : 'destructive'}
                          >
                            {isSubscriptionActive(user.plan_expires_at) ? 'Active' : 'Expired'}
                          </Badge>
                        </TableCell>
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




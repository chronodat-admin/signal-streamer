import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Crown, 
  User, 
  UserPlus, 
  Calendar, 
  TrendingUp, 
  Search,
  ChevronDown,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/formatUtils';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  plan: 'FREE' | 'PRO' | 'ELITE';
  created_at: string;
  roles?: { role: 'admin' | 'moderator' | 'user' }[];
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
  joinedToday: number;
  joinedThisWeek: number;
  joinedThisMonth: number;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'user'>('all');
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    recentUsers: 0,
    joinedToday: 0,
    joinedThisWeek: 0,
    joinedThisMonth: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id to roles
      const rolesMap = new Map<string, { role: 'admin' | 'moderator' | 'user' }[]>();
      roles?.forEach((r) => {
        if (!rolesMap.has(r.user_id)) {
          rolesMap.set(r.user_id, []);
        }
        rolesMap.get(r.user_id)!.push({ role: r.role });
      });

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        roles: rolesMap.get(profile.user_id) || [],
      }));

      setUsers(usersWithRoles);

      // Calculate statistics
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const thisWeek = new Date(now);
      thisWeek.setDate(now.getDate() - now.getDay()); // Monday
      thisWeek.setHours(0, 0, 0, 0);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const adminCount = usersWithRoles.filter((u) => 
        u.roles.some((r) => r.role === 'admin')
      ).length;

      const regularCount = usersWithRoles.length - adminCount;

      const recentCount = usersWithRoles.filter((u) => {
        const createdAt = new Date(u.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt >= thirtyDaysAgo;
      }).length;

      const joinedToday = usersWithRoles.filter((u) => {
        const createdAt = new Date(u.created_at);
        return createdAt >= today;
      }).length;

      const joinedThisWeek = usersWithRoles.filter((u) => {
        const createdAt = new Date(u.created_at);
        return createdAt >= thisWeek;
      }).length;

      const joinedThisMonth = usersWithRoles.filter((u) => {
        const createdAt = new Date(u.created_at);
        return createdAt >= thisMonth;
      }).length;

      setStats({
        totalUsers: usersWithRoles.length,
        adminUsers: adminCount,
        regularUsers: regularCount,
        recentUsers: recentCount,
        joinedToday,
        joinedThisWeek,
        joinedThisMonth,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = 
        roleFilter === 'all' ||
        (roleFilter === 'admin' && user.roles.some((r) => r.role === 'admin')) ||
        (roleFilter === 'moderator' && user.roles.some((r) => r.role === 'moderator')) ||
        (roleFilter === 'user' && !user.roles.some((r) => r.role === 'admin' || r.role === 'moderator'));

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const getUserRole = (user: UserProfile) => {
    if (user.roles.some((r) => r.role === 'admin')) return 'admin';
    if (user.roles.some((r) => r.role === 'moderator')) return 'moderator';
    return 'user';
  };

  const planColors: Record<'FREE' | 'PRO' | 'ELITE', string> = {
    FREE: 'bg-muted text-muted-foreground',
    PRO: 'bg-primary/20 text-primary',
    ELITE: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
  };

  const roleColors: Record<'admin' | 'moderator' | 'user', string> = {
    admin: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    moderator: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    user: 'bg-muted text-muted-foreground',
  };

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user roles, permissions, and view analytics</p>
      </div>

      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Crown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">Users with admin role</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.regularUsers}</div>
            <p className="text-xs text-muted-foreground">Standard user accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUsers}</div>
            <p className="text-xs text-muted-foreground">Joined in last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* User Join Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joined Today</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.joinedToday}</div>
            <p className="text-xs text-muted-foreground">New users since 00:00 (UTC)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joined This Week</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.joinedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Since Monday 00:00 (UTC)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joined This Month</CardTitle>
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.joinedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Since day 1 00:00 (UTC)</p>
          </CardContent>
        </Card>
      </div>

      {/* All Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {roleFilter === 'all' ? 'All Roles' : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>All Roles</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('moderator')}>Moderator</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('user')}>User</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const role = getUserRole(user);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                          <TableCell>{user.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={roleColors[role]}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={planColors[user.plan]}>
                              {user.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
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


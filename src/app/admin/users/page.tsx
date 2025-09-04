'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface User {
  _id: string
  _createdAt: string
  name: string
  email: string
  image?: string
  role: 'user' | 'partner' | 'admin'
  verified: boolean
  provider: string
  stats?: {
    totalPurchases: number
    totalSpent: number
    lastLoginAt?: string
  }
  partnerInfo?: {
    approved: boolean
    totalEarnings: number
    productsPublished: number
  }
}

interface UserStats {
  admin: number
  partner: number
  user: number
  verified: number
  unverified: number
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== 'admin') {
      router.push('/admin')
      return
    }
  }, [session, router])

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast.error(data.error || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers()
    }
  }, [session, currentPage, searchTerm, roleFilter, statusFilter])

  // Handle search with debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1) // Reset to first page on search
      fetchUsers()
    }, 500)

    return () => clearTimeout(debounce)
  }, [searchTerm])

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected')
      return
    }

    try {
      setBulkLoading(true)

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Successfully ${action}ed ${data.summary.successful} users`)
        setSelectedUsers([])
        fetchUsers()
      } else {
        toast.error(data.error || 'Bulk action failed')
      }
    } catch (error) {
      toast.error('Failed to perform bulk action')
    } finally {
      setBulkLoading(false)
    }
  }

  // Individual user actions
  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: [userId]
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`User ${action}ed successfully`)
        fetchUsers()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      toast.error('Failed to perform action')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />
      case 'partner': return <Crown className="w-4 h-4 text-blue-600" />
      default: return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      partner: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    }
    return colors[role as keyof typeof colors] || colors.user
  }

  if (session?.user?.role !== 'admin') {
    return (
      <AdminLayout title="Access Denied" subtitle="Admin access required">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin privileges to access user management.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="User Management" subtitle="Manage user accounts and permissions">
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{stats.admin + stats.partner + stats.user}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold">{stats.admin}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Partners</p>
                    <p className="text-2xl font-bold">{stats.partner}</p>
                  </div>
                  <Crown className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verified</p>
                    <p className="text-2xl font-bold">{stats.verified}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Regular Users</p>
                    <p className="text-2xl font-bold">{stats.user}</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedUsers.length} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction('verify')}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('promote_partner')}
                    disabled={bulkLoading}
                  >
                    <Crown className="w-4 h-4" />
                    Promote to Partner
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedUsers.length === users.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(users.map(u => u._id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user._id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user._id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image} />
                              <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadge(user.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(user.role)}
                              {user.role}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.verified ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(user._createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Orders: {user.stats?.totalPurchases || 0}</div>
                            <div className="text-gray-500">
                              Spent: ${user.stats?.totalSpent || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {!user.verified && (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, 'verify')}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Verify User
                                </DropdownMenuItem>
                              )}
                              {user.role === 'user' && (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, 'promote_partner')}
                                >
                                  <Crown className="mr-2 h-4 w-4" />
                                  Promote to Partner
                                </DropdownMenuItem>
                              )}
                              {user.role === 'partner' && (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, 'demote_user')}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Demote to User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

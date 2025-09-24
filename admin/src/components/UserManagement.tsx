import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Skeleton } from './ui/skeleton'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Mail, 
  Calendar,
  Shield,
  UserCheck,
  Crown,
  User,
  Eye
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  role: string
}

interface Role {
  value: string
  label: string
  description: string
  accessible: boolean
}

interface UserManagementProps {
  accessToken: string
}

export const UserManagement: React.FC<UserManagementProps> = ({ accessToken }) => {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 编辑用户状态
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // 新增用户状态
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('获取用户列表错误:', data)
        toast.error(data.error || '获取用户列表失败')
        return
      }

      setUsers(data.users)
      setCurrentUserRole(data.currentUserRole)
    } catch (error) {
      console.log('获取用户列表时出现错误:', error)
      toast.error('获取用户列表时出现错误')
    } finally {
      setLoading(false)
    }
  }

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/roles`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setRoles(data.roles)
      }
    } catch (error) {
      console.log('获取角色列表时出现错误:', error)
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('删除用户错误:', data)
        toast.error(data.error || '删除用户失败')
        return
      }

      toast.success('用户删除成功')
      fetchUsers() // 重新获取用户列表
    } catch (error) {
      console.log('删除用户时出现错误:', error)
      toast.error('删除用户时出现错误')
    }
  }

  // 创建用户
  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword) {
      toast.error('请填写所有必要字段')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('创建用户错误:', data)
        toast.error(data.error || '创建用户失败')
        return
      }

      toast.success('用户创建成功')
      setIsCreateDialogOpen(false)
      resetCreateForm()
      fetchUsers() // 重新获取用户列表
    } catch (error) {
      console.log('创建用户时出现错误:', error)
      toast.error('创建用户时出现错误')
    } finally {
      setIsCreating(false)
    }
  }

  // 更新用户
  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/users/${editingUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: editName,
            email: editEmail,
            role: editRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('更新用户错误:', data)
        toast.error(data.error || '更新用户失败')
        return
      }

      toast.success('用户更新成功')
      setIsEditDialogOpen(false)
      setEditingUser(null)
      fetchUsers() // 重新获取用户列表
    } catch (error) {
      console.log('更新用户时出现错误:', error)
      toast.error('更新用户时出现错误')
    }
  }

  // 重置创建表单
  const resetCreateForm = () => {
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('user')
  }

  // 打开编辑对话框
  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setIsEditDialogOpen(true)
  }

  // 获取角色显示信息
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; color: string; icon: any }> = {
      'super_admin': { label: '超级管理员', color: 'bg-red-100 text-red-800', icon: Crown },
      'admin': { label: '管理员', color: 'bg-blue-100 text-blue-800', icon: Shield },
      'user': { label: '普通用户', color: 'bg-green-100 text-green-800', icon: User },
      'guest': { label: '访客', color: 'bg-gray-100 text-gray-800', icon: Eye }
    }
    
    return roleMap[role] || { label: '未知', color: 'bg-gray-100 text-gray-800', icon: User }
  }

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '从未'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 过滤用户
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [accessToken])

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已验证邮箱</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.email_confirmed_at).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">管理员用户</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.role === 'admin' || user.role === 'super_admin').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户管理</CardTitle>
              <CardDescription>管理系统中的所有用户账户</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增用户
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={fetchUsers} 
                disabled={loading}
              >
                刷新列表
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索框 */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索用户姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 用户表格 */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户信息</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>邮箱状态</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm ? '没有找到匹配的用户' : '暂无用户数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const roleDisplay = getRoleDisplay(user.role)
                      const RoleIcon = roleDisplay.icon
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <RoleIcon className="h-4 w-4" />
                              <Badge className={roleDisplay.color}>
                                {roleDisplay.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.email_confirmed_at ? 'default' : 'secondary'}>
                              {user.email_confirmed_at ? '已验证' : '未验证'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{formatDate(user.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDate(user.last_sign_in_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您确定要删除用户 "{user.name}" 吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增用户对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
            <DialogDescription>
              创建一个新的用户账户
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName">姓名</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">邮箱</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRole">用户角色</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center space-x-2">
                        <span>{role.label}</span>
                        <span className="text-sm text-gray-500">({role.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetCreateForm()
              }}
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={isCreating}
            >
              {isCreating ? '创建中...' : '创建用户'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
            <DialogDescription>
              修改用户的基本信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">姓名</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">邮箱</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">用户角色</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center space-x-2">
                        <span>{role.label}</span>
                        <span className="text-sm text-gray-500">({role.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleUpdateUser}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
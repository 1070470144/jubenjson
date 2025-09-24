import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { supabase } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface SystemSettingsProps {
  accessToken: string
}

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
}

interface SystemConfig {
  theme: string
  language: string
  notifications: boolean
  autoSave: boolean
  pageSize: number
  timezone: string
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ accessToken }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    theme: 'light',
    language: 'zh-CN',
    notifications: true,
    autoSave: true,
    pageSize: 10,
    timezone: 'Asia/Shanghai'
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 个人信息表单
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/user`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('获取用户信息错误:', data)
        toast.error(data.error || '获取用户信息失败')
        return
      }

      const user = data.user
      setUserProfile({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '未设置',
        avatar_url: user.user_metadata?.avatar_url
      })
      
      setProfileForm({
        name: user.user_metadata?.name || '',
        email: user.email || ''
      })
    } catch (error) {
      console.log('获取用户信息时出现错误:', error)
      toast.error('获取用户信息时出现错误')
    }
  }

  // 获取系统配置
  const fetchSystemConfig = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.records) {
        // 查找系统配置记录
        const configRecord = data.records.find((record: any) => record.key === 'system_config')
        if (configRecord && typeof configRecord.value === 'object') {
          setSystemConfig({ ...systemConfig, ...configRecord.value })
        }
      }
    } catch (error) {
      console.log('获取系统配置时出现错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 保存个人信息
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error('请输入姓名')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: profileForm.name }
      })

      if (error) {
        console.log('更新个人信息错误:', error)
        toast.error(error.message || '更新失败')
        return
      }

      toast.success('个人信息更新成功')
      fetchUserProfile() // 重新获取用户信息
    } catch (error) {
      console.log('更新个人信息时出现错误:', error)
      toast.error('更新个人信息时出现错误')
    } finally {
      setSaving(false)
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('请填写新密码和确认密码')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('新密码和确认密码不匹配')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('密码长度至少6位')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        console.log('修改密码错误:', error)
        toast.error(error.message || '修改密码失败')
        return
      }

      toast.success('密码修改成功')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsChangingPassword(false)
    } catch (error) {
      console.log('修改密码时出现错误:', error)
      toast.error('修改密码时出现错误')
    } finally {
      setSaving(false)
    }
  }

  // 保存系统配置
  const handleSaveSystemConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            key: 'system_config',
            value: systemConfig
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('保存系统配置错误:', data)
        toast.error(data.error || '保存配置失败')
        return
      }

      toast.success('系统配置保存成功')
    } catch (error) {
      console.log('保存系统配置时出现错误:', error)
      toast.error('保存系统配置时出现错误')
    } finally {
      setSaving(false)
    }
  }

  // 重置系统配置
  const handleResetConfig = () => {
    setSystemConfig({
      theme: 'light',
      language: 'zh-CN',
      notifications: true,
      autoSave: true,
      pageSize: 10,
      timezone: 'Asia/Shanghai'
    })
    toast.info('配置已重置，请点击保存按钮确认')
  }

  useEffect(() => {
    fetchUserProfile()
    fetchSystemConfig()
  }, [accessToken])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            系统设置
          </CardTitle>
          <CardDescription>
            管理您的个人资料、安全设置和系统偏好
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            系统偏好
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            通知设置
          </TabsTrigger>
        </TabsList>

        {/* 个人资料 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
              <CardDescription>管理您的个人信息和显示设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userProfile && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{userProfile.name}</p>
                      <p className="text-sm text-gray-500">{userProfile.email}</p>
                      <Badge variant="outline" className="mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已验证
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        value={profileForm.email}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? '保存中...' : '保存更改'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>管理您的密码和账户安全</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  为了保护您的账户安全，建议定期更改密码。
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4>修改密码</h4>
                    <p className="text-sm text-gray-500">设置一个强密码来保护您的账户</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                  >
                    {isChangingPassword ? '取消' : '修改密码'}
                  </Button>
                </div>

                {isChangingPassword && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">新密码</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="请输入新密码"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">确认新密码</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="请再次输入新密码"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false)
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                        }}
                      >
                        取消
                      </Button>
                      <Button onClick={handleChangePassword} disabled={saving}>
                        {saving ? '修改中...' : '确认修改'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统偏好 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>系统偏好</CardTitle>
              <CardDescription>自定义系统的外观和行为设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">主题模式</Label>
                  <Select
                    value={systemConfig.theme}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色模式</SelectItem>
                      <SelectItem value="dark">深色模式</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">语言设置</Label>
                  <Select
                    value={systemConfig.language}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="zh-TW">繁体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">时区</Label>
                  <Select
                    value={systemConfig.timezone}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Tokyo">东京时间 (UTC+9)</SelectItem>
                      <SelectItem value="America/New_York">纽约时间 (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">伦敦时间 (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageSize">每页显示数量</Label>
                  <Select
                    value={systemConfig.pageSize.toString()}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, pageSize: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5条</SelectItem>
                      <SelectItem value="10">10条</SelectItem>
                      <SelectItem value="20">20条</SelectItem>
                      <SelectItem value="50">50条</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4>自动保存</h4>
                    <p className="text-sm text-gray-500">编辑数据时自动保存更改</p>
                  </div>
                  <Switch
                    checked={systemConfig.autoSave}
                    onCheckedChange={(checked) => setSystemConfig({ ...systemConfig, autoSave: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleResetConfig}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重置默认
                </Button>
                <Button onClick={handleSaveSystemConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>管理系统通知和提醒设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4>系统通知</h4>
                    <p className="text-sm text-gray-500">接收系统重要通知和更新</p>
                  </div>
                  <Switch
                    checked={systemConfig.notifications}
                    onCheckedChange={(checked) => setSystemConfig({ ...systemConfig, notifications: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4>通知类型</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">数据变更通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">用户活动通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">系统维护通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">安全警告通知</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSystemConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
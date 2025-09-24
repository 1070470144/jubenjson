import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  User, 
  Camera, 
  Lock, 
  Mail, 
  Save, 
  Upload, 
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // 个人信息表单
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });

  // 密码表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 头像上传
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('头像文件大小不能超过 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setProfileForm(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 这里应该调用实际的API来更新用户信息
      await updateProfile(profileForm);
      toast.success('个人信息更新成功！');
    } catch (error: any) {
      toast.error(error.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('密码修改成功！');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.message || '密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(passwordForm.newPassword);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            个人设置
          </DialogTitle>
          <DialogDescription>
            管理您的个人信息、头像和账户安全设置
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">个人信息</TabsTrigger>
            <TabsTrigger value="avatar">头像设置</TabsTrigger>
            <TabsTrigger value="security">安全设置</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">基本信息</CardTitle>
                <CardDescription>
                  更新您的姓名、邮箱和个人简介
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">用户名</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入用户名"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="请输入邮箱"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">个人简介</Label>
                    <Input
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="介绍一下你自己..."
                      maxLength={100}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {profileForm.bio.length}/100
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">头像设置</CardTitle>
                <CardDescription>
                  上传或更改您的头像，支持 JPG、PNG 格式，最大 5MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage 
                      src={avatarPreview || profileForm.avatar} 
                      alt={profileForm.name} 
                    />
                    <AvatarFallback className="text-2xl">
                      {profileForm.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex gap-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          上传头像
                        </div>
                      </Button>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    
                    {avatarPreview && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setAvatarPreview(null);
                          setProfileForm(prev => ({ ...prev, avatar: user.avatar || '' }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertDescription>
                      头像将用于显示在评论、收藏等功能中。建议使用清晰的正方形图片。
                    </AlertDescription>
                  </Alert>
                </div>

                {avatarPreview && (
                  <div className="flex justify-end">
                    <Button onClick={handleProfileSubmit} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存头像
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">修改密码</CardTitle>
                <CardDescription>
                  为了您的账户安全，请定期更换密码
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="请输入当前密码"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="请输入新密码"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="请再次输入新密码"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 密码强度指示 */}
                  {passwordForm.newPassword && (
                    <div className="space-y-2">
                      <Label>密码强度</Label>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordChecks.length ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-sm">至少6位字符</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.hasNumber ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-sm">包含数字</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.hasLetter ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-sm">包含字母</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading || !Object.values(passwordChecks).every(Boolean)}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          修改中...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          修改密码
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 账户统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">账户信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>注册时间</Label>
                    <div className="text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                    </div>
                  </div>
                  <div>
                    <Label>最后登录</Label>
                    <div className="text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '未知'}
                    </div>
                  </div>
                  <div>
                    <Label>上传剧本</Label>
                    <div className="text-muted-foreground">
                      {user.uploadCount || 0} 个
                    </div>
                  </div>
                  <div>
                    <Label>收藏剧本</Label>
                    <div className="text-muted-foreground">
                      {user.favoriteCount || 0} 个
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
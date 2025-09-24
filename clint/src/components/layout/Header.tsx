import { Clock, Upload, Download, Trophy, Heart, Menu, LogIn, LogOut, User, Wand2, Settings, Camera } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoginDialog } from '../auth/LoginDialog';
import { RegisterDialog } from '../auth/RegisterDialog';
import { UserProfileDialog } from '../auth/UserProfileDialog';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { user, logout, loading } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const navItems = [
    { id: 'home', label: '首页', icon: Clock },
    { id: 'upload', label: '上传剧本', icon: Upload },
    { id: 'generator', label: '剧本生成器', icon: Wand2 },
    { id: 'scripts', label: '剧本库', icon: Download },
    { id: 'rankings', label: '排行榜', icon: Trophy },
  ];

  const handleSwitchToRegister = () => {
    setShowLoginDialog(false);
    setShowRegisterDialog(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterDialog(false);
    setShowLoginDialog(true);
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">血染钟楼门户</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-4">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>

            {/* Auth Section */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab('favorites')} className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>我的收藏</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>个人设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowLoginDialog(true)}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>登录</span>
                </Button>
                <Button
                  onClick={() => setShowRegisterDialog(true)}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>注册</span>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'default' : 'ghost'}
                      onClick={() => setActiveTab(item.id)}
                      className="flex items-center justify-start space-x-2 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                  
                  <div className="border-t pt-4">
                    {user ? (
                      <div className="space-y-4">
                        <div className="px-3 py-2">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveTab('favorites')}
                          className="flex items-center justify-start space-x-2 w-full"
                        >
                          <Heart className="h-4 w-4" />
                          <span>我的收藏</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowProfileDialog(true)}
                          className="flex items-center justify-start space-x-2 w-full"
                        >
                          <Settings className="h-4 w-4" />
                          <span>个人设置</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={logout}
                          className="flex items-center justify-start space-x-2 w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>退出登录</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          onClick={() => setShowLoginDialog(true)}
                          className="flex items-center justify-start space-x-2 w-full"
                        >
                          <LogIn className="h-4 w-4" />
                          <span>登录</span>
                        </Button>
                        <Button
                          onClick={() => setShowRegisterDialog(true)}
                          className="flex items-center justify-start space-x-2 w-full"
                        >
                          <User className="h-4 w-4" />
                          <span>注册</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Auth Dialogs */}
          <LoginDialog
            open={showLoginDialog}
            onOpenChange={setShowLoginDialog}
            onSwitchToRegister={handleSwitchToRegister}
          />
          <RegisterDialog
            open={showRegisterDialog}
            onOpenChange={setShowRegisterDialog}
            onSwitchToLogin={handleSwitchToLogin}
          />
          <UserProfileDialog
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
          />
        </div>
      </div>
    </header>
  );
}
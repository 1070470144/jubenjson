import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  lastLoginAt?: string;
  uploadCount?: number;
  favoriteCount?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use centralized Supabase client (with error handling)
let supabase: any = null;
try {
  supabase = getSupabaseClient();
} catch (error) {
  console.log('Supabase client not available, running in demo mode');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're in demo mode
  const isDemoMode = !projectId || !publicAnonKey || 
    projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';

  // 提前定义getAccessToken函数，避免undefined问题
  const getAccessToken = async (): Promise<string | null> => {
    try {
      // 在演示模式下，如果用户已登录，返回模拟token
      if (isDemoMode) {
        return user ? 'demo-access-token' : null;
      }

      if (!supabase) {
        return null;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return null;
      }
      return session.access_token;
    } catch (error) {
      console.log('Get access token error:', error);
      return null;
    }
  };

  useEffect(() => {
    // 在演示模式下跳过Supabase初始化
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user && !error) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            avatar: session.user.user_metadata?.avatar
          });
        }
      } catch (error) {
        console.log('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          avatar: session.user.user_metadata?.avatar
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (email: string, password: string, name: string) => {
    try {
      // Demo mode registration
      if (isDemoMode) {
        // Simple demo validation
        if (email && password.length >= 6 && name) {
          setUser({
            id: 'demo-user-' + Date.now(),
            email,
            name,
            avatar: undefined
          });
          return { success: true };
        } else {
          return { success: false, error: '请填写有效的邮箱、密码(至少6位)和姓名' };
        }
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-010255fd/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ email, password, name })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      return { success: true };
    } catch (error) {
      console.log('Registration error:', error);
      return { success: false, error: 'Network error during registration' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // 演示模式下的登录逻辑
      if (isDemoMode) {
        if (email === 'demo@bloodontheclocktower.com' && password === 'demo123456') {
          setUser({
            id: 'demo-user-id',
            email: 'demo@bloodontheclocktower.com',
            name: '演示用户',
            avatar: undefined,
            bio: '血染钟楼爱好者',
            createdAt: '2024-01-01T00:00:00Z',
            lastLoginAt: new Date().toISOString(),
            uploadCount: 5,
            favoriteCount: 12
          });
          return { success: true };
        } else {
          return { success: false, error: '演示模式仅支持账号: demo@bloodontheclocktower.com / demo123456' };
        }
      }

      if (!supabase) {
        return { success: false, error: 'Authentication service not available' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || data.session.user.email || '',
          avatar: data.session.user.user_metadata?.avatar
        });
      }

      return { success: true };
    } catch (error) {
      console.log('Login error:', error);
      return { success: false, error: 'Network error during login' };
    }
  };

  const logout = async () => {
    try {
      // 演示模式下直接登出
      if (isDemoMode) {
        setUser(null);
        return;
      }

      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      // 演示模式下直接更新本地状态
      if (isDemoMode) {
        if (user) {
          setUser({ ...user, ...data });
        }
        return;
      }

      if (!supabase || !user) {
        throw new Error('User not authenticated');
      }

      // 更新 Supabase 用户元数据
      const { error } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          avatar: data.avatar,
          bio: data.bio
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // 更新本地状态
      setUser({ ...user, ...data });
    } catch (error) {
      console.log('Update profile error:', error);
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // 演示模式下模拟成功
      if (isDemoMode) {
        return;
      }

      if (!supabase || !user) {
        throw new Error('User not authenticated');
      }

      // 更新密码
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.log('Update password error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, getAccessToken, updateProfile, updatePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
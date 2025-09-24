import React, { useState, useEffect } from 'react'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { Dashboard } from './components/Dashboard'
import { supabase } from './utils/supabase/client'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner@2.0.3'

type AppState = 'login' | 'register' | 'dashboard'

export default function App() {
  const [appState, setAppState] = useState<AppState>('login')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 检查用户是否已经登录
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('检查会话时出现错误:', error)
        } else if (session?.access_token) {
          setAccessToken(session.access_token)
          setAppState('dashboard')
        }
      } catch (error) {
        console.log('检查用户会话失败:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.access_token) {
          setAccessToken(session.access_token)
          setAppState('dashboard')
          toast.success('登录成功！')
        } else if (event === 'SIGNED_OUT') {
          setAccessToken(null)
          setAppState('login')
          toast.info('您已成功登出')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLoginSuccess = (token: string) => {
    setAccessToken(token)
    setAppState('dashboard')
  }

  const handleRegisterSuccess = () => {
    setAppState('login')
    toast.success('注册成功！请使用您的账户登录')
  }

  const handleLogout = () => {
    setAccessToken(null)
    setAppState('login')
  }

  const switchToRegister = () => {
    setAppState('register')
  }

  const switchToLogin = () => {
    setAppState('login')
  }

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 根据应用状态渲染不同组件
  const renderContent = () => {
    switch (appState) {
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={switchToRegister}
          />
        )
      case 'register':
        return (
          <Register 
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )
      case 'dashboard':
        return (
          <Dashboard 
            accessToken={accessToken!}
            onLogout={handleLogout}
          />
        )
      default:
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={switchToRegister}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
      <Toaster position="top-right" />
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { DashboardContent } from './DashboardContent'
import { supabase } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface DashboardProps {
  accessToken: string
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ accessToken, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userName, setUserName] = useState('用户')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/user`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.user?.user_metadata?.name) {
            setUserName(data.user.user_metadata.name)
          }
        }
      } catch (error) {
        console.log('获取用户信息失败:', error)
      }
    }

    fetchUserInfo()
  }, [accessToken])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.log('登出错误:', error)
    } finally {
      onLogout()
    }
  }

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu)
    setIsMobileMenuOpen(false)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 桌面版侧边栏 */}
      <div className="hidden md:block">
        <Sidebar
          activeMenu={activeMenu}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* 移动版侧边栏遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* 移动版侧边栏 */}
      <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          activeMenu={activeMenu}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          collapsed={false}
          onToggleCollapse={() => {}}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          userName={userName} 
          onMenuToggle={toggleMobileMenu}
        />
        <main className="flex-1 overflow-y-auto">
          <DashboardContent activeMenu={activeMenu} accessToken={accessToken} />
        </main>
      </div>
    </div>
  )
}
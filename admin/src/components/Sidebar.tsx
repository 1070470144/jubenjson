import React from 'react'
import { Button } from './ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Database, 
  BarChart3, 
  FileText, 
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Crown,
  Download
} from 'lucide-react'

interface SidebarProps {
  activeMenu: string
  onMenuClick: (menu: string) => void
  onLogout: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeMenu, 
  onMenuClick, 
  onLogout, 
  collapsed, 
  onToggleCollapse 
}) => {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { id: 'scripts', label: '剧本管理', icon: BookOpen },
    { id: 'characters', label: '角色管理', icon: Crown },
    { id: 'import-export', label: '导入导出', icon: Download },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'data', label: '数据管理', icon: Database },
    { id: 'sync', label: '数据同步', icon: RefreshCw },
    { id: 'setup', label: '项目设置', icon: Plus },
    { id: 'analytics', label: '数据分析', icon: BarChart3 },
    { id: 'documents', label: '文档管理', icon: FileText },
    { id: 'settings', label: '系统设置', icon: Settings },
  ]

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* 顶部 Logo 区域 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">血染钟楼管理</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-1 h-8 w-8"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${collapsed ? 'px-2' : 'px-3'} h-10`}
                  onClick={() => onMenuClick(item.id)}
                >
                  <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 底部登出按钮 */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={`w-full justify-start ${collapsed ? 'px-2' : 'px-3'} h-10 text-red-600 hover:text-red-700 hover:bg-red-50`}
          onClick={onLogout}
        >
          <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span>退出登录</span>}
        </Button>
      </div>
    </div>
  )
}
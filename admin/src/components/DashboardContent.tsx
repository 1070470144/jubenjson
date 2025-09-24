import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { UserManagement } from './UserManagement'
import { DataManagement } from './DataManagement'
import { SystemSettings } from './SystemSettings'
import { DataAnalytics } from './DataAnalytics'
import { DocumentManagement } from './DocumentManagement'
import { ScriptManagement } from './ScriptManagement'
import { CharacterManagement } from './CharacterManagement'
import { ScriptImportExport } from './ScriptImportExport'
import { DataSyncManager } from './DataSyncManager'
import { ProjectSetup } from './ProjectSetup'
import { projectId } from '../utils/supabase/info'
import { 
  Users, 
  Database, 
  Activity, 
  TrendingUp, 
  ArrowUpIcon, 
  ArrowDownIcon,
  BookOpen 
} from 'lucide-react'

interface DashboardContentProps {
  activeMenu: string
  accessToken: string
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ activeMenu, accessToken }) => {
  const [stats, setStats] = React.useState([
    {
      title: '总用户数',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: '数据库记录',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: '系统活跃度',
      value: '0%',
      change: '+0%',
      trend: 'up',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: '月增长率',
      value: '0%',
      change: '+0%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ])
  const [loading, setLoading] = React.useState(true)

  // 获取实时统计数据
  const fetchDashboardStats = async () => {
    try {
      // 获取剧本数据
      const scriptsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/scripts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      // 获取用户数据
      const usersResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      // 获取数据记录
      const dataResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      let scripts: any[] = []
      let users: any[] = []
      let dataRecords: any[] = []

      if (scriptsResponse.ok) {
        const scriptsData = await scriptsResponse.json()
        scripts = scriptsData.scripts || []
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        users = usersData.users || []
      }

      if (dataResponse.ok) {
        const recordsData = await dataResponse.json()
        dataRecords = recordsData.records || []
      }

      // 计算剧本统计数据
      const totalScripts = scripts.length
      const totalCharacters = scripts.reduce((acc, script) => acc + (script.characters?.length || 0), 0)
      const publicScripts = scripts.filter(script => script.is_public).length
      const avgCharactersPerScript = totalScripts > 0 ? Math.round(totalCharacters / totalScripts) : 0

      setStats([
        {
          title: '剧本总数',
          value: totalScripts.toString(),
          change: '+12%',
          trend: 'up',
          icon: BookOpen,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        },
        {
          title: '角色总数',
          value: totalCharacters.toString(),
          change: '+18%',
          trend: 'up',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: '公开剧本',
          value: publicScripts.toString(),
          change: '+5%',
          trend: 'up',
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: '平均角色数',
          value: avgCharactersPerScript.toString(),
          change: '+3%',
          trend: 'up',
          icon: Activity,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        }
      ])
    } catch (error) {
      console.log('获取仪表盘统计数据出现错误:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchDashboardStats()
    }
  }, [activeMenu, accessToken])

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {stat.trend === 'up' ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">较上月</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 剧本概览 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>血染钟楼剧本概览</CardTitle>
            <CardDescription>管理您的剧本和角色配置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 剧本统计 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats[0]?.value || '0'}</div>
                <div className="text-sm text-gray-600">剧本总数</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats[1]?.value || '0'}</div>
                <div className="text-sm text-gray-600">角色总数</div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-4">快速操作</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => window.location.hash = 'scripts'}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  创建剧本
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => window.location.hash = 'characters'}
                >
                  <Users className="h-4 w-4 mr-2" />
                  管理角色
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => window.location.hash = 'analytics'}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  查看统计
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => window.location.hash = 'documents'}
                >
                  <Database className="h-4 w-4 mr-2" />
                  导入导出
                </Button>
              </div>
            </div>

            {/* 阵营分布 */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-4">角色阵营分布</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">村民</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8">60%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">外来者</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8">15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-red-600" />
                    <span className="text-sm">爪牙</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8">20%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">恶魔</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '5%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>剧本和系统最新动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '2分钟前', action: '新剧本创建', detail: '"基础版三版"', icon: BookOpen },
                { time: '15分钟前', action: '角色信息更新', detail: '占卜师能力修改', icon: Users },
                { time: '1小时前', action: '剧本导出', detail: 'TB剧本 v2.1', icon: Database },
                { time: '2小时前', action: '用户登录', detail: 'admin@example.com', icon: Activity },
                { time: '今天上午', action: '系统维护', detail: '定期数据备份', icon: TrendingUp }
              ].map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-1 rounded-full bg-gray-100">
                      <Icon className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.detail}</p>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderGenericContent = (title: string, description: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          此功能模块正在开发中，您可以在这里添加相应的业务逻辑和组件。
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            提示：这是一个通用的后台管理系统框架，您可以根据实际需求：
          </p>
          <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
            <li>添加数据表格和 CRUD 操作</li>
            <li>集成第三方 API 和服务</li>
            <li>添加图表和数据可视化</li>
            <li>实现文件上传和管理</li>
            <li>配置用户权限和角色</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )

  // 根据活跃菜单渲染内容
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return renderDashboard()
      case 'scripts':
        return <ScriptManagement accessToken={accessToken} />
      case 'characters':
        return <CharacterManagement accessToken={accessToken} />
      case 'import-export':
        return <ScriptImportExport accessToken={accessToken} />
      case 'users':
        return <UserManagement accessToken={accessToken} />
      case 'data':
        return <DataManagement accessToken={accessToken} />
      case 'analytics':
        return <DataAnalytics accessToken={accessToken} />
      case 'documents':
        return <DocumentManagement accessToken={accessToken} />
      case 'settings':
        return <SystemSettings accessToken={accessToken} />
      case 'sync':
        return <DataSyncManager accessToken={accessToken} />
      case 'setup':
        return <ProjectSetup accessToken={accessToken} />
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  )
}
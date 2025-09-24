import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Database,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react'

interface DataAnalyticsProps {
  accessToken: string
}

interface AnalyticsData {
  userStats: {
    total: number
    active: number
    newThisMonth: number
    verified: number
  }
  dataStats: {
    totalRecords: number
    byType: { [key: string]: number }
    recentActivity: number
  }
  timeSeriesData: Array<{
    date: string
    users: number
    data: number
    activity: number
  }>
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

export const DataAnalytics: React.FC<DataAnalyticsProps> = ({ accessToken }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7days')
  const [refreshing, setRefreshing] = useState(false)

  // 获取分析数据
  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
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

      let users: any[] = []
      let dataRecords: any[] = []

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        users = usersData.users || []
      }

      if (dataResponse.ok) {
        const recordsData = await dataResponse.json()
        dataRecords = recordsData.records || []
      }

      // 处理用户统计
      const userStats = {
        total: users.length,
        active: users.filter(user => user.last_sign_in_at).length,
        newThisMonth: users.filter(user => {
          const createdAt = new Date(user.created_at)
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          return createdAt >= startOfMonth
        }).length,
        verified: users.filter(user => user.email_confirmed_at).length
      }

      // 处理数据统计
      const typeStats: { [key: string]: number } = {}
      dataRecords.forEach(record => {
        typeStats[record.type] = (typeStats[record.type] || 0) + 1
      })

      const dataStats = {
        totalRecords: dataRecords.length,
        byType: typeStats,
        recentActivity: dataRecords.filter(record => {
          const updatedAt = new Date(record.updated_at || record.created_at)
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return updatedAt >= dayAgo
        }).length
      }

      // 生成时间序列数据（模拟数据，实际应用中应从真实数据生成）
      const timeSeriesData = generateTimeSeriesData(timeRange, users, dataRecords)

      setAnalyticsData({
        userStats,
        dataStats,
        timeSeriesData
      })

    } catch (error) {
      console.log('获取分析数据时出现错误:', error)
      toast.error('获取分析数据失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 生成时间序列数据
  const generateTimeSeriesData = (range: string, users: any[], records: any[]) => {
    const days = range === '7days' ? 7 : range === '30days' ? 30 : 90
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      // 模拟数据增长
      const userCount = Math.max(0, users.length - Math.floor(Math.random() * i * 2))
      const dataCount = Math.max(0, records.length - Math.floor(Math.random() * i * 3))
      const activityCount = Math.floor(Math.random() * 50 + 10)
      
      data.push({
        date: dateStr,
        users: userCount,
        data: dataCount,
        activity: activityCount
      })
    }
    
    return data
  }

  // 刷新数据
  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalyticsData()
  }

  // 导出数据
  const handleExport = () => {
    if (!analyticsData) return
    
    const data = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...analyticsData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('数据导出成功')
  }

  // 格式化数据类型统计为饼图数据
  const formatPieData = (dataStats: any) => {
    return Object.entries(dataStats.byType).map(([type, count], index) => ({
      name: type,
      value: count as number,
      color: COLORS[index % COLORS.length]
    }))
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [accessToken, timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">暂无分析数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                数据分析
              </CardTitle>
              <CardDescription>系统数据统计分析和可视化</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7天</SelectItem>
                  <SelectItem value="30days">30天</SelectItem>
                  <SelectItem value="90days">90天</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.userStats.total}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{analyticsData.userStats.newThisMonth} 本月新增
                </p>
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
                <p className="text-sm font-medium text-gray-600">活跃用户</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.userStats.active}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {Math.round((analyticsData.userStats.active / analyticsData.userStats.total) * 100)}% 活跃率
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">数据记录</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.dataStats.totalRecords}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {analyticsData.dataStats.recentActivity} 近24小时活动
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">验证用户</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.userStats.verified}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {Math.round((analyticsData.userStats.verified / analyticsData.userStats.total) * 100)}% 验证率
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends" className="flex items-center">
            <LineChartIcon className="h-4 w-4 mr-2" />
            趋势分析
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2" />
            分布统计
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            活动分析
          </TabsTrigger>
        </TabsList>

        {/* 趋势分析 */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>用户增长趋势</CardTitle>
                <CardDescription>用户数量随时间变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>数据增长趋势</CardTitle>
                <CardDescription>数据记录数量变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="data" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 分布统计 */}
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>数据类型分布</CardTitle>
                <CardDescription>不同数据类型的占比分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(analyticsData.dataStats)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {formatPieData(analyticsData.dataStats).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center mt-4 gap-2">
                  {formatPieData(analyticsData.dataStats).map((entry, index) => (
                    <Badge key={index} variant="outline" className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}: {entry.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>用户状态分布</CardTitle>
                <CardDescription>用户验证和活跃状态统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">已验证用户</span>
                      <span className="text-sm text-gray-500">
                        {analyticsData.userStats.verified}/{analyticsData.userStats.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(analyticsData.userStats.verified / analyticsData.userStats.total) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">活跃用户</span>
                      <span className="text-sm text-gray-500">
                        {analyticsData.userStats.active}/{analyticsData.userStats.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(analyticsData.userStats.active / analyticsData.userStats.total) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">本月新用户</span>
                      <span className="text-sm text-gray-500">
                        {analyticsData.userStats.newThisMonth}/{analyticsData.userStats.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(analyticsData.userStats.newThisMonth / analyticsData.userStats.total) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 活动分析 */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>系统活动统计</CardTitle>
              <CardDescription>系统各项活动的时间分布</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                  />
                  <Bar dataKey="activity" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
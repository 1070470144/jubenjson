/**
 * 数据同步管理组件
 * 提供可视化的跨项目数据同步管理界面
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, Share2 } from 'lucide-react'
import { dataManager, CrossProjectDataManager } from '../utils/supabase/shared-client'
import { sharedSupabaseConfig } from '../utils/supabase/shared-config'
import { toast } from 'sonner@2.0.3'

interface SyncStatus {
  namespace: string
  table: string
  lastSync: string
  status: 'success' | 'pending' | 'error'
  recordCount: number
}

interface DataRecord {
  key: string
  value: any
  namespace: string
  table: string
  created_at: string
  updated_at: string
  synced_from?: string
  synced_at?: string
}

export function DataSyncManager({ accessToken }: { accessToken: string }) {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [crossProjectData, setCrossProjectData] = useState<Record<string, DataRecord[]>>({})
  const [loading, setLoading] = useState(false)
  const [selectedNamespace, setSelectedNamespace] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [syncKey, setSyncKey] = useState('')
  const [syncValue, setSyncValue] = useState('')
  const [targetNamespace, setTargetNamespace] = useState('')

  // 获取所有命名空间
  const namespaces = Object.keys(sharedSupabaseConfig.namespaces)
  const currentNamespace = dataManager.currentNamespace || 'botc'

  useEffect(() => {
    loadSyncStatuses()
    loadCrossProjectData()
  }, [])

  const loadSyncStatuses = async () => {
    setLoading(true)
    try {
      const statuses: SyncStatus[] = []
      
      for (const namespace of namespaces) {
        const config = sharedSupabaseConfig.namespaces[namespace]
        const tables = Object.keys(config.tables)
        
        for (const table of tables) {
          try {
            const data = await dataManager.getAllNamespaceData(table)
            const namespaceData = data[namespace] || []
            
            statuses.push({
              namespace,
              table,
              lastSync: new Date().toISOString(),
              status: 'success',
              recordCount: namespaceData.length
            })
          } catch (error) {
            statuses.push({
              namespace,
              table,
              lastSync: new Date().toISOString(),
              status: 'error',
              recordCount: 0
            })
          }
        }
      }
      
      setSyncStatuses(statuses)
    } catch (error) {
      console.error('加载同步状态失败:', error)
      toast.error('加载同步状态失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCrossProjectData = async () => {
    try {
      const allData = await dataManager.getAllNamespaceData('')
      setCrossProjectData(allData)
    } catch (error) {
      console.error('加载跨项目数据失败:', error)
    }
  }

  const handleSyncData = async () => {
    if (!selectedNamespace || !selectedTable || !syncKey || !targetNamespace) {
      toast.error('请填写所有必要字段')
      return
    }

    try {
      setLoading(true)
      
      let value
      try {
        value = JSON.parse(syncValue)
      } catch {
        value = syncValue
      }

      const success = await dataManager.syncToProject(targetNamespace, selectedTable, syncKey, value)
      
      if (success) {
        toast.success('数据同步成功')
        await loadCrossProjectData()
        await loadSyncStatuses()
      } else {
        toast.error('数据同步失败')
      }
    } catch (error) {
      console.error('同步数据失败:', error)
      toast.error('同步数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGetCrossProjectData = async (namespace: string, table: string, key: string) => {
    try {
      const data = await dataManager.getCrossProjectData(namespace, table, key)
      setSyncValue(JSON.stringify(data, null, 2))
      toast.success('数据获取成功')
    } catch (error) {
      console.error('获取跨项目数据失败:', error)
      toast.error('获取数据失败')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>数据同步管理</h2>
          <p className="text-muted-foreground">
            管理跨项目的数据同步和共享，当前命名空间：{currentNamespace}
          </p>
        </div>
        <Button
          onClick={loadSyncStatuses}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新状态
        </Button>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList>
          <TabsTrigger value="status">同步状态</TabsTrigger>
          <TabsTrigger value="sync">数据同步</TabsTrigger>
          <TabsTrigger value="browse">数据浏览</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                命名空间同步状态
              </CardTitle>
              <CardDescription>
                查看各个项目命名空间的数据同步状态和统计信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>命名空间</TableHead>
                    <TableHead>数据表</TableHead>
                    <TableHead>记录数</TableHead>
                    <TableHead>最后同步</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncStatuses.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">{status.namespace}</Badge>
                      </TableCell>
                      <TableCell>{status.table}</TableCell>
                      <TableCell>{status.recordCount}</TableCell>
                      <TableCell>
                        {new Date(status.lastSync).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status.status)}
                          <Badge className={getStatusColor(status.status)}>
                            {status.status}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                跨项目数据同步
              </CardTitle>
              <CardDescription>
                在不同项目之间同步数据，支持单向和双向同步
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source-namespace">源命名空间</Label>
                  <Select
                    value={selectedNamespace}
                    onValueChange={setSelectedNamespace}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择源命名空间" />
                    </SelectTrigger>
                    <SelectContent>
                      {namespaces.map(ns => (
                        <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-namespace">目标命名空间</Label>
                  <Select
                    value={targetNamespace}
                    onValueChange={setTargetNamespace}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标命名空间" />
                    </SelectTrigger>
                    <SelectContent>
                      {namespaces.map(ns => (
                        <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="table">数据表</Label>
                  <Select
                    value={selectedTable}
                    onValueChange={setSelectedTable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择数据表" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedNamespace && 
                        Object.keys(sharedSupabaseConfig.namespaces[selectedNamespace]?.tables || {}).map(table => (
                          <SelectItem key={table} value={table}>{table}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sync-key">数据键</Label>
                  <Input
                    id="sync-key"
                    value={syncKey}
                    onChange={(e) => setSyncKey(e.target.value)}
                    placeholder="输入要同步的数据键"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sync-value">数据值（JSON格式）</Label>
                <Textarea
                  id="sync-value"
                  value={syncValue}
                  onChange={(e) => setSyncValue(e.target.value)}
                  placeholder="输入要同步的数据值（JSON格式）"
                  rows={6}
                />
              </div>

              <Button
                onClick={handleSyncData}
                disabled={loading}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                执行同步
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                跨项目数据浏览
              </CardTitle>
              <CardDescription>
                浏览和查看所有项目的数据，支持跨项目数据访问
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(crossProjectData).map(([namespace, records]) => (
                  <div key={namespace} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Badge variant="outline">{namespace}</Badge>
                        共 {records.length} 条记录
                      </h4>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>键</TableHead>
                            <TableHead>表</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>更新时间</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.slice(0, 5).map((record, index) => (
                            <TableRow key={index}>
                              <TableCell className="max-w-[200px] truncate">
                                {record.key}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{record.table}</Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(record.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {new Date(record.updated_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGetCrossProjectData(namespace, record.table, record.key)}
                                >
                                  查看
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {records.length > 5 && (
                        <div className="p-4 text-center text-sm text-muted-foreground border-t">
                          还有 {records.length - 5} 条记录...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {Object.keys(crossProjectData).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无跨项目数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
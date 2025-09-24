import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Skeleton } from './ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react'

interface DataRecord {
  key: string
  value: any
  type: string
  created_at: string
  updated_at: string
}

interface DataManagementProps {
  accessToken: string
}

export const DataManagement: React.FC<DataManagementProps> = ({ accessToken }) => {
  const [records, setRecords] = useState<DataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null)
  
  // 表单数据
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'string'
  })

  // 获取数据记录
  const fetchRecords = async () => {
    setLoading(true)
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

      if (!response.ok) {
        console.log('获取数据记录错误:', data)
        toast.error(data.error || '获取数据失败')
        return
      }

      setRecords(data.records || [])
    } catch (error) {
      console.log('获取数据记录时出现错误:', error)
      toast.error('获取数据时出现错误')
    } finally {
      setLoading(false)
    }
  }

  // 添加数据记录
  const handleAddRecord = async () => {
    if (!formData.key.trim()) {
      toast.error('请输入数据键名')
      return
    }

    try {
      let processedValue = formData.value
      
      // 根据类型处理值
      if (formData.type === 'json') {
        try {
          processedValue = JSON.parse(formData.value)
        } catch {
          toast.error('JSON格式不正确')
          return
        }
      } else if (formData.type === 'number') {
        processedValue = Number(formData.value)
        if (isNaN(processedValue)) {
          toast.error('数字格式不正确')
          return
        }
      } else if (formData.type === 'boolean') {
        processedValue = formData.value.toLowerCase() === 'true'
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            key: formData.key,
            value: processedValue
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('添加数据记录错误:', data)
        toast.error(data.error || '添加数据失败')
        return
      }

      toast.success('数据添加成功')
      setIsAddDialogOpen(false)
      setFormData({ key: '', value: '', type: 'string' })
      fetchRecords()
    } catch (error) {
      console.log('添加数据记录时出现错误:', error)
      toast.error('添加数据时出现错误')
    }
  }

  // 更新数据记录
  const handleUpdateRecord = async () => {
    if (!editingRecord || !formData.key.trim()) {
      return
    }

    try {
      let processedValue = formData.value
      
      // 根据类型处理值
      if (formData.type === 'json') {
        try {
          processedValue = JSON.parse(formData.value)
        } catch {
          toast.error('JSON格式不正确')
          return
        }
      } else if (formData.type === 'number') {
        processedValue = Number(formData.value)
        if (isNaN(processedValue)) {
          toast.error('数字格式不正确')
          return
        }
      } else if (formData.type === 'boolean') {
        processedValue = formData.value.toLowerCase() === 'true'
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data/${editingRecord.key}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            value: processedValue
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('更新数据记录错误:', data)
        toast.error(data.error || '更新数据失败')
        return
      }

      toast.success('数据更新成功')
      setIsEditDialogOpen(false)
      setEditingRecord(null)
      setFormData({ key: '', value: '', type: 'string' })
      fetchRecords()
    } catch (error) {
      console.log('更新数据记录时出现错误:', error)
      toast.error('更新数据时出现错误')
    }
  }

  // 删除数据记录
  const handleDeleteRecord = async (key: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data/${key}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('删除数据记录错误:', data)
        toast.error(data.error || '删除数据失败')
        return
      }

      toast.success('数据删除成功')
      fetchRecords()
    } catch (error) {
      console.log('删除数据记录时出现错误:', error)
      toast.error('删除数据时出现错误')
    }
  }

  // 打开编辑对话框
  const openEditDialog = (record: DataRecord) => {
    setEditingRecord(record)
    setFormData({
      key: record.key,
      value: typeof record.value === 'object' ? JSON.stringify(record.value, null, 2) : String(record.value),
      type: record.type
    })
    setIsEditDialogOpen(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({ key: '', value: '', type: 'string' })
    setEditingRecord(null)
  }

  // 格式化值显示
  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '空值'
    
    if (type === 'json') {
      return JSON.stringify(value, null, 2)
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  // 获取数据类型
  const getDataType = (value: any): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'object') return 'json'
    return 'string'
  }

  // 过滤数据
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(record.value).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || record.type === filterType
    return matchesSearch && matchesFilter
  })

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  useEffect(() => {
    fetchRecords()
  }, [accessToken])

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总记录数</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">字符串类型</p>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => r.type === 'string').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">JSON对象</p>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => r.type === 'json').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">其他类型</p>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => !['string', 'json'].includes(r.type)).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据管理界面 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>数据管理</CardTitle>
              <CardDescription>管理系统中的键值对数据记录</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchRecords} variant="outline" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加数据
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>添加数据记录</DialogTitle>
                    <DialogDescription>创建新的键值对数据记录</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="key">键名</Label>
                      <Input
                        id="key"
                        value={formData.key}
                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                        placeholder="请输入键名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">数据类型</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">字符串</SelectItem>
                          <SelectItem value="number">数字</SelectItem>
                          <SelectItem value="boolean">布尔值</SelectItem>
                          <SelectItem value="json">JSON对象</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">值</Label>
                      <Textarea
                        id="value"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder={
                          formData.type === 'json' ? '{"key": "value"}' :
                          formData.type === 'boolean' ? 'true 或 false' :
                          formData.type === 'number' ? '123' :
                          '请输入值'
                        }
                        rows={formData.type === 'json' ? 6 : 3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button onClick={handleAddRecord}>
                      添加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和过滤 */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索键名或值..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="string">字符串</SelectItem>
                <SelectItem value="number">数字</SelectItem>
                <SelectItem value="boolean">布尔值</SelectItem>
                <SelectItem value="json">JSON对象</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 数据表格 */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>键名</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>值</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {searchTerm || filterType !== 'all' ? '没有找到匹配的数据' : '暂无数据记录'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.key}>
                        <TableCell className="font-medium">{record.key}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {formatValue(record.value, record.type)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(record.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除数据</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    您确定要删除键名为 "{record.key}" 的数据记录吗？此操作无法撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteRecord(record.key)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑数据对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑数据记录</DialogTitle>
            <DialogDescription>修改数据记录的值</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editKey">键名</Label>
              <Input
                id="editKey"
                value={formData.key}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editType">数据类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">字符串</SelectItem>
                  <SelectItem value="number">数字</SelectItem>
                  <SelectItem value="boolean">布尔值</SelectItem>
                  <SelectItem value="json">JSON对象</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editValue">值</Label>
              <Textarea
                id="editValue"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                rows={formData.type === 'json' ? 6 : 3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleUpdateRecord}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
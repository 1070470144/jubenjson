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
import { Separator } from './ui/separator'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  FileText,
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Users,
  Skull,
  Shield,
  Crown,
  Zap,
  BookOpen,
  Settings,
  Copy,
  CheckCircle
} from 'lucide-react'

interface Character {
  id: string
  name: string
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler'
  ability: string
  flavor?: string
  firstNight?: number
  otherNight?: number
  reminders?: string[]
  setup?: boolean
}

interface Script {
  id: string
  name: string
  author: string
  version: string
  description: string
  characters: Character[]
  created_at: string
  updated_at: string
  is_public: boolean
  tags: string[]
}

interface ScriptManagementProps {
  accessToken: string
}

const teamColors = {
  townsfolk: 'bg-blue-100 text-blue-800',
  outsider: 'bg-yellow-100 text-yellow-800', 
  minion: 'bg-red-100 text-red-800',
  demon: 'bg-purple-100 text-purple-800',
  traveler: 'bg-green-100 text-green-800'
}

const teamIcons = {
  townsfolk: Users,
  outsider: Shield,
  minion: Skull,
  demon: Crown,
  traveler: Zap
}

const teamNames = {
  townsfolk: '村民',
  outsider: '外来者',
  minion: '爪牙',
  demon: '恶魔',
  traveler: '旅行者'
}

export const ScriptManagement: React.FC<ScriptManagementProps> = ({ accessToken }) => {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTeam, setFilterTeam] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [viewingScript, setViewingScript] = useState<Script | null>(null)
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    author: '',
    version: '1.0.0',
    description: '',
    is_public: false,
    tags: '',
    characters: [] as Character[]
  })

  // 获取剧本列表
  const fetchScripts = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/scripts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('获取剧本列表错误:', data)
        toast.error(data.error || '获取剧本失败')
        return
      }

      setScripts(data.scripts || [])
    } catch (error) {
      console.log('获取剧本列表时出现错误:', error)
      toast.error('获取剧本时出现错误')
    } finally {
      setLoading(false)
    }
  }

  // 添加剧本
  const handleAddScript = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入剧本名称')
      return
    }

    try {
      const scriptData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/scripts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(scriptData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('添加剧本错误:', data)
        toast.error(data.error || '添加剧本失败')
        return
      }

      toast.success('剧本添加成功')
      setIsAddDialogOpen(false)
      resetForm()
      fetchScripts()
    } catch (error) {
      console.log('添加剧本时出现错误:', error)
      toast.error('添加剧本时出现错误')
    }
  }

  // 更新剧本
  const handleUpdateScript = async () => {
    if (!editingScript || !formData.name.trim()) {
      return
    }

    try {
      const scriptData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/scripts/${editingScript.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(scriptData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('更新剧本错误:', data)
        toast.error(data.error || '更新剧本失败')
        return
      }

      toast.success('剧本更新成功')
      setIsEditDialogOpen(false)
      setEditingScript(null)
      resetForm()
      fetchScripts()
    } catch (error) {
      console.log('更新剧本时出现错误:', error)
      toast.error('更新剧本时出现错误')
    }
  }

  // 删除剧本
  const handleDeleteScript = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/scripts/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('删除剧本错误:', data)
        toast.error(data.error || '删除剧本失败')
        return
      }

      toast.success('剧本删除成功')
      fetchScripts()
    } catch (error) {
      console.log('删除剧本时出现错误:', error)
      toast.error('删除剧本时出现错误')
    }
  }

  // 导入JSON剧本
  const handleImportScript = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const scriptData = JSON.parse(text)
      
      // 验证剧本数据格式
      if (!scriptData.name || !Array.isArray(scriptData.characters)) {
        toast.error('无效的剧本文件格式')
        return
      }

      // 填充表单数据
      setFormData({
        name: scriptData.name || '',
        author: scriptData.author || '',
        version: scriptData.version || '1.0.0',
        description: scriptData.description || '',
        is_public: scriptData.is_public || false,
        tags: Array.isArray(scriptData.tags) ? scriptData.tags.join(', ') : '',
        characters: scriptData.characters || []
      })

      setIsAddDialogOpen(true)
      toast.success('剧本文件导入成功，请检查并保存')
    } catch (error) {
      console.log('导入剧本文件错误:', error)
      toast.error('导入剧本文件失败，请检查文件格式')
    }

    // 重置文件输入
    event.target.value = ''
  }

  // 导出剧本为JSON
  const handleExportScript = (script: Script) => {
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${script.name}-v${script.version}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('剧本导出成功')
  }

  // 复制剧本
  const handleCopyScript = (script: Script) => {
    setFormData({
      name: script.name + ' (副本)',
      author: script.author,
      version: '1.0.0',
      description: script.description,
      is_public: false,
      tags: script.tags.join(', '),
      characters: script.characters
    })
    setIsAddDialogOpen(true)
  }

  // 查看剧本详情
  const openViewDialog = (script: Script) => {
    setViewingScript(script)
    setIsViewDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (script: Script) => {
    setEditingScript(script)
    setFormData({
      name: script.name,
      author: script.author,
      version: script.version,
      description: script.description,
      is_public: script.is_public,
      tags: script.tags.join(', '),
      characters: script.characters
    })
    setIsEditDialogOpen(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      author: '',
      version: '1.0.0',
      description: '',
      is_public: false,
      tags: '',
      characters: []
    })
    setEditingScript(null)
  }

  // 过滤剧本
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterTeam === 'all') return matchesSearch
    
    const hasTeam = script.characters.some(char => char.team === filterTeam)
    return matchesSearch && hasTeam
  })

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 统计角色数量
  const getCharacterStats = (characters: Character[]) => {
    const stats = {
      townsfolk: 0,
      outsider: 0, 
      minion: 0,
      demon: 0,
      traveler: 0
    }
    
    characters.forEach(char => {
      stats[char.team]++
    })
    
    return stats
  }

  useEffect(() => {
    fetchScripts()
  }, [accessToken])

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总剧本数</p>
                <p className="text-2xl font-bold text-gray-900">{scripts.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">公开剧本</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scripts.filter(script => script.is_public).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总角色数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scripts.reduce((acc, script) => acc + script.characters.length, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均角色数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scripts.length > 0 ? Math.round(scripts.reduce((acc, script) => acc + script.characters.length, 0) / scripts.length) : 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 剧本管理界面 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>血染钟楼剧本管理</CardTitle>
              <CardDescription>管理血染钟楼游戏剧本和角色配置</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button asChild variant="outline">
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  导入剧本
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportScript}
                  />
                </label>
              </Button>
              <Button onClick={fetchScripts} variant="outline" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建剧本
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>新建剧本</DialogTitle>
                    <DialogDescription>创建新的血染钟楼剧本</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">剧本名称</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="请输入剧本名称"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">作者</Label>
                        <Input
                          id="author"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          placeholder="请输入作者名称"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="version">版本</Label>
                        <Input
                          id="version"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                          placeholder="1.0.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">标签</Label>
                        <Input
                          id="tags"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="用逗号分隔，如：官方,进阶,实验性"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="请输入剧本描述"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is_public">公开剧本</Label>
                    </div>
                    {formData.characters.length > 0 && (
                      <div className="space-y-2">
                        <Label>角色列表 ({formData.characters.length}个角色)</Label>
                        <div className="max-h-40 overflow-y-auto border rounded p-2">
                          {formData.characters.map((char, index) => {
                            const TeamIcon = teamIcons[char.team]
                            return (
                              <div key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center space-x-2">
                                  <TeamIcon className="h-4 w-4" />
                                  <span className="font-medium">{char.name}</span>
                                  <Badge className={teamColors[char.team]}>
                                    {teamNames[char.team]}
                                  </Badge>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button onClick={handleAddScript}>
                      创建剧本
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
                placeholder="搜索剧本名称、作者或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有阵营</SelectItem>
                <SelectItem value="townsfolk">村民</SelectItem>
                <SelectItem value="outsider">外来者</SelectItem>
                <SelectItem value="minion">爪牙</SelectItem>
                <SelectItem value="demon">恶魔</SelectItem>
                <SelectItem value="traveler">旅行者</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 剧本列表 */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>剧本信息</TableHead>
                    <TableHead>角色统计</TableHead>
                    <TableHead>版本</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScripts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm || filterTeam !== 'all' ? '没有找到匹配��剧本' : '暂无剧本数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredScripts.map((script) => {
                      const stats = getCharacterStats(script.characters)
                      return (
                        <TableRow key={script.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{script.name}</p>
                              <p className="text-sm text-gray-500">作者：{script.author}</p>
                              {script.tags.length > 0 && (
                                <div className="flex space-x-1 mt-1">
                                  {script.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm">
                                <Users className="h-3 w-3 text-blue-600" />
                                <span>{stats.townsfolk}</span>
                                <Shield className="h-3 w-3 text-yellow-600" />
                                <span>{stats.outsider}</span>
                                <Skull className="h-3 w-3 text-red-600" />
                                <span>{stats.minion}</span>
                                <Crown className="h-3 w-3 text-purple-600" />
                                <span>{stats.demon}</span>
                                {stats.traveler > 0 && (
                                  <>
                                    <Zap className="h-3 w-3 text-green-600" />
                                    <span>{stats.traveler}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                总计 {script.characters.length} 个角色
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">v{script.version}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={script.is_public ? "default" : "secondary"}>
                              {script.is_public ? '公开' : '私有'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(script.updated_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(script)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(script)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyScript(script)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportScript(script)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除剧本</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您确定要删除剧本 "{script.name}" 吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteScript(script.id)}
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
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看剧本详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>剧本详情：{viewingScript?.name}</DialogTitle>
            <DialogDescription>
              作者：{viewingScript?.author} | 版本：{viewingScript?.version}
            </DialogDescription>
          </DialogHeader>
          {viewingScript && (
            <div className="space-y-6">
              <div>
                <h4>剧本描述</h4>
                <p className="text-gray-600 mt-1">{viewingScript.description || '暂无描述'}</p>
              </div>
              
              {viewingScript.tags.length > 0 && (
                <div>
                  <h4>标签</h4>
                  <div className="flex space-x-2 mt-1">
                    {viewingScript.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4>角色列表 ({viewingScript.characters.length})</h4>
                <div className="mt-4">
                  <Tabs defaultValue="townsfolk">
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="townsfolk">村民 ({getCharacterStats(viewingScript.characters).townsfolk})</TabsTrigger>
                      <TabsTrigger value="outsider">外来者 ({getCharacterStats(viewingScript.characters).outsider})</TabsTrigger>
                      <TabsTrigger value="minion">爪牙 ({getCharacterStats(viewingScript.characters).minion})</TabsTrigger>
                      <TabsTrigger value="demon">恶魔 ({getCharacterStats(viewingScript.characters).demon})</TabsTrigger>
                      <TabsTrigger value="traveler">旅行者 ({getCharacterStats(viewingScript.characters).traveler})</TabsTrigger>
                    </TabsList>
                    
                    {Object.keys(teamNames).map(team => (
                      <TabsContent key={team} value={team} className="space-y-4">
                        {viewingScript.characters
                          .filter(char => char.team === team)
                          .map((character, index) => {
                            const TeamIcon = teamIcons[character.team]
                            return (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <TeamIcon className="h-6 w-6 mt-1" />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h5>{character.name}</h5>
                                        <Badge className={teamColors[character.team]}>
                                          {teamNames[character.team]}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{character.ability}</p>
                                      {character.flavor && (
                                        <p className="text-xs text-gray-500 italic">{character.flavor}</p>
                                      )}
                                      {(character.firstNight || character.otherNight) && (
                                        <div className="flex space-x-4 mt-2 text-xs">
                                          {character.firstNight && (
                                            <span>首夜：{character.firstNight}</span>
                                          )}
                                          {character.otherNight && (
                                            <span>其他夜晚：{character.otherNight}</span>
                                          )}
                                        </div>
                                      )}
                                      {character.reminders && character.reminders.length > 0 && (
                                        <div className="mt-2">
                                          <span className="text-xs text-gray-500">提醒标记：</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {character.reminders.map((reminder, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs">
                                                {reminder}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑剧本对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑剧本</DialogTitle>
            <DialogDescription>修改剧本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">剧本名称</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAuthor">作者</Label>
                <Input
                  id="editAuthor"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editVersion">版本</Label>
                <Input
                  id="editVersion"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTags">标签</Label>
                <Input
                  id="editTags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">描述</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsPublic"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="editIsPublic">公开剧本</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleUpdateScript}>
              保存更改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
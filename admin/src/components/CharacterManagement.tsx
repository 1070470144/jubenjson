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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Skeleton } from './ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Users,
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Skull,
  Shield,
  Crown,
  Zap,
  Settings,
  Copy,
  BookOpen,
  Star,
  Clock,
  AlertTriangle
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
  created_at?: string
  updated_at?: string
  is_official?: boolean
}

interface CharacterManagementProps {
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

export const CharacterManagement: React.FC<CharacterManagementProps> = ({ accessToken }) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTeam, setFilterTeam] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null)
  
  // 表单数据
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    team: 'townsfolk' as Character['team'],
    ability: '',
    flavor: '',
    firstNight: 0,
    otherNight: 0,
    reminders: '',
    setup: false,
    is_official: false
  })

  // 初始化示例角色数据
  useEffect(() => {
    initializeCharacters()
  }, [accessToken])

  const initializeCharacters = async () => {
    // 首先尝试从服务器获取角色数据
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
      
      if (response.ok) {
        const characterRecords = data.records.filter((record: any) => 
          record.key.startsWith('character:')
        )
        
        if (characterRecords.length > 0) {
          const characterData = characterRecords.map((record: any) => ({
            id: record.key.replace('character:', ''),
            ...record.value,
            created_at: record.created_at,
            updated_at: record.updated_at
          }))
          setCharacters(characterData)
          setLoading(false)
          return
        }
      }
    } catch (error) {
      console.log('获取角色数据时出现错误:', error)
    }

    // 如果没有数据，创建示例角色
    await createSampleCharacters()
  }

  const createSampleCharacters = async () => {
    const sampleCharacters: Character[] = [
      {
        id: 'librarian',
        name: '图书管理员',
        team: 'townsfolk',
        ability: '你开始游戏时会得知一个没在场的外来者角色和一个在场的好人玩家，或者你会得知没有外来者在场。',
        flavor: '她知道关于这个小镇的一切... 除了她忘记的那些。',
        firstNight: 16,
        otherNight: 0,
        reminders: ['得知'],
        setup: false,
        is_official: true
      },
      {
        id: 'investigator',
        name: '调查员',
        team: 'townsfolk',
        ability: '你开始游戏时会得知两个玩家，他们当中有一个是指定的爪牙角色。',
        flavor: '自从她的搭档不幸身亡后，她就不再信任任何人了。现在她独自工作，为的是保护这个小镇。',
        firstNight: 17,
        otherNight: 0,
        reminders: ['爪牙', '错误'],
        setup: false,
        is_official: true
      },
      {
        id: 'empath',
        name: '共情者',
        team: 'townsfolk',
        ability: '每个夜晚，你会得知邻座的邪恶玩家有多少个。',
        flavor: '由于永远不知道别人在想什么，她开始变得疯狂。',
        firstNight: 19,
        otherNight: 37,
        reminders: [],
        setup: false,
        is_official: true
      },
      {
        id: 'drunk',
        name: '酒鬼',
        team: 'outsider',
        ability: '你不知道你是酒鬼。你以为你是一个村民角色，但你的能力不会生效。',
        flavor: '酒杯一个接一个，朗姆酒一口接一口...',
        firstNight: 0,
        otherNight: 0,
        reminders: [],
        setup: true,
        is_official: true
      },
      {
        id: 'poisoner',
        name: '投毒者',
        team: 'minion',
        ability: '每个夜晚，选择一名玩家：该玩家在明天白天和明天夜晚中毒。',
        flavor: '对她来说，死亡是一门艺术。其他人看到苦难，而她看到的是美丽。',
        firstNight: 23,
        otherNight: 7,
        reminders: ['中毒'],
        setup: false,
        is_official: true
      },
      {
        id: 'imp',
        name: '小恶魔',
        team: 'demon',
        ability: '每个夜晚*，选择一名玩家：该玩家死亡。如果你自杀，会有一名爪牙变成小恶魔。',
        flavor: '他是纯粹的邪恶，从最原始和最黑暗的地方诞生。',
        firstNight: 0,
        otherNight: 25,
        reminders: ['死亡'],
        setup: false,
        is_official: true
      }
    ]

    // 保存示例角色到数据库
    for (const character of sampleCharacters) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              key: `character:${character.id}`,
              value: character
            }),
          }
        )
      } catch (error) {
        console.log('保存示例角色时出现错误:', error)
      }
    }

    setCharacters(sampleCharacters)
    setLoading(false)
    toast.success('角色库初始化完成')
  }

  // 获取角色列表
  const fetchCharacters = async () => {
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
        console.log('获取角色列表错误:', data)
        toast.error(data.error || '获取角色失败')
        return
      }

      const characterRecords = data.records.filter((record: any) => 
        record.key.startsWith('character:')
      )
      
      const characterData = characterRecords.map((record: any) => ({
        id: record.key.replace('character:', ''),
        ...record.value,
        created_at: record.created_at,
        updated_at: record.updated_at
      }))

      setCharacters(characterData)
    } catch (error) {
      console.log('获取角色列表时出现错误:', error)
      toast.error('获取角色时出现错误')
    } finally {
      setLoading(false)
    }
  }

  // 添加角色
  const handleAddCharacter = async () => {
    if (!formData.name.trim() || !formData.ability.trim()) {
      toast.error('请填写角色名称和能力描述')
      return
    }

    try {
      const characterId = formData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const character: Character = {
        ...formData,
        id: characterId,
        reminders: formData.reminders ? formData.reminders.split(',').map(r => r.trim()) : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
            key: `character:${characterId}`,
            value: character
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('添加角色错误:', data)
        toast.error(data.error || '添加角色失败')
        return
      }

      toast.success('角色添加成功')
      setIsAddDialogOpen(false)
      resetForm()
      fetchCharacters()
    } catch (error) {
      console.log('添加角色时出现错误:', error)
      toast.error('添加角色时出现错误')
    }
  }

  // 更新角色
  const handleUpdateCharacter = async () => {
    if (!editingCharacter) return

    try {
      const character: Character = {
        ...formData,
        id: editingCharacter.id,
        reminders: formData.reminders ? formData.reminders.split(',').map(r => r.trim()) : [],
        created_at: editingCharacter.created_at,
        updated_at: new Date().toISOString()
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data/character:${editingCharacter.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            value: character
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('更新角色错误:', data)
        toast.error(data.error || '更新角色失败')
        return
      }

      toast.success('角色更新成功')
      setIsEditDialogOpen(false)
      setEditingCharacter(null)
      resetForm()
      fetchCharacters()
    } catch (error) {
      console.log('更新角色时出现错误:', error)
      toast.error('更新角色时出现错误')
    }
  }

  // 删除角色
  const handleDeleteCharacter = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/data/character:${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('删除角色错误:', data)
        toast.error(data.error || '删除角色失败')
        return
      }

      toast.success('角色删除成功')
      fetchCharacters()
    } catch (error) {
      console.log('删除角色时出现错误:', error)
      toast.error('删除角色时出现错误')
    }
  }

  // 导出角色为JSON
  const handleExportCharacters = () => {
    const blob = new Blob([JSON.stringify(characters, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `血染钟楼角色库-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('角色库导出成功')
  }

  // 复制角色
  const handleCopyCharacter = (character: Character) => {
    setFormData({
      id: '',
      name: character.name + ' (副本)',
      team: character.team,
      ability: character.ability,
      flavor: character.flavor || '',
      firstNight: character.firstNight || 0,
      otherNight: character.otherNight || 0,
      reminders: character.reminders?.join(', ') || '',
      setup: character.setup || false,
      is_official: false
    })
    setIsAddDialogOpen(true)
  }

  // 查看角色详情
  const openViewDialog = (character: Character) => {
    setViewingCharacter(character)
    setIsViewDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (character: Character) => {
    setEditingCharacter(character)
    setFormData({
      id: character.id,
      name: character.name,
      team: character.team,
      ability: character.ability,
      flavor: character.flavor || '',
      firstNight: character.firstNight || 0,
      otherNight: character.otherNight || 0,
      reminders: character.reminders?.join(', ') || '',
      setup: character.setup || false,
      is_official: character.is_official || false
    })
    setIsEditDialogOpen(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      team: 'townsfolk',
      ability: '',
      flavor: '',
      firstNight: 0,
      otherNight: 0,
      reminders: '',
      setup: false,
      is_official: false
    })
    setEditingCharacter(null)
  }

  // 过滤角色
  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         character.ability.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterTeam === 'all') return matchesSearch
    return matchesSearch && character.team === filterTeam
  })

  // 统计角色数量
  const getTeamStats = () => {
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

  const stats = getTeamStats()

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">村民</p>
                <p className="text-2xl font-bold text-blue-600">{stats.townsfolk}</p>
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
                <p className="text-sm font-medium text-gray-600">外来者</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.outsider}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">爪牙</p>
                <p className="text-2xl font-bold text-red-600">{stats.minion}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Skull className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">恶魔</p>
                <p className="text-2xl font-bold text-purple-600">{stats.demon}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">旅行者</p>
                <p className="text-2xl font-bold text-green-600">{stats.traveler}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 角色管理界面 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>血染钟楼角色管理</CardTitle>
              <CardDescription>管理血染钟楼游戏角色库</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleExportCharacters} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出角色库
              </Button>
              <Button onClick={fetchCharacters} variant="outline" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建角色
                  </Button>
                </DialogTrigger>
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
                placeholder="搜索角色名称或能力描述..."
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

          {/* 角色列表 */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>角色信息</TableHead>
                    <TableHead>阵营</TableHead>
                    <TableHead>夜晚顺序</TableHead>
                    <TableHead>特殊属性</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCharacters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm || filterTeam !== 'all' ? '没有找到匹配的角色' : '暂无角色数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCharacters.map((character) => {
                      const TeamIcon = teamIcons[character.team]
                      return (
                        <TableRow key={character.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center space-x-2">
                                <TeamIcon className="h-4 w-4" />
                                <p className="font-medium">{character.name}</p>
                                {character.is_official && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {character.ability}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={teamColors[character.team]}>
                              {teamNames[character.team]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {character.firstNight > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>首夜: {character.firstNight}</span>
                                </div>
                              )}
                              {character.otherNight > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>其他: {character.otherNight}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {character.setup && (
                                <Badge variant="outline" className="text-xs">
                                  <Settings className="h-3 w-3 mr-1" />
                                  设置
                                </Badge>
                              )}
                              {character.reminders && character.reminders.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  提醒
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={character.is_official ? "default" : "secondary"}>
                              {character.is_official ? '官方' : '自定义'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(character)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(character)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyCharacter(character)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除角色</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您确定要删除角色 "{character.name}" 吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCharacter(character.id)}
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

      {/* 新建角色对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建角色</DialogTitle>
          <DialogDescription>创建新的血染钟楼角色</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">角色名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入角色名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">阵营</Label>
              <Select value={formData.team} onValueChange={(value: Character['team']) => setFormData({ ...formData, team: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="townsfolk">村民</SelectItem>
                  <SelectItem value="outsider">外来者</SelectItem>
                  <SelectItem value="minion">爪牙</SelectItem>
                  <SelectItem value="demon">恶魔</SelectItem>
                  <SelectItem value="traveler">旅行者</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ability">能力描述</Label>
            <Textarea
              id="ability"
              value={formData.ability}
              onChange={(e) => setFormData({ ...formData, ability: e.target.value })}
              placeholder="请输入角色能力描述"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flavor">风味文本</Label>
            <Textarea
              id="flavor"
              value={formData.flavor}
              onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
              placeholder="请输入角色风味文本（可选）"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstNight">首夜顺序</Label>
              <Input
                id="firstNight"
                type="number"
                value={formData.firstNight}
                onChange={(e) => setFormData({ ...formData, firstNight: parseInt(e.target.value) || 0 })}
                placeholder="0表示不在首夜行动"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherNight">其他夜晚顺序</Label>
              <Input
                id="otherNight"
                type="number"
                value={formData.otherNight}
                onChange={(e) => setFormData({ ...formData, otherNight: parseInt(e.target.value) || 0 })}
                placeholder="0表示不在其他夜晚行动"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminders">提醒标记</Label>
            <Input
              id="reminders"
              value={formData.reminders}
              onChange={(e) => setFormData({ ...formData, reminders: e.target.value })}
              placeholder="用逗号分隔，如：中毒,死亡,保护"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="setup"
                checked={formData.setup}
                onCheckedChange={(checked) => setFormData({ ...formData, setup: checked })}
              />
              <Label htmlFor="setup">设置角色</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_official"
                checked={formData.is_official}
                onCheckedChange={(checked) => setFormData({ ...formData, is_official: checked })}
              />
              <Label htmlFor="is_official">官方角色</Label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsAddDialogOpen(false)}
          >
            取消
          </Button>
          <Button onClick={handleAddCharacter}>
            创建角色
          </Button>
        </div>
        </DialogContent>
      </Dialog>

      {/* 查看角色对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {viewingCharacter && (
                <>
                  {React.createElement(teamIcons[viewingCharacter.team], { className: "h-6 w-6" })}
                  <span>{viewingCharacter.name}</span>
                  <Badge className={teamColors[viewingCharacter.team]}>
                    {teamNames[viewingCharacter.team]}
                  </Badge>
                  {viewingCharacter.is_official && (
                    <Star className="h-4 w-4 text-yellow-500" />
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingCharacter && (
            <div className="space-y-4">
              <div>
                <h4>能力描述</h4>
                <p className="text-gray-700 mt-1">{viewingCharacter.ability}</p>
              </div>
              
              {viewingCharacter.flavor && (
                <div>
                  <h4>风味文本</h4>
                  <p className="text-gray-600 italic mt-1">{viewingCharacter.flavor}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingCharacter.firstNight > 0 && (
                  <div>
                    <h4>首夜行动顺序</h4>
                    <p className="text-gray-700 mt-1">{viewingCharacter.firstNight}</p>
                  </div>
                )}
                
                {viewingCharacter.otherNight > 0 && (
                  <div>
                    <h4>其他夜晚顺序</h4>
                    <p className="text-gray-700 mt-1">{viewingCharacter.otherNight}</p>
                  </div>
                )}
              </div>

              {viewingCharacter.reminders && viewingCharacter.reminders.length > 0 && (
                <div>
                  <h4>提醒标记</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingCharacter.reminders.map((reminder, index) => (
                      <Badge key={index} variant="outline">
                        {reminder}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {viewingCharacter.setup && (
                  <div className="flex items-center space-x-1">
                    <Settings className="h-4 w-4" />
                    <span>设置角色</span>
                  </div>
                )}
                <Badge variant={viewingCharacter.is_official ? "default" : "secondary"}>
                  {viewingCharacter.is_official ? '官方角色' : '自定义角色'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑角色对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>修改角色信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">角色名称</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTeam">阵营</Label>
                <Select value={formData.team} onValueChange={(value: Character['team']) => setFormData({ ...formData, team: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="townsfolk">村民</SelectItem>
                    <SelectItem value="outsider">外来者</SelectItem>
                    <SelectItem value="minion">爪牙</SelectItem>
                    <SelectItem value="demon">恶魔</SelectItem>
                    <SelectItem value="traveler">旅行者</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAbility">能力描述</Label>
              <Textarea
                id="editAbility"
                value={formData.ability}
                onChange={(e) => setFormData({ ...formData, ability: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFlavor">风味文本</Label>
              <Textarea
                id="editFlavor"
                value={formData.flavor}
                onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstNight">首夜顺序</Label>
                <Input
                  id="editFirstNight"
                  type="number"
                  value={formData.firstNight}
                  onChange={(e) => setFormData({ ...formData, firstNight: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editOtherNight">其他夜晚顺序</Label>
                <Input
                  id="editOtherNight"
                  type="number"
                  value={formData.otherNight}
                  onChange={(e) => setFormData({ ...formData, otherNight: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editReminders">提醒标记</Label>
              <Input
                id="editReminders"
                value={formData.reminders}
                onChange={(e) => setFormData({ ...formData, reminders: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="editSetup"
                  checked={formData.setup}
                  onCheckedChange={(checked) => setFormData({ ...formData, setup: checked })}
                />
                <Label htmlFor="editSetup">设置角色</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsOfficial"
                  checked={formData.is_official}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_official: checked })}
                />
                <Label htmlFor="editIsOfficial">官方角色</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleUpdateCharacter}>
              保存更改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
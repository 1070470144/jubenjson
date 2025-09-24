import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Upload, 
  Download, 
  FileText, 
  Check, 
  X,
  AlertCircle,
  BookOpen,
  Users,
  Shield,
  Skull,
  Crown,
  Zap,
  Copy,
  ExternalLink
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
  id?: string
  name: string
  author: string
  version: string
  description: string
  characters: Character[]
  is_public?: boolean
  tags?: string[]
}

interface ScriptImportExportProps {
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

export const ScriptImportExport: React.FC<ScriptImportExportProps> = ({ accessToken }) => {
  const [importedScript, setImportedScript] = useState<Script | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 验证剧本数据格式
  const validateScript = (scriptData: any): string[] => {
    const errors: string[] = []

    if (!scriptData.name || typeof scriptData.name !== 'string') {
      errors.push('剧本名称缺失或格式错误')
    }

    if (!scriptData.author || typeof scriptData.author !== 'string') {
      errors.push('作者信息缺失或格式错误')
    }

    if (!scriptData.characters || !Array.isArray(scriptData.characters)) {
      errors.push('角色列表缺失或格式错误')
    } else if (scriptData.characters.length === 0) {
      errors.push('剧本必须包含至少一个角色')
    } else {
      // 验证角色数据
      scriptData.characters.forEach((char: any, index: number) => {
        if (!char.name || typeof char.name !== 'string') {
          errors.push(`角色 ${index + 1}: 名称缺失或格式错误`)
        }
        
        if (!char.team || !['townsfolk', 'outsider', 'minion', 'demon', 'traveler'].includes(char.team)) {
          errors.push(`角色 "${char.name || index + 1}": 阵营信息错误`)
        }
        
        if (!char.ability || typeof char.ability !== 'string') {
          errors.push(`角色 "${char.name || index + 1}": 能力描述缺失`)
        }
      })
    }

    return errors
  }

  // 从文件导入剧本
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const scriptData = JSON.parse(text)
      
      const errors = validateScript(scriptData)
      setImportErrors(errors)
      
      if (errors.length === 0) {
        setImportedScript(scriptData)
        toast.success('剧本文件导入成功')
      } else {
        toast.error('剧本文件格式错误，请查看错误详情')
      }
    } catch (error) {
      console.log('导入剧本文件错误:', error)
      setImportErrors(['文件格式错误，请确保是有效的 JSON 文件'])
      toast.error('文件解析失败')
    }

    // 重置文件输入
    event.target.value = ''
  }

  // 从JSON文本导入剧本
  const handleJsonImport = () => {
    if (!jsonInput.trim()) {
      toast.error('请输入JSON数据')
      return
    }

    try {
      const scriptData = JSON.parse(jsonInput)
      
      const errors = validateScript(scriptData)
      setImportErrors(errors)
      
      if (errors.length === 0) {
        setImportedScript(scriptData)
        setJsonInput('')
        toast.success('JSON数据导入成功')
      } else {
        toast.error('JSON数据格式错误，请查看错误详情')
      }
    } catch (error) {
      console.log('解析JSON数据错误:', error)
      setImportErrors(['JSON格式错误，请检查语法'])
      toast.error('JSON解析失败')
    }
  }

  // 保存导入的剧本
  const handleSaveImportedScript = async () => {
    if (!importedScript) return

    setIsImporting(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f4adc16/scripts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(importedScript),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('保存剧本错误:', data)
        toast.error(data.error || '保存剧本失败')
        return
      }

      toast.success('剧本保存成功')
      setImportedScript(null)
      setImportErrors([])
    } catch (error) {
      console.log('保存剧本时出现错误:', error)
      toast.error('保存剧本时出现错误')
    } finally {
      setIsImporting(false)
    }
  }

  // 清除导入数据
  const handleClearImport = () => {
    setImportedScript(null)
    setImportErrors([])
    setJsonInput('')
  }

  // 导出剧本模板
  const handleExportTemplate = () => {
    const template: Script = {
      name: "示例剧本",
      author: "作者名称",
      version: "1.0.0",
      description: "剧本描述信息",
      is_public: false,
      tags: ["标签1", "标签2"],
      characters: [
        {
          id: "librarian",
          name: "图书管理员",
          team: "townsfolk",
          ability: "你开始游戏时会得知一个没在场的外来者角色和一个在场的好人玩家，或者你会得知没有外来者在场。",
          flavor: "她知道关于这个小镇的一切... 除了她忘记的那些。",
          firstNight: 16,
          otherNight: 0,
          reminders: ["得知"],
          setup: false
        },
        {
          id: "imp",
          name: "小恶魔",
          team: "demon",
          ability: "每个夜晚*，选择一名玩家：该玩家死亡。如果你自杀，会有一名爪牙变成小恶魔。",
          flavor: "他是纯粹的邪恶，从最原始和最黑暗的地方诞生。",
          firstNight: 0,
          otherNight: 25,
          reminders: ["死亡"],
          setup: false
        }
      ]
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '血染钟楼剧本模板.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('剧本模板下载成功')
  }

  // 复制剧本JSON到剪贴板
  const handleCopyJson = async (script: Script) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(script, null, 2))
      toast.success('剧本JSON已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
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

  return (
    <div className="space-y-6">
      {/* 顶部操作区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>导入剧本</span>
            </CardTitle>
            <CardDescription>
              从JSON文件或文本导入血染钟楼剧本
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>从文件导入</Label>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" className="flex-1">
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    选择JSON文件
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileImport}
                    />
                  </label>
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>从JSON文本导入</Label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    粘贴JSON数据
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>导入JSON数据</DialogTitle>
                    <DialogDescription>
                      请粘贴剧本的JSON数据
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="粘贴剧本JSON数据..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={() => {
                        handleJsonImport()
                        setIsDialogOpen(false)
                      }}>
                        导入
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>导出工具</span>
            </CardTitle>
            <CardDescription>
              下载剧本模板和格式参考
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleExportTemplate} 
              variant="outline" 
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              下载剧本模板
            </Button>
            
            <div className="space-y-2">
              <Label>快速链接</Label>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://clocktower.online/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  官方工具
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://wiki.bloodontheclocktower.com/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  角色百科
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 错误信息显示 */}
      {importErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-red-800">导入失败，发现以下错误：</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 导入预览 */}
      {importedScript && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>剧本预览</span>
                </CardTitle>
                <CardDescription>
                  确认剧本信息无误后点击保存
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleCopyJson(importedScript)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制JSON
                </Button>
                <Button variant="outline" onClick={handleClearImport}>
                  <X className="h-4 w-4 mr-2" />
                  清除
                </Button>
                <Button 
                  onClick={handleSaveImportedScript}
                  disabled={isImporting}
                >
                  {isImporting ? '保存中...' : '保存剧本'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 剧本基本信息 */}
              <div>
                <h4 className="text-lg font-medium mb-3">基本信息</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">剧本名称</Label>
                    <p className="font-medium">{importedScript.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">作者</Label>
                    <p className="font-medium">{importedScript.author}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">版本</Label>
                    <p className="font-medium">{importedScript.version || '1.0.0'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">角色数量</Label>
                    <p className="font-medium">{importedScript.characters.length}</p>
                  </div>
                </div>
                
                {importedScript.description && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-500">描述</Label>
                    <p className="text-gray-700">{importedScript.description}</p>
                  </div>
                )}

                {importedScript.tags && importedScript.tags.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-500">标签</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {importedScript.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 角色统计 */}
              <div>
                <h4 className="text-lg font-medium mb-3">角色统计</h4>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(getCharacterStats(importedScript.characters)).map(([team, count]) => {
                    const TeamIcon = teamIcons[team as keyof typeof teamIcons]
                    return (
                      <div key={team} className="text-center p-3 rounded-lg border">
                        <TeamIcon className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{count}</div>
                        <div className="text-sm text-gray-500">
                          {teamNames[team as keyof typeof teamNames]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 角色列表 */}
              <div>
                <h4 className="text-lg font-medium mb-3">角色列表</h4>
                <Tabs defaultValue="townsfolk">
                  <TabsList className="grid grid-cols-5 w-full">
                    {Object.entries(teamNames).map(([team, name]) => (
                      <TabsTrigger key={team} value={team}>
                        {name} ({getCharacterStats(importedScript.characters)[team as keyof typeof teamNames]})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.keys(teamNames).map(team => (
                    <TabsContent key={team} value={team} className="space-y-3">
                      {importedScript.characters
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
                                      <h5 className="font-medium">{character.name}</h5>
                                      <Badge className={teamColors[character.team]}>
                                        {teamNames[character.team]}
                                      </Badge>
                                      {character.setup && (
                                        <Badge variant="outline" className="text-xs">
                                          设置
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{character.ability}</p>
                                    {character.flavor && (
                                      <p className="text-xs text-gray-500 italic">{character.flavor}</p>
                                    )}
                                    {(character.firstNight || character.otherNight) && (
                                      <div className="flex space-x-4 mt-2 text-xs text-gray-500">
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
                                        <div className="flex flex-wrap gap-1">
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
/**
 * 项目设置组件
 * 用于初始化和配置新项目以共享数据库
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Database, 
  Copy, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { ProjectSetupManager, ProjectSetupConfig, projectTemplates } from '../utils/project-setup'
import { toast } from 'sonner@2.0.3'

export function ProjectSetup({ accessToken }: { accessToken: string }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [setupForm, setSetupForm] = useState<ProjectSetupConfig>({
    projectName: '',
    namespace: '',
    description: '',
    tables: {},
    adminEmail: ''
  })
  const [newTable, setNewTable] = useState({ name: '', description: '' })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [configContent, setConfigContent] = useState('')
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const projectList = await ProjectSetupManager.listProjects()
      setProjects(projectList)
    } catch (error) {
      console.error('加载项目列表失败:', error)
      toast.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateKey: string) => {
    const template = projectTemplates[templateKey]
    if (template) {
      setSetupForm(template)
      setSelectedTemplate(templateKey)
      toast.success(`已加载模板: ${template.projectName}`)
    }
  }

  const handleAddTable = () => {
    if (!newTable.name || !newTable.description) {
      toast.error('请填写表名和描述')
      return
    }

    if (setupForm.tables[newTable.name]) {
      toast.error('表名已存在')
      return
    }

    setSetupForm(prev => ({
      ...prev,
      tables: {
        ...prev.tables,
        [newTable.name]: newTable.description
      }
    }))

    setNewTable({ name: '', description: '' })
    toast.success('表配置已添加')
  }

  const handleRemoveTable = (tableName: string) => {
    setSetupForm(prev => {
      const newTables = { ...prev.tables }
      delete newTables[tableName]
      return {
        ...prev,
        tables: newTables
      }
    })
    toast.success('表配置已删除')
  }

  const handleCreateProject = async () => {
    if (!setupForm.projectName || !setupForm.namespace || !setupForm.adminEmail) {
      toast.error('请填写所有必要字段')
      return
    }

    if (Object.keys(setupForm.tables).length === 0) {
      toast.error('请至少添加一个数据表')
      return
    }

    setLoading(true)
    try {
      // 检查项目是否已存在
      const exists = await ProjectSetupManager.checkProjectExists(setupForm.namespace)
      if (exists) {
        toast.error('该命名空间已存在，请使用其他名称')
        return
      }

      // 创建项目
      const success = await ProjectSetupManager.initializeProject(setupForm)
      if (success) {
        toast.success('项目创建成功！')
        
        // 生成配置文件
        const config = ProjectSetupManager.generateConfigFile(setupForm)
        setConfigContent(config)
        setShowConfigDialog(true)
        
        // 重新加载项目列表
        await loadProjects()
        
        // 重置表单
        setSetupForm({
          projectName: '',
          namespace: '',
          description: '',
          tables: {},
          adminEmail: ''
        })
        setSelectedTemplate('')
      } else {
        toast.error('项目创建失败')
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      toast.error('创建项目失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExportProject = async (namespace: string) => {
    try {
      const exportData = await ProjectSetupManager.exportProjectData(namespace)
      if (exportData) {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${namespace}-export.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('项目数据导出成功')
      }
    } catch (error) {
      console.error('导出项目失败:', error)
      toast.error('导出项目失败')
    }
  }

  const handleSyncProjects = async (sourceNamespace: string, targetNamespace: string) => {
    try {
      setLoading(true)
      const success = await ProjectSetupManager.syncProjectData(sourceNamespace, targetNamespace)
      if (success) {
        toast.success(`从 ${sourceNamespace} 同步到 ${targetNamespace} 成功`)
      } else {
        toast.error('项目同步失败')
      }
    } catch (error) {
      console.error('同步项目失败:', error)
      toast.error('同步项目失败')
    } finally {
      setLoading(false)
    }
  }

  const copyConfigToClipboard = () => {
    navigator.clipboard.writeText(configContent)
    toast.success('配置文件已复制到剪贴板')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>项目设置管理</h2>
          <p className="text-muted-foreground">
            初始化新项目并配置数据库共享
          </p>
        </div>
        <Button onClick={loadProjects} disabled={loading} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          刷新项目
        </Button>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">创建项目</TabsTrigger>
          <TabsTrigger value="manage">管理项目</TabsTrigger>
          <TabsTrigger value="templates">项目模板</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                创建新项目
              </CardTitle>
              <CardDescription>
                设置新项目的基本信息和数据结构
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-name">项目名称</Label>
                  <Input
                    id="project-name"
                    value={setupForm.projectName}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="输入项目名称"
                  />
                </div>
                <div>
                  <Label htmlFor="namespace">命名空间</Label>
                  <Input
                    id="namespace"
                    value={setupForm.namespace}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, namespace: e.target.value }))}
                    placeholder="例如: myapp (只能包含字母、数字、下划线)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">项目描述</Label>
                <Textarea
                  id="description"
                  value={setupForm.description}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述项目的功能和用途"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="admin-email">管理员邮箱</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={setupForm.adminEmail}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>数据表配置</Label>
                  <Badge variant="outline">
                    {Object.keys(setupForm.tables).length} 个表
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="表名"
                    value={newTable.name}
                    onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="表描述"
                    value={newTable.description}
                    onChange={(e) => setNewTable(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Button onClick={handleAddTable} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>

                {Object.keys(setupForm.tables).length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>表名</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead width="80">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(setupForm.tables).map(([name, description]) => (
                          <TableRow key={name}>
                            <TableCell>
                              <Badge variant="secondary">{name}</Badge>
                            </TableCell>
                            <TableCell>{description}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveTable(name)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateProject}
                disabled={loading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建项目
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                项目管理
              </CardTitle>
              <CardDescription>
                管理现有项目和数据同步
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无项目</p>
                  <p className="text-sm">请先创建一个项目</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>项目名称</TableHead>
                      <TableHead>命名空间</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{project.name}</Badge>
                            {project.status === 'active' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{project.namespace}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {project.description}
                        </TableCell>
                        <TableCell>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportProject(project.namespace)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                项目模板
              </CardTitle>
              <CardDescription>
                使用预定义的项目模板快速开始
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(projectTemplates).map(([key, template]) => (
                  <Card key={key} className="cursor-pointer hover:bg-gray-50" onClick={() => handleTemplateSelect(key)}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{template.projectName}</h4>
                          <Badge variant="secondary">{template.namespace}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(template.tables).map(table => (
                            <Badge key={table} variant="outline" className="text-xs">
                              {table}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          使用模板
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    已选择模板: {projectTemplates[selectedTemplate].projectName}。
                    请切换到"创建项目"标签页完成配置。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 配置文件对话框 */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>项目配置文件</DialogTitle>
            <DialogDescription>
              请将以下配置保存到您的项目中，并按照说明进行设置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copyConfigToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                复制配置
              </Button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{configContent}</code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
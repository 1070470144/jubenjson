import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import { toast } from 'sonner@2.0.3'
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  File,
  Image,
  Video,
  Music,
  Archive,
  Plus,
  Eye,
  Edit,
  Share,
  Folder,
  FolderOpen,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'

interface DocumentManagementProps {
  accessToken: string
}

interface DocumentItem {
  id: string
  name: string
  type: 'file' | 'folder'
  fileType?: string
  size?: number
  createdAt: string
  modifiedAt: string
  path: string
}

// 模拟文档数据
const mockDocuments: DocumentItem[] = [
  {
    id: '1',
    name: '用户手册',
    type: 'folder',
    createdAt: '2024-01-15T10:00:00Z',
    modifiedAt: '2024-01-20T15:30:00Z',
    path: '/documents/用户手册'
  },
  {
    id: '2',
    name: '系统配置文档.pdf',
    type: 'file',
    fileType: 'pdf',
    size: 2048576,
    createdAt: '2024-01-10T09:15:00Z',
    modifiedAt: '2024-01-18T14:20:00Z',
    path: '/documents/系统配置文档.pdf'
  },
  {
    id: '3',
    name: 'API接口说明.md',
    type: 'file',
    fileType: 'markdown',
    size: 51200,
    createdAt: '2024-01-12T11:30:00Z',
    modifiedAt: '2024-01-19T16:45:00Z',
    path: '/documents/API接口说明.md'
  },
  {
    id: '4',
    name: '数据库设计图.png',
    type: 'file',
    fileType: 'image',
    size: 1536000,
    createdAt: '2024-01-08T13:45:00Z',
    modifiedAt: '2024-01-16T10:15:00Z',
    path: '/documents/数据库设计图.png'
  },
  {
    id: '5',
    name: '培训资料',
    type: 'folder',
    createdAt: '2024-01-05T08:20:00Z',
    modifiedAt: '2024-01-22T12:30:00Z',
    path: '/documents/培训资料'
  }
]

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ accessToken }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFileType, setSelectedFileType] = useState('all')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [currentPath, setCurrentPath] = useState('/documents')

  // 获取文件图标
  const getFileIcon = (item: DocumentItem) => {
    if (item.type === 'folder') {
      return <Folder className="h-8 w-8 text-blue-600" />
    }

    switch (item.fileType) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />
      case 'image':
        return <Image className="h-8 w-8 text-green-600" />
      case 'video':
        return <Video className="h-8 w-8 text-purple-600" />
      case 'audio':
        return <Music className="h-8 w-8 text-orange-600" />
      case 'archive':
        return <Archive className="h-8 w-8 text-yellow-600" />
      case 'markdown':
        return <FileText className="h-8 w-8 text-blue-600" />
      default:
        return <File className="h-8 w-8 text-gray-600" />
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 过滤文档
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedFileType === 'all' || 
                       (selectedFileType === 'folder' && document.type === 'folder') ||
                       (selectedFileType !== 'folder' && document.fileType === selectedFileType)
    return matchesSearch && matchesType
  })

  // 模拟文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploading(true)
    setUploadProgress(0)

    // 模拟上传进度
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          
          // 添加新文档到列表
          const newDocument: DocumentItem = {
            id: Date.now().toString(),
            name: file.name,
            type: 'file',
            fileType: getFileTypeFromName(file.name),
            size: file.size,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            path: `${currentPath}/${file.name}`
          }
          
          setDocuments(prev => [newDocument, ...prev])
          toast.success(`文件 "${file.name}" 上传成功`)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)

    // 重置文件输入
    event.target.value = ''
  }

  // 根据文件名���取文件类型
  const getFileTypeFromName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'pdf'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return 'image'
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'video'
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'audio'
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive'
      case 'md':
        return 'markdown'
      default:
        return 'document'
    }
  }

  // 删除文档
  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
    toast.success('文档删除成功')
  }

  // 创建文件夹
  const handleCreateFolder = () => {
    const folderName = prompt('请输入文件夹名称:')
    if (!folderName) return

    const newFolder: DocumentItem = {
      id: Date.now().toString(),
      name: folderName,
      type: 'folder',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      path: `${currentPath}/${folderName}`
    }

    setDocuments(prev => [newFolder, ...prev])
    toast.success(`文件夹 "${folderName}" 创建成功`)
  }

  // 下载文档（模拟）
  const handleDownload = (document: DocumentItem) => {
    if (document.type === 'folder') {
      toast.info('暂不支持下载文件夹')
      return
    }
    
    // 实际应用中这里应该调用真实的下载API
    toast.success(`开始下载 "${document.name}"`)
  }

  // 预览文档（模拟）
  const handlePreview = (document: DocumentItem) => {
    if (document.type === 'folder') {
      toast.info(`打开文件夹: ${document.name}`)
      return
    }
    
    toast.info(`预览文档: ${document.name}`)
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总文档数</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">文件夹</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(doc => doc.type === 'folder').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Folder className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">文件</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(doc => doc.type === 'file').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <File className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总大小</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(documents.reduce((acc, doc) => acc + (doc.size || 0), 0))}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Archive className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 文档管理界面 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>文档管理</CardTitle>
              <CardDescription>管理系统文档和文件资源</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCreateFolder}>
                <Plus className="h-4 w-4 mr-2" />
                新建文件夹
              </Button>
              <Button asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  上传文件
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 上传进度 */}
          {isUploading && (
            <Alert className="mb-6">
              <Upload className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>正在上传文件...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-500">{Math.round(uploadProgress)}%</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 搜索和过滤 */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索文档名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="all">所有类型</option>
              <option value="folder">文件夹</option>
              <option value="pdf">PDF文档</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="markdown">Markdown</option>
              <option value="document">其他文档</option>
            </select>
          </div>

          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grid">网格视图</TabsTrigger>
              <TabsTrigger value="list">列表视图</TabsTrigger>
            </TabsList>

            {/* 网格视图 */}
            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    {searchTerm || selectedFileType !== 'all' ? '没有找到匹配的文档' : '暂无文档'}
                  </div>
                ) : (
                  filteredDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center space-y-3">
                          {getFileIcon(document)}
                          <div className="text-center space-y-1">
                            <h4 className="font-medium text-sm truncate w-full" title={document.name}>
                              {document.name}
                            </h4>
                            {document.size && (
                              <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              {formatDate(document.modifiedAt)}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" onClick={() => handlePreview(document)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownload(document)}>
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteDocument(document.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* 列表视图 */}
            <TabsContent value="list">
              <div className="space-y-2">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || selectedFileType !== 'all' ? '没有找到匹配的文档' : '暂无文档'}
                  </div>
                ) : (
                  filteredDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(document)}
                            <div>
                              <h4 className="font-medium">{document.name}</h4>
                              <p className="text-sm text-gray-500">
                                {document.type === 'file' && document.size 
                                  ? `${formatFileSize(document.size)} • ` 
                                  : ''
                                }
                                修改于 {formatDate(document.modifiedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {document.type === 'folder' ? '文件夹' : document.fileType}
                            </Badge>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" onClick={() => handlePreview(document)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownload(document)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteDocument(document.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
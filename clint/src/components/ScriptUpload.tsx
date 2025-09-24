import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileText, Image, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from './auth/AuthContext';
import { getSupabaseClient } from '../utils/supabase/client';
import { toast } from 'sonner';

// Use centralized Supabase client (with error handling)
let supabase: any = null;
try {
  supabase = getSupabaseClient();
} catch (error) {
  console.log('Supabase client not available, running in demo mode');
}

// Check if we're in demo mode
const isDemoMode = !projectId || !publicAnonKey || 
  projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';

export function ScriptUpload() {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    version: '1.0',
    jsonFile: null as File | null,
    imageFiles: [] as File[]
  });

  const handleFileUpload = (type: 'json' | 'images', files: FileList | null) => {
    if (!files) return;

    if (type === 'json') {
      const file = files[0];
      if (file && file.type === 'application/json') {
        setFormData(prev => ({ ...prev, jsonFile: file }));
      }
    } else {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      
      // Limit to 3 images
      if (imageFiles.length > 3) {
        toast.error('最多只能上传3张图片');
        return;
      }
      
      setFormData(prev => ({ ...prev, imageFiles }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('请先登录后再上传剧本');
      return;
    }
    
    if (!formData.title || !formData.jsonFile) {
      setUploadState('error');
      setErrorMessage('请填写剧本标题并选择JSON文件');
      return;
    }

    setUploadState('uploading');
    setErrorMessage('');
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('version', formData.version);
      formDataToSend.append('jsonFile', formData.jsonFile);
      
      console.log(`Uploading ${formData.imageFiles.length} image files:`, formData.imageFiles.map(f => f.name));
      
      formData.imageFiles.forEach((file, index) => {
        console.log(`Adding image file ${index + 1}: ${file.name}, size: ${file.size} bytes`);
        formDataToSend.append('imageFiles', file);
      });

      // 检查是否有有效的Supabase配置
      if (isDemoMode) {
        // 模拟上传成功（演示模式）
        console.log('Demo mode: Simulating successful upload');
        setUploadState('success');
        toast.success('剧本上传成功！');
        setTimeout(() => {
          setUploadState('idle');
          setFormData({
            title: '',
            description: '',
            version: '1.0',
            jsonFile: null,
            imageFiles: []
          });
        }, 3000);
        return;
      }

      // Get current session for auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setUploadState('error');
        setErrorMessage('认证失败，请重新登录');
        toast.error('认证失败，请重新登录');
        return;
      }

      if (!session?.access_token) {
        console.error('No access token available');
        setUploadState('error');
        setErrorMessage('请重新登录后再试');
        toast.error('请重新登录后再试');
        return;
      }
      
      console.log('Starting upload with user session:', session.user.id);
      console.log('Upload URL:', `https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts`);
      
      // 添加超时控制，上传可能需要更长时间
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60秒超时，文件上传需要更长时间
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formDataToSend,
          signal: abortController.signal
        });

        clearTimeout(timeoutId);
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          console.error('HTTP error:', response.status, response.statusText);
        }
        
        const result = await response.json();
        console.log('Upload response:', result);
      
      if (response.ok && result.success) {
        setUploadState('success');
        toast.success('剧本上传成功！');
        console.log('Upload successful, script ID:', result.scriptId);
        
        // 触发一个自定义事件，通知其他组件刷新数据
        window.dispatchEvent(new CustomEvent('scriptUploaded', { 
          detail: { scriptId: result.scriptId } 
        }));
        
        // 重置表单
        setTimeout(() => {
          setUploadState('idle');
          setFormData({
            title: '',
            description: '',
            version: '1.0',
            jsonFile: null,
            imageFiles: []
          });
        }, 3000);
      } else {
        console.error('Upload failed:', result.error);
        console.error('Full response:', result);
        setUploadState('error');
        
        // 显示更详细的错误信息
        const errorMsg = result.details || result.error || '上传失败，请重试';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Upload timed out after 30 seconds');
        setUploadState('error');
        setErrorMessage('上传超时，请检查网络连接或稍后重试');
        toast.error('上传超时，请稍后重试');
      } else {
        console.error('Upload error:', error);
        setUploadState('error');
        setErrorMessage('网络错误，请稍后重试');
        toast.error('网络错误，请稍后重试');
      }
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <LogIn className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">需要登录</h3>
                <p className="text-muted-foreground">
                  请先登录您的账户，然后就可以上传剧本了
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-6 w-6" />
            <span>上传血染钟楼剧本</span>
          </CardTitle>
          <CardDescription>
            上传您的剧本文件，包括JSON配置文件和相关图片资源
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">剧本标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入剧本标题"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">版本号</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">剧本描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="详细描述您的剧本内容、特色和玩法..."
                rows={4}
              />
            </div>

            {/* 文件上传 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>JSON配置文件 *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        选择剧本的JSON配置文件
                      </p>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleFileUpload('json', e.target.files)}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                    {formData.jsonFile && (
                      <p className="text-sm text-green-600 mt-2">
                        已选择: {formData.jsonFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>图片资源文件</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="text-center">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        选择剧本相关的图片文件（支持多选）
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload('images', e.target.files)}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                    {formData.imageFiles.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        已选择 {formData.imageFiles.length} 个图片文件
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 状态提示 */}
            {uploadState === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  剧本上传成功！您的剧本正在审核中，审核通过后将在剧本库中显示。
                </AlertDescription>
              </Alert>
            )}

            {uploadState === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  上传失败，请检查必填项和文件格式是否正确。
                </AlertDescription>
              </Alert>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={uploadState === 'uploading'}
            >
              {uploadState === 'uploading' ? '上传中...' : '上传剧本'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 上传说明 */}
      <Card>
        <CardHeader>
          <CardTitle>上传说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <p>JSON文件应包含完整的剧本配置，包括角色、规则和游戏流程</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <p>图片文件支持PNG、JPG、GIF格式，建议单个文件不超过5MB</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <p>上传的剧本将经过审核，确保内容符合社区规范</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <p>请确保您拥有剧本的原创权或使用授权</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
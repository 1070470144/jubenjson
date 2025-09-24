import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

import { Heart, Download, Eye, Star, Calendar, User, FileJson, Image as ImageIcon, HeartOff } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageCarousel } from './ImageCarousel';
import { ImageCarouselSkeleton } from './ImageCarouselSkeleton';
import { useAuth } from './auth/AuthContext';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface MyFavoritesProps {
  setActiveTab?: (tab: string) => void;
}

export function MyFavorites({ setActiveTab }: MyFavoritesProps) {
  const [favoriteScripts, setFavoriteScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptImages, setScriptImages] = useState<{ [key: string]: string[] }>({});
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [dataSource, setDataSource] = useState<'loading' | 'live' | 'demo' | 'offline'>('loading');
  
  const { user, getAccessToken } = useAuth();

  // 加载用户收藏的剧本
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;
    
    const fetchFavoriteScripts = async () => {
      if (!user || !isMounted) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // 检查是否有有效的Supabase配置
        const isDemoMode = !projectId || !publicAnonKey || 
          projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
          
        if (isDemoMode) {
          console.log('Demo mode: Using mock favorite scripts');
          // 模拟收藏的剧本数据（从ScriptLibrary的mockScripts中选择几个）
          const mockFavoriteScripts = [
            {
              id: '1',
              title: '恶魔镇的秘密',
              description: '一个充满悬疑和策略的经典剧本，适合8-15人游戏。包含多个独特角色和复杂的游戏机制。',
              author: '玩家A',
              version: '2.1',
              downloads: 1245,
              rating: 4.8,
              likes: 89,
              uploadDate: '2024-01-15',
              tags: ['经典', '悬疑', '大型'],
              playerCount: '8-15人',
              difficulty: '中等',
              imagePaths: ['demo-1-1.jpg', 'demo-1-2.jpg']
            },
            {
              id: '3',
              title: '诡异马戏团',
              description: '以马戏团为主题的创新剧本，包含独特的角色技能和游戏机制。',
              author: '跟头帮',
              version: '1.0',
              downloads: 567,
              rating: 4.4,
              likes: 45,
              uploadDate: '2024-01-08',
              tags: ['创新', '主题', '小型'],
              playerCount: '5-10人',
              difficulty: '简单',
              imagePaths: ['demo-3-1.jpg']
            }
          ];
          
          if (isMounted) {
            setFavoriteScripts(mockFavoriteScripts);
            setDataSource('demo');
            setLoading(false);
            
            // 加载模拟图片
            const mockImageUrls = {
              '1': [
                'https://images.unsplash.com/photo-1728463460580-daff3839ae72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3RoaWMlMjBtYW5zaW9uJTIwZGFya3xlbnwxfHx8fDE3NTg3MDY2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'https://images.unsplash.com/photo-1604565107182-51a3bd718bec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0ZXJpb3VzJTIwY2lyY3VzJTIwdmludGFnZXxlbnwxfHx8fDE3NTg3MDY2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              ],
              '3': [
                'https://images.unsplash.com/photo-1604565107182-51a3bd718bec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0ZXJpb3VzJTIwY2lyY3VzJTIwdmludGFnZXxlbnwxfHx8fDE3NTg3MDY2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              ]
            };
            setScriptImages(mockImageUrls);
          }
          return;
        }

        const accessToken = await getAccessToken();
        if (!accessToken || !isMounted) {
          console.log('No access token available');
          setLoading(false);
          return;
        }

        console.log('Fetching favorite scripts from backend...');
        
        abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          if (abortController) abortController.abort();
        }, 8000);
        
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/user/favorites`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            signal: abortController.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!isMounted) return;
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Successfully fetched favorite scripts:', data);
            
            if (isMounted) {
              setFavoriteScripts(data.favoriteScripts || []);
              setDataSource('live');
              
              // 延迟加载图片
              setTimeout(() => {
                if (isMounted) {
                  loadScriptImagesInBackground(data.favoriteScripts || []);
                }
              }, 500);
            }
          } else {
            if (response.status === 401) {
              console.log('User not authenticated for favorites, showing empty list');
              if (isMounted) {
                setFavoriteScripts([]);
                setDataSource('demo');
                setLoading(false);
              }
              return;
            }
            console.log(`Backend responded with ${response.status}: ${response.statusText}`);
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Backend request timed out');
        } else {
          console.log('Backend unavailable:', error.message);
        }
        
        if (isMounted) {
          setFavoriteScripts([]);
          setDataSource('offline');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to prevent multiple simultaneous API calls during app initialization
    const timeoutId = setTimeout(() => {
      fetchFavoriteScripts();
    }, Math.random() * 100); // Random delay up to 100ms
    
    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [user, getAccessToken]);

  // 后台批量加载剧本图片
  const loadScriptImagesInBackground = async (allScripts: any[]) => {
    const scriptsWithImages = allScripts.filter(script => 
      script.imagePaths && script.imagePaths.length > 0
    );
    
    if (scriptsWithImages.length === 0) return;
    
    console.log(`Background loading images for ${scriptsWithImages.length} favorite scripts`);
    
    for (const script of scriptsWithImages) {
      try {
        await loadScriptImages(script.id, script.imagePaths);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Failed to load images for script ${script.id}:`, error);
        continue;
      }
    }
  };

  // 加载剧本图片
  const loadScriptImages = async (scriptId: string, imagePaths: string[]) => {
    if (!imagePaths || imagePaths.length === 0) return;
    
    setLoadingImages(prev => ({ ...prev, [scriptId]: true }));
    
    const isDemoMode = !projectId || !publicAnonKey || 
      projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
      
    if (isDemoMode) {
      // 演示模式下使用模拟图片
      setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
      return;
    }

    let abortController: AbortController | null = null;
    
    try {
      abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortController) abortController.abort();
      }, 5000);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts/${scriptId}/download`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const imageUrls = data.downloadUrls?.images?.map((img: any) => img.url) || [];
        
        if (imageUrls.length > 0) {
          setScriptImages(prev => ({
            ...prev,
            [scriptId]: imageUrls
          }));
        }
      }
    } catch (error) {
      console.warn(`Error loading images for script ${scriptId}:`, error.message);
    } finally {
      setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
      abortController = null;
    }
  };

  const handleDownload = async (scriptId: string, type: 'all' | 'json' | 'images' = 'all') => {
    let abortController: AbortController | null = null;
    
    try {
      const isDemoMode = !projectId || !publicAnonKey || 
        projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
        
      if (isDemoMode) {
        console.log('Demo mode: Simulating download for script', scriptId);
        toast.success(`演示模式：${type === 'all' ? '全部文件' : type === 'json' ? 'JSON文件' : '图片文件'}下载已模拟`);
        return;
      }

      abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortController) abortController.abort();
      }, 8000);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts/${scriptId}/download`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (type === 'all' || type === 'json') {
          const link = document.createElement('a');
          link.href = data.downloadUrls.json;
          link.download = `${data.script.title}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        if (type === 'all' || type === 'images') {
          data.downloadUrls.images.forEach((image: any, index: number) => {
            setTimeout(() => {
              const imageLink = document.createElement('a');
              imageLink.href = image.url;
              imageLink.download = `${data.script.title}-image-${index + 1}.${image.path.split('.').pop()}`;
              document.body.appendChild(imageLink);
              imageLink.click();
              document.body.removeChild(imageLink);
            }, index * 100);
          });
        }
        
        toast.success(`${type === 'all' ? '全部文件' : type === 'json' ? 'JSON文件' : '图片文件'}下载成功`);
      } else {
        toast.error('下载失败，请稍后重试');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('下载请求超时，请稍后重试');
      } else {
        toast.error('下载失败，请稍后重试');
      }
    } finally {
      abortController = null;
    }
  };

  const handleRemoveFromFavorites = async (scriptId: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    // 这里复用点赞系统的逻辑，因为在这个实现中点赞就是收藏
    let abortController: AbortController | null = null;

    try {
      const isDemoMode = !projectId || !publicAnonKey || 
        projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
        
      if (isDemoMode) {
        // 演示模式下直接从本地状态移除
        setFavoriteScripts(prev => prev.filter(script => script.id !== scriptId));
        toast.success('已从收藏中移除');
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error('请重新登录');
        return;
      }

      abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortController) abortController.abort();
      }, 5000);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts/${scriptId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.liked) {
          // 如果取消点赞成功，从收藏列表中移除
          setFavoriteScripts(prev => prev.filter(script => script.id !== scriptId));
          toast.success('已从收藏中移除');
        }
      } else {
        toast.error('操作失败，请稍后重试');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('请求超时，请稍后重试');
      } else {
        toast.error('操作失败，请稍后重试');
      }
    } finally {
      abortController = null;
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return 'bg-green-100 text-green-800';
      case '中等': return 'bg-yellow-100 text-yellow-800';
      case '困难': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 如果用户未登录，显示提示
  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg mb-2">请先登录</h3>
            <p className="text-muted-foreground">
              登录后您可以查看和管理收藏的剧本
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span>我的收藏</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              刷新数据
            </Button>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>查看和管理您收藏的血染钟楼剧本</span>
            {dataSource === 'live' && (
              <Badge variant="outline" className="text-xs">
                实时数据
              </Badge>
            )}
            {dataSource === 'demo' && (
              <Badge variant="secondary" className="text-xs">
                演示模式
              </Badge>
            )}
            {dataSource === 'offline' && (
              <Badge variant="secondary" className="text-xs">
                离线模式
              </Badge>
            )}
            {dataSource === 'loading' && (
              <Badge variant="outline" className="text-xs">
                加载中...
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>正在加载收藏的剧本...</p>
          </CardContent>
        </Card>
      )}

      {/* 收藏的剧本列表 */}
      {!loading && favoriteScripts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {favoriteScripts.map((script) => (
            <Card key={script.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{script.title}</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      {script.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{script.rating || 0}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromFavorites(script.id)}
                          className="p-1 h-auto text-red-500 hover:text-red-700"
                        >
                          <HeartOff className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>移除收藏</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                {/* 图片轮播预览 */}
                {scriptImages[script.id] && scriptImages[script.id].length > 0 && (
                  <div className="mb-4">
                    <div onClick={() => setSelectedScript(script)} className="cursor-pointer">
                      <ImageCarousel
                        images={scriptImages[script.id]}
                        title={script.title}
                        className="max-w-xs mx-auto"
                        enableFullscreen={false}
                      />
                    </div>
                    <div className="text-center text-xs text-muted-foreground mt-1">
                      点击查看详情
                    </div>
                  </div>
                )}
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {(script.tags || []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {script.difficulty && (
                    <Badge className={`text-xs ${getDifficultyBadgeColor(script.difficulty)}`}>
                      {script.difficulty}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 游戏信息 */}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{script.playerCount || '未知'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>v{script.version || '1.0'}</span>
                  </div>
                </div>

                {/* 作者和统计 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {script.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{script.author}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>{script.downloads?.toLocaleString() || 0}</span>
                    </div>
                    <span>{script.uploadDate ? new Date(script.uploadDate).toLocaleDateString() : '未知'}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2 pt-2">
                  <Button className="flex-1" onClick={() => handleDownload(script.id, 'all')}>
                    <Download className="h-4 w-4 mr-2" />
                    下载全部
                  </Button>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => handleDownload(script.id, 'json')}>
                        <FileJson className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>下载JSON文件</p>
                    </TooltipContent>
                  </Tooltip>

                  {scriptImages[script.id] && scriptImages[script.id].length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleDownload(script.id, 'images')}>
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>下载图片文件</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Button variant="outline" size="icon" onClick={() => setSelectedScript(script)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && favoriteScripts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg mb-2">还没有收藏的剧本</h3>
            <p className="text-muted-foreground mb-4">
              去剧本库中发现喜欢的剧本并点击收藏吧！
            </p>
            <Button 
              variant="outline"
              onClick={() => setActiveTab && setActiveTab('scripts')}
            >
              浏览剧本库
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* 剧本详情对话框 */}
      {selectedScript && (
        <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedScript.title}</span>
                <Badge variant="secondary">v{selectedScript.version || '1.0'}</Badge>
              </DialogTitle>
              <DialogDescription>
                查看剧本详细信息、图片预览和下载选项
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 剧本详情 */}
              <div>
                <h4 className="mb-2">剧本描述</h4>
                <p className="text-muted-foreground">{selectedScript.description}</p>
              </div>

              {/* 图片轮播画廊 */}
              {scriptImages[selectedScript.id] && scriptImages[selectedScript.id].length > 0 && (
                <div>
                  <h4 className="mb-3">剧本图片</h4>
                  <ImageCarousel
                    images={scriptImages[selectedScript.id]}
                    title={selectedScript.title}
                    className="max-w-2xl mx-auto"
                    showThumbnails={true}
                    enableFullscreen={true}
                  />
                </div>
              )}

              {/* 游戏信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h5 className="text-sm mb-1">游戏人数</h5>
                  <p className="text-muted-foreground">{selectedScript.playerCount || '未知'}</p>
                </div>
                <div>
                  <h5 className="text-sm mb-1">难度</h5>
                  <Badge className={getDifficultyBadgeColor(selectedScript.difficulty)}>{selectedScript.difficulty || '未知'}</Badge>
                </div>
                <div>
                  <h5 className="text-sm mb-1">下载量</h5>
                  <p className="text-muted-foreground">{selectedScript.downloads?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <h5 className="text-sm mb-1">评分</h5>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-muted-foreground">{selectedScript.rating || 0}</span>
                  </div>
                </div>
              </div>

              {/* 作者信息 */}
              <div>
                <h5 className="text-sm mb-2">作者信息</h5>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{selectedScript.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">{selectedScript.author}</p>
                    <p className="text-xs text-muted-foreground">
                      上传于 {selectedScript.uploadDate ? new Date(selectedScript.uploadDate).toLocaleDateString() : '未知'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {selectedScript.tags && selectedScript.tags.length > 0 && (
                <div>
                  <h5 className="text-sm mb-2">标签</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedScript.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作区域 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveFromFavorites(selectedScript.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <HeartOff className="h-4 w-4 mr-2" />
                    移除收藏
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleDownload(selectedScript.id, 'json')}>
                    <FileJson className="h-4 w-4 mr-2" />
                    下载JSON
                  </Button>
                  {scriptImages[selectedScript.id] && scriptImages[selectedScript.id].length > 0 && (
                    <Button variant="outline" onClick={() => handleDownload(selectedScript.id, 'images')}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      下载图片
                    </Button>
                  )}
                  <Button onClick={() => handleDownload(selectedScript.id, 'all')}>
                    <Download className="h-4 w-4 mr-2" />
                    下载全部
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
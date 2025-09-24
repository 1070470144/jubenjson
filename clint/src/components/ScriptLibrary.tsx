import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { AspectRatio } from './ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { Search, Download, Eye, Star, Calendar, User, Filter, Heart, FileJson, Image as ImageIcon, ExternalLink, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageCarousel } from './ImageCarousel';
import { ImageCarouselSkeleton } from './ImageCarouselSkeleton';
import { useAuth } from './auth/AuthContext';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// 模拟剧本数据
const mockScripts = [
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
    id: '2',
    title: '血月庄园',
    description: '哥特风格的剧本，以古老庄园为背景，充满了神秘和恐怖元素。',
    author: '玩家B',
    version: '1.5',
    downloads: 892,
    rating: 4.6,
    likes: 67,
    uploadDate: '2024-01-10',
    tags: ['哥特', '恐怖', '中型'],
    playerCount: '6-12人',
    difficulty: '困难',
    imagePaths: ['demo-2-1.jpg']
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
  },
  {
    id: '4',
    title: '深海迷航',
    description: '海洋探险主题剧本，玩家需要在深海中寻找真相，避免未知的危险。',
    author: '海洋之心',
    version: '1.2',
    downloads: 743,
    rating: 4.7,
    likes: 56,
    uploadDate: '2024-01-05',
    tags: ['探险', '海洋', '中型'],
    playerCount: '7-13人',
    difficulty: '中等',
    imagePaths: ['demo-4-1.jpg']
  },
  {
    id: '5',
    title: '时空穿越者',
    description: '科幻题材的剧本，玩家可以在不同时空中穿梭，体验独特的游戏体验。',
    author: '时光旅者',
    version: '2.0',
    downloads: 1089,
    rating: 4.9,
    likes: 78,
    uploadDate: '2024-01-01',
    tags: ['科幻', '创新', '大型'],
    playerCount: '10-16人',
    difficulty: '困难',
    imagePaths: []
  }
];

// 模拟图片URL映射
const mockImageUrls: { [key: string]: string[] } = {
  '1': [
    'https://images.unsplash.com/photo-1728463460580-daff3839ae72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3RoaWMlMjBtYW5zaW9uJTIwZGFya3xlbnwxfHx8fDE3NTg3MDY2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1604565107182-51a3bd718bec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0ZXJpb3VzJTIwY2lyY3VzJTIwdmludGFnZXxlbnwxfHx8fDE3NTg3MDY2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  ],
  '2': [
    'https://images.unsplash.com/photo-1728463460580-daff3839ae72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3RoaWMlMjBtYW5zaW9uJTIwZGFya3xlbnwxfHx8fDE3NTg3MDY2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  ],
  '3': [
    'https://images.unsplash.com/photo-1604565107182-51a3bd718bec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0ZXJpb3VzJTIwY2lyY3VzJTIwdmludGFnZXxlbnwxfHx8fDE3NTg3MDY2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  ],
  '4': [
    'https://images.unsplash.com/photo-1628371164958-887b4c79a6be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWVwJTIwb2NlYW4lMjB1bmRlcndhdGVyfGVufDF8fHx8MTc1ODcwNjY5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  ]
};

export function ScriptLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [filterTag, setFilterTag] = useState('all');
  const [scripts, setScripts] = useState([]);
  const [filteredScripts, setFilteredScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedScripts, setLikedScripts] = useState<string[]>([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptImages, setScriptImages] = useState<{ [key: string]: string[] }>({});
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [dataSource, setDataSource] = useState<'loading' | 'live' | 'demo' | 'offline'>('loading');
  
  const { user, getAccessToken } = useAuth();

  // 获取所有标签
  const allTags = ['all', ...Array.from(new Set(scripts.flatMap(script => script.tags || [])))];

  // 从服务器加载剧本数据
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;
    
    const fetchScripts = async (force = false) => {
      if (!isMounted) return;
      setLoading(true);
      
      try {
        // 检查是否有有效的Supabase配置
        const isDemoMode = !projectId || !publicAnonKey || 
          projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
          
        if (isDemoMode) {
          console.log('Demo mode: Using mock data');
          if (isMounted) {
            setScripts(mockScripts);
            setScriptImages(mockImageUrls);
            setDataSource('demo');
            setLoading(false);
          }
          return;
        }

        // Add a quick connectivity check first
        console.log('Attempting to fetch scripts from backend...');
        console.log('Backend URL:', `https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts`);
        
        abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('Request timed out after 20 seconds');
          if (abortController) abortController.abort();
        }, 20000); // 增加到20秒超时，适应后端处理时间
        
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/scripts`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            signal: abortController.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!isMounted) return;
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Successfully fetched scripts from backend:', data);
            console.log('Scripts count:', data.scripts ? data.scripts.length : 0);
            
            if (isMounted) {
              setScripts(data.scripts || []);
              setDataSource('live');
              
              // 延迟加载图片，避免阻塞主要内容
              setTimeout(() => {
                if (isMounted) {
                  loadScriptImagesInBackground(data.scripts || []);
                }
              }, 500);
            }
          } else {
            const errorText = await response.text();
            console.log(`Backend responded with ${response.status}: ${response.statusText}`);
            console.log('Error response body:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('Fetch error details:', fetchError);
          throw fetchError;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Backend request timed out, using mock data');
        } else {
          console.log('Backend unavailable, using mock data:', error.message);
        }
        
        // Gracefully fallback to mock data
        if (isMounted) {
          setScripts(mockScripts);
          setScriptImages(mockImageUrls);
          setDataSource('offline');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchScripts();
    
    // 监听上传成功事件，自动刷新数据
    const handleScriptUploaded = (event: CustomEvent) => {
      console.log('Detected new script upload, refreshing data...');
      if (isMounted) {
        fetchScripts(true); // 强制刷新
      }
    };
    
    window.addEventListener('scriptUploaded', handleScriptUploaded as EventListener);
    
    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
      window.removeEventListener('scriptUploaded', handleScriptUploaded as EventListener);
    };
  }, []);

  // 加载用户点赞的剧本
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;
    
    const fetchLikedScripts = async () => {
      if (!user || !isMounted) return;
      
      // 检查getAccessToken是否可用
      if (typeof getAccessToken !== 'function') {
        console.error('getAccessToken is not a function:', getAccessToken);
        return;
      }
      
      try {
        // 检查是否是演示模式
        const isDemoMode = !projectId || !publicAnonKey || 
          projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
          
        if (isDemoMode) {
          console.log('Demo mode: Using mock liked scripts');
          if (isMounted) {
            setLikedScripts(['1', '3']); // 模拟用户点赞了第1和第3个剧本
          }
          return;
        }

        const accessToken = await getAccessToken();
        if (!accessToken || !isMounted) {
          console.log('No access token available, skipping liked scripts fetch');
          return;
        }

        console.log('Fetching liked scripts from backend...');
        
        abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          if (abortController) abortController.abort();
        }, 5000); // 增加到5秒超时
        
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/user/liked`, {
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
            console.log('✅ Successfully fetched liked scripts');
            if (isMounted) {
              setLikedScripts(data.likedScripts || []);
            }
          } else {
            console.warn(`Liked scripts fetch failed: ${response.status}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('⚠️  Liked scripts request timed out');
        } else {
          console.warn('⚠️  Could not fetch liked scripts:', error.message);
        }
        // Don't set error state - just leave liked scripts empty
      }
    };

    // 延迟执行以确保context完全初始化
    const timeoutId = setTimeout(fetchLikedScripts, 500);
    
    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [user, getAccessToken]);

  // 后台批量加载剧本图片（优化版）
  const loadScriptImagesInBackground = async (allScripts: any[]) => {
    const scriptsWithImages = allScripts.filter(script => 
      script.imagePaths && script.imagePaths.length > 0
    );
    
    if (scriptsWithImages.length === 0) return;
    
    console.log(`Background loading images for ${scriptsWithImages.length} scripts`);
    
    // 串行处理，每次只处理1个剧本，避免过多并发
    for (const script of scriptsWithImages) {
      try {
        await loadScriptImages(script.id, script.imagePaths);
        // 在每个请求之间添加短暂延迟，避免服务器过载
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Failed to load images for script ${script.id}:`, error);
        // 继续处理下一个，不中断整个流程
        continue;
      }
    }
  };

  // 加载剧本图片
  const loadScriptImages = async (scriptId: string, imagePaths: string[], retryCount = 0) => {
    if (!imagePaths || imagePaths.length === 0) return;
    
    console.log(`Loading images for script ${scriptId}, imagePaths:`, imagePaths, `(attempt ${retryCount + 1})`);
    
    // 设置加载状态
    setLoadingImages(prev => ({ ...prev, [scriptId]: true }));
    
    // Check if we're in demo mode
    const isDemoMode = !projectId || !publicAnonKey || 
      projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
      
    if (isDemoMode) {
      console.log(`Demo mode: Using mock images for script ${scriptId}`);
      // Use mock images from mockImageUrls if available
      if (mockImageUrls[scriptId]) {
        setScriptImages(prev => ({
          ...prev,
          [scriptId]: mockImageUrls[scriptId]
        }));
      }
      // 清除加载状态
      setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
      return;
    }

    let abortController: AbortController | null = null;
    
    try {
      abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortController) abortController.abort();
      }, 15000); // 增加到15秒超时，给后端足够时间处理

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
        console.log(`Loaded ${imageUrls.length} images for script ${scriptId}`);
        
        if (imageUrls.length > 0) {
          setScriptImages(prev => ({
            ...prev,
            [scriptId]: imageUrls
          }));
        }
      } else {
        console.warn(`Failed to load images for script ${scriptId}: ${response.status}`);
        // 如果是服务器错误且还有重试机会，则重试
        if (response.status >= 500 && retryCount < 2) {
          console.log(`Retrying image load for script ${scriptId}, attempt ${retryCount + 1}`);
          // 清除加载状态
          setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
          setTimeout(() => loadScriptImages(scriptId, imagePaths, retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        // Fallback to mock images if available
        if (mockImageUrls[scriptId]) {
          setScriptImages(prev => ({
            ...prev,
            [scriptId]: mockImageUrls[scriptId]
          }));
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Image loading timed out for script ${scriptId}`);
        // 如果是超时且还有重试机会，则重试
        if (retryCount < 1) {
          console.log(`Retrying image load after timeout for script ${scriptId}, attempt ${retryCount + 1}`);
          // 清除加载状态
          setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
          setTimeout(() => loadScriptImages(scriptId, imagePaths, retryCount + 1), 2000);
          return;
        }
      } else {
        console.warn(`Error loading images for script ${scriptId}:`, error.message);
        // 如果是网络错误且还有重试机会，则重试
        if (retryCount < 2) {
          console.log(`Retrying image load after error for script ${scriptId}, attempt ${retryCount + 1}`);
          // 清除加载状态
          setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
          setTimeout(() => loadScriptImages(scriptId, imagePaths, retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
      }
      
      // Fallback to mock images if available
      if (mockImageUrls[scriptId]) {
        setScriptImages(prev => ({
          ...prev,
          [scriptId]: mockImageUrls[scriptId]
        }));
      }
    } finally {
      // 只在没有手动清除加载状态的情况下才自动清除
      setLoadingImages(prev => ({ ...prev, [scriptId]: false }));
      abortController = null;
    }
  };

  // 筛选和排序逻辑
  const handleSearch = () => {
    let filtered = scripts;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(script =>
        script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 标签过滤
    if (filterTag !== 'all') {
      filtered = filtered.filter(script => script.tags && script.tags.includes(filterTag));
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'date':
          return new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredScripts(filtered);
  };

  // 当搜索条件改变时重新筛选
  useEffect(() => {
    handleSearch();
  }, [searchTerm, sortBy, filterTag, scripts]);

  const handleDownload = async (scriptId: string, type: 'all' | 'json' | 'images' = 'all', retryCount = 0) => {
    let abortController: AbortController | null = null;
    
    try {
      console.log(`Starting download for script ${scriptId}, type: ${type} (attempt ${retryCount + 1})`);
      
      // 检查是否有有效的Supabase配置
      const isDemoMode = !projectId || !publicAnonKey || 
        projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
        
      if (isDemoMode) {
        console.log('Demo mode: Simulating download for script', scriptId);
        toast.success(`演示模式：${type === 'all' ? '全部文件' : type === 'json' ? 'JSON文件' : '图片文件'}下载已模拟`);
        
        // 更新本地下载计数
        setScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { ...script, downloads: script.downloads + 1 }
            : script
        ));
        return;
      }

      abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortController) abortController.abort();
      }, 15000); // 增加到15秒超时，给后端足够时间处理

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
          // 下载JSON文件
          const link = document.createElement('a');
          link.href = data.downloadUrls.json;
          link.download = `${data.script.title}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        if (type === 'all' || type === 'images') {
          // 下载图片文件
          data.downloadUrls.images.forEach((image: any, index: number) => {
            setTimeout(() => {
              const imageLink = document.createElement('a');
              imageLink.href = image.url;
              imageLink.download = `${data.script.title}-image-${index + 1}.${image.path.split('.').pop()}`;
              document.body.appendChild(imageLink);
              imageLink.click();
              document.body.removeChild(imageLink);
            }, index * 100); // 每100ms下载一张图片，避免并发过多
          });
        }
        
        // 更新本地下载计数
        setScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { ...script, downloads: script.downloads + 1 }
            : script
        ));
        
        toast.success(`${type === 'all' ? '全部文件' : type === 'json' ? 'JSON文件' : '图片文件'}下载成功`);
      } else {
        console.error(`Download failed for script ${scriptId}: ${response.status}`);
        // 如果是服务器错误且还有重试机会，则重试
        if (response.status >= 500 && retryCount < 2) {
          console.log(`Retrying download for script ${scriptId}, attempt ${retryCount + 1}`);
          toast.warning(`下载失败，正在重试... (${retryCount + 1}/3)`);
          setTimeout(() => handleDownload(scriptId, type, retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        toast.error('下载失败，请稍后重试');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Download request timed out for script', scriptId);
        // 如果是超时且还有重试机会，则重试
        if (retryCount < 1) {
          console.log(`Retrying download after timeout for script ${scriptId}, attempt ${retryCount + 1}`);
          toast.warning(`下载超时，正在重试... (${retryCount + 1}/2)`);
          setTimeout(() => handleDownload(scriptId, type, retryCount + 1), 2000);
          return;
        }
        toast.error('下���请求超时，请稍后重试');
      } else {
        console.error('Download error:', error);
        // 如果是网络错误且还有重试机会，则重试
        if (retryCount < 2) {
          console.log(`Retrying download after error for script ${scriptId}, attempt ${retryCount + 1}`);
          toast.warning(`下载失败，正在重试... (${retryCount + 1}/3)`);
          setTimeout(() => handleDownload(scriptId, type, retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        toast.error('下载失败，请稍后重试');
      }
    } finally {
      abortController = null;
    }
  };

  const handleLike = async (scriptId: string) => {
    if (!user) {
      toast.error('请先登录后再点赞');
      return;
    }

    let abortController: AbortController | null = null;

    try {
      // 检查是否是演示模式
      const isDemoMode = !projectId || !publicAnonKey || 
        projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
        
      if (isDemoMode) {
        // 演示模式下的点赞逻辑
        const isCurrentlyLiked = likedScripts.includes(scriptId);
        
        setLikedScripts(prev => 
          isCurrentlyLiked 
            ? prev.filter(id => id !== scriptId)
            : [...prev, scriptId]
        );
        
        setScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { ...script, likes: (script.likes || 0) + (isCurrentlyLiked ? -1 : 1) }
            : script
        ));
        
        toast.success(isCurrentlyLiked ? '取消点赞' : '点赞成功');
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
      }, 5000); // 5秒超时

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
        
        // 更新本地点赞状态
        setLikedScripts(prev => 
          data.liked 
            ? [...prev, scriptId]
            : prev.filter(id => id !== scriptId)
        );
        
        // 更新剧本点赞数
        setScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { ...script, likes: data.likes }
            : script
        ));
        
        toast.success(data.liked ? '点赞成功' : '取消点赞');
      } else {
        toast.error('操作失败，请稍后重试');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Like request timed out for script', scriptId);
        toast.error('请求超时，请稍后重试');
      } else {
        console.error('Like error:', error);
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

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-6 w-6" />
              <span>剧本库</span>
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
            <span>浏览、搜索和下载社区精选的血染钟楼剧本</span>
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
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索剧本名称、描述或作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      {tag === 'all' ? '全部' : tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downloads">下载量</SelectItem>
                  <SelectItem value="rating">评分</SelectItem>
                  <SelectItem value="date">上传时间</SelectItem>
                  <SelectItem value="title">标题</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>正在加载剧本...</p>
          </CardContent>
        </Card>
      )}

      {/* 剧本列表 */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScripts.map((script) => (
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
                        onClick={() => handleLike(script.id)}
                        className={`p-1 h-auto ${likedScripts.includes(script.id) ? 'text-red-500' : 'text-muted-foreground'}`}
                      >
                        <Heart className={`h-4 w-4 ${likedScripts.includes(script.id) ? 'fill-current' : ''}`} />
                        <span className="ml-1 text-xs">{script.likes || 0}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{likedScripts.includes(script.id) ? '取消点赞' : '点赞'}</p>
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleLike(script.id)}
                      className={likedScripts.includes(script.id) ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100' : ''}
                    >
                      <Bookmark className={`h-4 w-4 ${likedScripts.includes(script.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{likedScripts.includes(script.id) ? '取消收藏' : '添加收藏'}</p>
                  </TooltipContent>
                </Tooltip>

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
      {!loading && filteredScripts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg mb-2">没有找到匹配的剧本</h3>
            <p className="text-muted-foreground mb-4">
              尝试调整搜索条件或筛选设置
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setFilterTag('all');
              }}
            >
              清除筛选
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
                    onClick={() => handleLike(selectedScript.id)}
                    className={`${likedScripts.includes(selectedScript.id) ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${likedScripts.includes(selectedScript.id) ? 'fill-current' : ''}`} />
                    {selectedScript.likes || 0} 点赞
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
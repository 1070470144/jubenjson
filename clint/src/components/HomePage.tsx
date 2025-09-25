import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, Users, FileText, Trophy, Upload, Download } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
// 使用环境变量而非 info.tsx
const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
if (!baseUrl || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export function HomePage({ setActiveTab }: HomePageProps) {
  const [stats, setStats] = useState({
    totalScripts: 0,
    activeUsers: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 5000);

        try {
          const response = await fetch(`${baseUrl}/functions/v1/make-server-010255fd/stats`, {
            headers: {
              'Authorization': `Bearer ${anonKey}`
            },
            signal: abortController.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok && isMounted) {
            const data = await response.json();
            setStats({
              totalScripts: data.totalScripts ?? 0,
              activeUsers: data.activeAuthors ?? 0,
              totalDownloads: data.totalDownloads ?? 0
            });
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          console.log('Stats request timed out');
        } else {
          console.log('Error fetching stats:', (error as any).message ?? error);
        }
      }
    };

    fetchStats();
    
    return () => {
      isMounted = false;
    };
  }, []);
  const features = [
    {
      icon: Upload,
      title: '剧本上传',
      description: '轻松上传您的血染钟楼剧本，包含JSON配置和图片资源',
      action: () => setActiveTab('upload'),
      buttonText: '开始上传'
    },
    {
      icon: Download,
      title: '剧本库',
      description: '浏览和下载社区精选的血染钟楼剧本',
      action: () => setActiveTab('scripts'),
      buttonText: '浏览剧本'
    },
    {
      icon: Trophy,
      title: '排行榜',
      description: '查看最受欢迎的剧本和活跃的创作者',
      action: () => setActiveTab('rankings'),
      buttonText: '查看排行'
    }
  ];

  const statsDisplay = [
    { label: '剧本总数', value: stats.totalScripts.toLocaleString(), icon: FileText },
    { label: '活跃用户', value: stats.activeUsers.toLocaleString(), icon: Users },
    { label: '下载次数', value: stats.totalDownloads.toLocaleString(), icon: Download },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1672154833014-6e03b652523e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3RoaWMlMjBjbG9ja3Rvd2VyJTIwZGFyayUyMG15c3Rlcnl8ZW58MXx8fHwxNzU4Njg1OTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Gothic clocktower"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative px-8 py-16 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl mb-4">欢迎来到血染钟楼门户</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            这里是血染钟楼爱好者的聚集地。上传、分享、下载精彩剧本，与社区一起探索这个充满策略与推理的游戏世界。
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setActiveTab('scripts')}
            className="mr-4"
          >
            立即探索
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setActiveTab('upload')}
            className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          >
            上传剧本
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsDisplay.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <feature.icon className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={feature.action} className="w-full">
                {feature.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最新动态</CardTitle>
          <CardDescription>社区最新的剧本上传和活动</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { type: '新剧本', title: '恶魔镇的秘密', author: '玩家A', time: '2小时前' },
            { type: '热门剧本', title: '血月庄园', author: '玩家B', time: '5小时前' },
            { type: '新剧本', title: '诡异马戏团', author: '玩家C', time: '1天前' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.type} · 作者: {activity.author}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
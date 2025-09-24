import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Trophy, Star, Download, TrendingUp, Crown, Medal, Award } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// 模拟排行榜数据
const topScripts = [
  {
    rank: 1,
    title: '时空穿越者',
    author: '时光旅者',
    downloads: 1089,
    rating: 4.9,
    category: '科幻',
    trend: 'up'
  },
  {
    rank: 2,
    title: '恶魔镇的秘密',
    author: '玩家A',
    downloads: 1245,
    rating: 4.8,
    category: '经典',
    trend: 'up'
  },
  {
    rank: 3,
    title: '血月庄园',
    author: '玩家B',
    downloads: 892,
    rating: 4.6,
    category: '哥特',
    trend: 'down'
  },
  {
    rank: 4,
    title: '深海迷航',
    author: '海洋之心',
    downloads: 743,
    rating: 4.7,
    category: '探险',
    trend: 'up'
  },
  {
    rank: 5,
    title: '诡异马戏团',
    author: '跟头帮',
    downloads: 567,
    rating: 4.4,
    category: '创新',
    trend: 'same'
  }
];

const topAuthors = [
  {
    rank: 1,
    name: '时光旅者',
    scriptsCount: 3,
    totalDownloads: 2156,
    avgRating: 4.8,
    badge: 'gold',
    joinDate: '2023-08'
  },
  {
    rank: 2,
    name: '玩家A',
    scriptsCount: 5,
    totalDownloads: 1987,
    avgRating: 4.6,
    badge: 'silver',
    joinDate: '2023-06'
  },
  {
    rank: 3,
    name: '海洋之心',
    scriptsCount: 2,
    totalDownloads: 1432,
    avgRating: 4.7,
    badge: 'bronze',
    joinDate: '2023-09'
  },
  {
    rank: 4,
    name: '跟头帮',
    scriptsCount: 4,
    totalDownloads: 1289,
    avgRating: 4.4,
    badge: null,
    joinDate: '2023-07'
  },
  {
    rank: 5,
    name: '玩家B',
    scriptsCount: 2,
    totalDownloads: 1156,
    avgRating: 4.5,
    badge: null,
    joinDate: '2023-10'
  }
];

const monthlyStats = [
  { period: '本月新增', scripts: 12, downloads: 3456 },
  { period: '本周热门', scripts: 5, downloads: 1234 },
  { period: '今日活跃', scripts: 2, downloads: 456 }
];

export function Rankings() {
  const [topScriptsData, setTopScriptsData] = useState(topScripts);
  const [topAuthorsData, setTopAuthorsData] = useState(topAuthors);
  const [statsData, setStatsData] = useState(monthlyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const abortControllers: AbortController[] = [];
    
    const fetchRankings = async () => {
      try {
        // 检查是否有有效的Supabase配置
        const isDemoMode = !projectId || !publicAnonKey || 
          projectId === 'your-project-id' || publicAnonKey === 'your-anon-key';
          
        if (isDemoMode) {
          console.log('Demo mode: Using mock ranking data');
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // 并行获取所有数据，但添加超时控制
        const requests = [
          // 获取剧本排行榜
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/rankings?type=scripts`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(6000) // 6秒超时
          }),
          // 获取作者排行榜
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/rankings?type=authors`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(6000) // 6秒超时
          }),
          // 获取统计数据
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/stats`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(6000) // 6秒超时
          })
        ];

        // 使用Promise.allSettled来处理可能的失败请求
        const results = await Promise.allSettled(requests);
        
        if (!isMounted) return;

        // 处理剧本排行榜结果
        if (results[0].status === 'fulfilled' && results[0].value.ok) {
          try {
            const scriptsData = await results[0].value.json();
            if (scriptsData.rankings && scriptsData.rankings.length > 0 && isMounted) {
              setTopScriptsData(scriptsData.rankings.map((script, index) => ({
                rank: index + 1,
                title: script.title,
                author: script.author,
                downloads: script.downloads,
                rating: script.rating || 0,
                category: script.tags?.[0] || '未分类',
                trend: 'same'
              })));
            }
          } catch (error) {
            console.warn('Failed to parse scripts rankings:', error);
          }
        } else if (results[0].status === 'rejected') {
          console.log('Scripts rankings request failed, using mock data:', results[0].reason);
        }

        // 处理作者排行榜结果
        if (results[1].status === 'fulfilled' && results[1].value.ok) {
          try {
            const authorsData = await results[1].value.json();
            if (authorsData.rankings && authorsData.rankings.length > 0 && isMounted) {
              setTopAuthorsData(authorsData.rankings.map((author, index) => ({
                rank: index + 1,
                name: author.name,
                scriptsCount: author.scriptsCount,
                totalDownloads: author.totalDownloads,
                avgRating: author.avgRating || 0,
                badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
                joinDate: '2023-12'
              })));
            }
          } catch (error) {
            console.warn('Failed to parse authors rankings:', error);
          }
        } else if (results[1].status === 'rejected') {
          console.log('Authors rankings request failed, using mock data:', results[1].reason);
        }

        // 处理统计数据结果
        if (results[2].status === 'fulfilled' && results[2].value.ok) {
          try {
            const stats = await results[2].value.json();
            if (isMounted) {
              setStatsData([
                { period: '剧本总数', scripts: stats.totalScripts || 0, downloads: stats.totalDownloads || 0 },
                { period: '活跃作者', scripts: stats.activeAuthors || 0, downloads: 0 },
                { period: '平均评分', scripts: 0, downloads: Math.round((stats.averageRating || 0) * 10) / 10 }
              ]);
            }
          } catch (error) {
            console.warn('Failed to parse stats:', error);
          }
        } else if (results[2].status === 'rejected') {
          console.log('Stats request failed, using mock data:', results[2].reason);
        }

      } catch (error) {
        console.log('Error fetching rankings, using mock data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRankings();
    
    return () => {
      isMounted = false;
      // 取消所有进行中的请求
      abortControllers.forEach(controller => controller.abort());
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">{rank}</span>;
    }
  };

  const getBadgeIcon = (badge: string | null) => {
    switch (badge) {
      case 'gold':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'silver':
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 'bronze':
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300"></div>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span>排行榜</span>
          </CardTitle>
          <CardDescription>
            查看最受欢迎的剧本和最活跃的创作者
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>正在加载排行榜数据...</p>
          </CardContent>
        </Card>
      )}

      {/* 统计概览 */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.period}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      {stat.scripts > 0 && (
                        <div>
                          <p className="text-lg">{stat.scripts}</p>
                          <p className="text-xs text-muted-foreground">数量</p>
                        </div>
                      )}
                      {stat.downloads > 0 && (
                        <div>
                          <p className="text-lg">{stat.downloads.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {stat.period === '平均评分' ? '★' : '下载'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 排行榜选项卡 */}
      {!loading && (
        <Tabs defaultValue="scripts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scripts">热门剧本</TabsTrigger>
            <TabsTrigger value="authors">优秀作者</TabsTrigger>
          </TabsList>

          {/* 热门剧本排行 */}
          <TabsContent value="scripts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>热门剧本排行榜</CardTitle>
                <CardDescription>
                  根据下载量、评分和用户反馈综合排序
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topScriptsData.map((script) => (
                  <div
                    key={script.rank}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(script.rank)}
                        {script.rank <= 3 && (
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(script.trend)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{script.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          作者: {script.author}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <Badge variant="secondary">{script.category}</Badge>
                      
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{script.downloads.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{script.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 优秀作者排行 */}
          <TabsContent value="authors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>优秀作者排行榜</CardTitle>
                <CardDescription>
                  根据作品数量、总下载量和平均评分综合排序
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topAuthorsData.map((author) => (
                  <div
                    key={author.rank}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(author.rank)}
                        {author.badge && getBadgeIcon(author.badge)}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-medium">{author.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          加入时间: {author.joinDate}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-sm text-center">
                      <div>
                        <p className="font-medium">{author.scriptsCount}</p>
                        <p className="text-muted-foreground">作品数</p>
                      </div>
                      <div>
                        <p className="font-medium">{author.totalDownloads.toLocaleString()}</p>
                        <p className="text-muted-foreground">总下载</p>
                      </div>
                      <div>
                        <p className="font-medium">{author.avgRating}</p>
                        <p className="text-muted-foreground">平均评分</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* 成就展示 */}
      <Card>
        <CardHeader>
          <CardTitle>社区成就</CardTitle>
          <CardDescription>
            血染钟楼门户的里程碑时刻
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '剧本总数', value: '156+', description: '社区贡献的剧本数量' },
              { title: '总下载量', value: '12.5K+', description: '累计下载次数' },
              { title: '活跃作者', value: '89+', description: '积极创作的作者数量' },
              { title: '社区评分', value: '4.7★', description: '平均剧本质量评分' }
            ].map((achievement, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-lg bg-muted/50 border"
              >
                <p className="text-2xl text-primary mb-1">{achievement.value}</p>
                <p className="font-medium mb-1">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
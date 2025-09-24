import { useState } from 'react';
import { Header } from './components/layout/Header';
import { HomePage } from './components/HomePage';
import { ScriptUpload } from './components/ScriptUpload';
import { ScriptLibrary } from './components/ScriptLibrary';
import { ScriptGenerator } from './components/ScriptGenerator';
import { MyFavorites } from './components/MyFavorites';
import { Rankings } from './components/Rankings';
import { AuthProvider } from './components/auth/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { DebugPanel } from './components/DebugPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage setActiveTab={setActiveTab} />;
      case 'upload':
        return <ScriptUpload />;
      case 'generator':
        return <ScriptGenerator />;
      case 'scripts':
        return <ScriptLibrary />;
      case 'favorites':
        return <MyFavorites setActiveTab={setActiveTab} />;
      case 'rankings':
        return <Rankings />;
      default:
        return <HomePage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <PerformanceMonitor />
          <div className="min-h-screen bg-background">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="container mx-auto px-4 py-8">
              {renderContent()}
            </main>
        
        <footer className="border-t bg-card mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-medium mb-3">关于我们</h3>
                <p className="text-sm text-muted-foreground">
                  血染钟楼门户是为血染钟楼爱好者打造的剧本分享平台，
                  致力于促进社区创作和交流。
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">快速链接</h3>
                <div className="space-y-2 text-sm">
                  <button 
                    onClick={() => setActiveTab('scripts')}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                  >
                    剧本库
                  </button>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                  >
                    上传剧本
                  </button>
                  <button 
                    onClick={() => setActiveTab('generator')}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                  >
                    剧本生成器
                  </button>
                  <button 
                    onClick={() => setActiveTab('rankings')}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                  >
                    排行榜
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">社区规范</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• 尊重原创，标注来源</p>
                  <p>• 内容健康，适合游戏</p>
                  <p>• 积极交流，共同进步</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6 mt-6 text-center text-sm text-muted-foreground">
              <p>&copy; 2024 血染钟楼门户. 为血染钟楼社区服务</p>
            </div>
          </div>
        </footer>
          </div>
          
          {/* Debug panel for development */}
          <DebugPanel />
          
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
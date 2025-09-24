import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronRight, Database, Server, Bug } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testKVStore = async () => {
    setIsLoading(true);
    try {
      console.log('Testing KV store...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/test-kv`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('KV test result:', result);
      
      setTestResults(result);
      
      if (result.status === 'ok') {
        toast.success('KV存储测试成功');
      } else {
        toast.error('KV存储测试失败');
      }
    } catch (error) {
      console.error('KV test error:', error);
      setTestResults({
        status: 'error',
        error: error.message,
        kvTest: 'failed'
      });
      toast.error('无法连接到后端服务');
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendHealth = async () => {
    setIsLoading(true);
    try {
      console.log('Testing backend health...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Health check result:', result);
      
      setTestResults({
        ...testResults,
        healthCheck: result
      });
      
      if (response.ok) {
        toast.success('后端服务正常');
      } else {
        toast.error('后端服务异常');
      }
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('后端服务无法访问');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    console.log('Manually refreshing data...');
    window.dispatchEvent(new CustomEvent('scriptUploaded', { 
      detail: { manual: true } 
    }));
    toast.success('数据刷新命令已发送');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="shadow-lg">
            <Bug className="h-4 w-4 mr-2" />
            调试面板
            {isOpen ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <Card className="w-80 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">系统调试</CardTitle>
              <CardDescription className="text-xs">
                测试后端连接和数据库功能
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={testBackendHealth}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Server className="h-3 w-3 mr-1" />
                    后端状态
                  </Button>
                  
                  <Button 
                    onClick={testKVStore}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    数据库测试
                  </Button>
                </div>
                
                <Button 
                  onClick={refreshData}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  刷新数据
                </Button>
              </div>
              
              {testResults && (
                <div className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span>状态:</span>
                      <Badge variant={testResults.status === 'ok' ? 'default' : 'destructive'}>
                        {testResults.status}
                      </Badge>
                    </div>
                    
                    {testResults.kvTest && (
                      <div className="flex items-center justify-between">
                        <span>KV测试:</span>
                        <Badge variant={testResults.kvTest === 'passed' ? 'default' : 'destructive'}>
                          {testResults.kvTest}
                        </Badge>
                      </div>
                    )}
                    
                    {testResults.scriptsListLength !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>剧本数量:</span>
                        <Badge variant="outline">
                          {testResults.scriptsListLength}
                        </Badge>
                      </div>
                    )}
                    
                    {testResults.healthCheck && (
                      <div className="flex items-center justify-between">
                        <span>API状态:</span>
                        <Badge variant="default">
                          正常
                        </Badge>
                      </div>
                    )}
                    
                    {testResults.error && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        错误: {testResults.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div>项目ID: {projectId?.substring(0, 8)}...</div>
                <div>密钥: {publicAnonKey ? '已配置' : '未配置'}</div>
                <div>时间: {new Date().toLocaleTimeString()}</div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to console with additional context
    console.group('🚨 Application Error');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleRetry = () => {
    // Reset error state to retry
    this.setState({ hasError: false, error: undefined });
  };

  handleRefresh = () => {
    // Refresh the entire page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>应用程序出错</CardTitle>
              <CardDescription>
                应用程序遇到了意外错误。这可能是由于:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <ul className="space-y-1">
                  <li>• 网络连接问题</li>
                  <li>• 服务器响应超时</li>
                  <li>• 浏览器兼容性问题</li>
                  <li>• 临时的系统故障</li>
                </ul>
              </div>
              
              {this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground mb-2">
                    技术详情
                  </summary>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button 
                  onClick={this.handleRefresh} 
                  className="flex-1"
                >
                  刷新页面
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
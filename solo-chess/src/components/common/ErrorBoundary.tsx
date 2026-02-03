// src/components/common/ErrorBoundary.tsx

import { Component, type ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <span className="text-6xl mb-4">😵</span>
          <h2 className="text-xl font-bold mb-2">문제가 발생했습니다</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
          </p>
          
          {import.meta.env.DEV && this.state.error && (
            <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-left text-sm text-red-600 dark:text-red-400 mb-6 max-w-full overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="secondary">
              다시 시도
            </Button>
            <Button onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  timestamp: Date;
  error: Error;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorHistory: ErrorInfo[];
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorHistory: [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorEntry: ErrorInfo = {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date(),
    };

    this.setState(prevState => ({
      errorInfo,
      errorHistory: [...prevState.errorHistory, errorEntry],
    }));

    // Also log to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorPage
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorHistory={this.state.errorHistory}
        onRefresh={this.handleRefresh}
        onReset={this.handleReset}
      />;
    }

    return this.props.children;
  }
}

interface ErrorPageProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorHistory: ErrorInfo[];
  onRefresh: () => void;
  onReset: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  errorInfo,
  errorHistory,
  onRefresh,
  onReset
}) => {
  const [isDeveloperOpen, setIsDeveloperOpen] = React.useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = React.useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800 dark:text-red-200">
            Oops! We met with an error
          </CardTitle>
          <p className="text-red-600 dark:text-red-400 mt-2">
            Something went wrong. Don't worry, our team has been notified.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onRefresh}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>

          {/* Developer Section */}
          <div className="border-t pt-6">
            <Collapsible open={isDeveloperOpen} onOpenChange={setIsDeveloperOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <span className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Developer Section
                  </span>
                  {isDeveloperOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 mt-4">
                {/* Current Error */}
                {error && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Current Error
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <p><strong>Message:</strong> {error.message}</p>
                      <p><strong>Stack:</strong></p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                        {error.stack}
                      </pre>
                      {errorInfo && (
                        <>
                          <p><strong>Component Stack:</strong></p>
                          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Error History */}
                {errorHistory.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <Collapsible open={!isHistoryCollapsed} onOpenChange={setIsHistoryCollapsed}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-0 h-auto text-sm font-semibold text-gray-800 dark:text-gray-200"
                        >
                          Error History ({errorHistory.length} errors)
                          {!isHistoryCollapsed ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-4 space-y-3">
                        {errorHistory.map((errorEntry, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-gray-500">
                                {errorEntry.timestamp.toLocaleString()}
                              </span>
                              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                Error {index + 1}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                              {errorEntry.error.message}
                            </p>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                Stack Trace
                              </summary>
                              <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                {errorEntry.error.stack}
                              </pre>
                              {errorEntry.componentStack && (
                                <>
                                  <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-2">
                                    Component Stack
                                  </summary>
                                  <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                    {errorEntry.componentStack}
                                  </pre>
                                </>
                              )}
                            </details>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Developer Modal */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Bug className="w-4 h-4 mr-2" />
                      Open Developer Console
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Bug className="w-5 h-5" />
                        Developer Console - All Errors
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {errorHistory.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          No errors recorded yet.
                        </p>
                      ) : (
                        errorHistory.map((errorEntry, index) => (
                          <Card key={index} className="border-red-200 dark:border-red-800">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  Error {index + 1}
                                </CardTitle>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {errorEntry.timestamp.toLocaleString()}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">
                                  Error Message
                                </h4>
                                <p className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded border">
                                  {errorEntry.error.message}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-1">Stack Trace</h4>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                  {errorEntry.error.stack}
                                </pre>
                              </div>

                              {errorEntry.componentStack && (
                                <div>
                                  <h4 className="font-semibold mb-1">Component Stack</h4>
                                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                    {errorEntry.componentStack}
                                  </pre>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
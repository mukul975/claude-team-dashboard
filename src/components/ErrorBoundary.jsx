import React from 'react';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const name = this.props.name || 'Unknown Component';
    console.error(`[ErrorBoundary] "${name}" crashed:`, error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Panel-level fallback when a name prop is provided
      if (this.props.name) {
        return (
          <div className="card p-6 border border-red-500/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {this.props.name} encountered an error
                </h3>
                {this.state.error && (
                  <p className="text-sm text-gray-400 mt-1 break-words">
                    {this.state.error.message || this.state.error.toString()}
                  </p>
                )}
              </div>
            </div>
            {this.state.errorInfo && (
              <details className="mb-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                  Component Stack
                </summary>
                <pre className="text-xs text-gray-400 mt-2 overflow-x-auto bg-gray-800 rounded p-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        );
      }

      // Full-page fallback for app-level boundary (no name prop)
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="card p-8 text-center">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <Activity className="h-20 w-20 text-claude-orange animate-pulse" />
                  <AlertCircle className="h-8 w-8 text-red-400 absolute -top-2 -right-2" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white mb-3">
                Oops! Something went wrong
              </h1>

              {/* Description */}
              <p className="text-gray-400 mb-6">
                The dashboard encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 text-left bg-gray-800 rounded-lg p-4 border border-red-500/30">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Error Details:</h3>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-6 py-3 bg-claude-orange hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Dashboard
                </button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-500 mt-6">
                If this error persists, please{' '}
                <a
                  href="https://github.com/mukul975/agentdashboard/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-claude-orange hover:text-orange-400 underline"
                >
                  report it on GitHub
                </a>
              </p>
            </div>

            {/* Tips Card */}
            <div className="mt-6 card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Troubleshooting Tips:</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Check if the backend server is running on port 3001</li>
                <li>• Verify that Claude Code agent teams are active</li>
                <li>• Try clearing your browser cache and reloading</li>
                <li>• Check the browser console for additional error details</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

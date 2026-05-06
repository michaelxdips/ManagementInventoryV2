import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './Button';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <div className="error-boundary-icon" aria-hidden="true">⚠️</div>
          <p className="section-kicker">Terjadi Gangguan Tampilan</p>
          <h1 className="error-boundary-title">Aplikasi gagal memuat bagian ini.</h1>
          <p className="error-boundary-message">
            Silakan coba muat ulang aplikasi. Jika masih terjadi, hubungi administrator.
          </p>
          {this.state.message && (
            <code className="error-boundary-details">{this.state.message}</code>
          )}
          <div className="error-boundary-actions">
            <Button type="button" onClick={this.handleReload}>Muat Ulang</Button>
            <Button type="button" variant="secondary" onClick={this.handleReset}>Coba Lagi</Button>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;

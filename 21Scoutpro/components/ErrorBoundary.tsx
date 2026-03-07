import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary capturou um erro:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/50 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Erro ao carregar a aplicação</h1>
            <p className="text-zinc-300 mb-4">
              {this.state.error?.message || 'Ocorreu um erro inesperado'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#00f0ff] text-black font-bold rounded hover:bg-[#00f0ff]/80 transition-colors"
            >
              Recarregar Página
            </button>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-300">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-xs bg-black p-3 rounded overflow-auto max-h-40 text-red-400">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}
interface State {
  error: Error | null
}

/** Keeps one crashing app from taking down the whole OS. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-danger">This app ran into a problem.</p>
        <p className="max-w-xs break-words text-xs text-muted">{error.message}</p>
        <button
          onClick={this.reset}
          className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg"
        >
          Reload
        </button>
      </div>
    )
  }
}

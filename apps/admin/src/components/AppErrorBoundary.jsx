import React from 'react'

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {hasError: false}
  }

  static getDerivedStateFromError() {
    return {hasError: true}
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App crash captured by boundary', {error, info})
  }

  handleReset = () => {
    this.setState({hasError: false})
    window.location.assign('/')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{margin: '2rem auto', maxWidth: 560, padding: '2rem'}}>
          <h2 style={{marginTop: 0}}>Something went wrong</h2>
          <p style={{color: '#6b7280'}}>
            We hit a snag rendering this view. Refresh the page or return to the dashboard. If the issue
            persists, clear cached data or contact support with the timestamp below.
          </p>
          <p style={{fontSize: 12, color: '#9ca3af'}}>Timestamp: {new Date().toISOString()}</p>
          <div style={{display: 'flex', gap: 10}}>
            <button onClick={this.handleReset} className="primary">
              Reload Nimbus Admin
            </button>
            <button onClick={() => window.location.assign('/dashboard')}>Go to dashboard</button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary

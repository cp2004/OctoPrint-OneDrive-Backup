import * as React from "react"

export default class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError () {
    return { hasError: true }
  }

  componentDidCatch (error, errorInfo) {
    console.error(error, errorInfo)
  }

  render () {
    if (this.state.hasError) {
      return <this.props.onError />
    }

    return this.props.children
  }
}

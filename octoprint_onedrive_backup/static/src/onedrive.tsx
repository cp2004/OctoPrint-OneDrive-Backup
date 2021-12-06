import * as React from "react"
import * as ReactDom from "react-dom"

import App from "./components/App"

// @ts-ignore:next-line
const OctoPrint = window.OctoPrint

// Add socket unsubscribe handler, to avoid useEffect memory leaks
// Where we would keep increasing handlers
OctoPrint.socket.removeMessage = (message: string, handler: Function) => {
  /* eslint-disable-next-line */
  if (!OctoPrint.socket.registeredHandlers.hasOwnProperty(message)) {
    // No handlers registered, do nothing
    return
  }

  const index = OctoPrint.socket.registeredHandlers[message].indexOf(handler)
  if (index > -1) {
    OctoPrint.socket.registeredHandlers[message].splice(index, 1)
  }
}

// OK, so this is not pretty. If we start rendering our UI before OctoPrint loads most other things
// (which is after this file is 'executed'), we get lots of errors of things not being initialized yet etc. etc.
// So we create a mini-viewmodel, that calls the render, so we know things like socket connection are active.
function OneDriveBackupVM () {
  this.onStartup = () => {
    ReactDom.render(<App/>, document.getElementById("onedrive_backup_root"))
  }
}
// @ts-ignore:next-line
window.OCTOPRINT_VIEWMODELS.push({
  construct: OneDriveBackupVM,
  name: "OneDriveBackupViewModel"
})

import * as React from "react"
import ReactDom from "react-dom"

import Footer from "./components/Footer"

const PLUGIN_ID = "onedrive_backup"
const COMMANDS = {
  startAuth: "startAuth"
}

const OctoPrint = window.OctoPrint

// Add socket unsubscribe handler, to avoid useEffect memory leaks
// Where we would exponentially increase handlers
OctoPrint.socket.removeMessage = (message, handler) => {
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

function Settings () {
  const [accounts, setAccounts] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [authData, setAuthData] = React.useState({
    url: "",
    code: ""
  })

  React.useEffect(() => {
    // Register websocket handler

    const apiGet = () => {
      OctoPrint.simpleApiGet(PLUGIN_ID).done((data) => {
        setAccounts(data.accounts)
        if (data.flow) {
          setAuthData({
            url: data.flow.verification_uri,
            code: data.flow.user_code
          })
        }
      })
    }

    const socketHandler = (message) => {
      const plugin = message.data.plugin
      if (plugin === "onedrive_backup") {
        const type = message.data.data.type
        if (type === "auth_done") {
          setSuccess(true)
          setAuthData({
            url: "",
            code: ""
          })
          apiGet()
        }
      }
    }

    apiGet()

    OctoPrint.socket.onMessage("plugin", socketHandler)
    // Unsubscribe to prevent memory leaks.
    return () => {
      OctoPrint.socket.removeMessage("plugin", socketHandler)
    }
  }, [])

  const accountsList = accounts.map(account => (
    <li key={account}>{account}</li>
  ))

  const addAccount = () => {
    setLoading(true)
    OctoPrint.simpleApiCommand(PLUGIN_ID, COMMANDS.startAuth).done((data) => {
      setAuthData({
        url: data.url,
        code: data.code
      })
      setLoading(false)
    })
  }

  const isAddingAccount = authData.url && authData.code

  return (
    <>
      <h5>OneDrive Backup Plugin</h5>

      {accountsList.length
        ? <>
            <p>Accounts registered:</p>
            <ul>{accountsList}</ul>
          </>
        : <p>
          No accounts registered, add one below
        </p>
      }

      <div className={"row-fluid"} >
        <div className={"span6"}>
          <h5>Add a new account:</h5>
        </div>
        <div className={"span6"}>
          <button className={"btn btn-success"} onClick={addAccount}>
            <i className={"fas fa-fw " + (loading ? "fa-spin fa-spinner" : "fa-plus")} />{" Add"}
          </button>
        </div>
      </div>

      {isAddingAccount && <div className={"row-fluid"}>
        <p>
          Head to <a href={authData.url} target={"_blank"} rel={"noreferrer"}>{authData.url}</a> and enter code
          {" "}<code>{authData.code}</code> to connect your Microsoft account
        </p>
      </div>
      }

      {success && <div className={"alert alert-success"}>
        <p>
          <strong>Success! </strong>
          Your account has been successfully added to the plugin.
        </p>
      </div>
      }

      <Footer />
    </>
  )
}

// OK, so this is not pretty. If we start rendering our UI before OctoPrint loads most other things
// (which is quite slow), we get lots of errors of things not being initialized yet etc. etc.
// So we create a mini-viewmodel, that calls the render, so we know things like socket connection are active.
function OneDriveBackupVM () {
  this.onStartup = () => {
    ReactDom.render(<Settings/>, document.getElementById("onedrive_backup_root"))
  }
}
window.OCTOPRINT_VIEWMODELS.push({
  construct: OneDriveBackupVM,
  name: "OneDriveBackupViewModel"
})

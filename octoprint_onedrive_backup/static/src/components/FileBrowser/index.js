import * as React from "react"
import { Alert } from "../bootstrap/"

const OctoPrint = window.OctoPrint

export default function FileBrowser (props) {
  const [loading, setLoading] = React.useState(false)
  const [initialLoad, setInitialLoad] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [folderData, setFolderData] = React.useState([])
  const [isRoot, setIsRoot] = React.useState(true)
  const [selectedFolder, setSelectedFolder] = React.useState("")
  const [history, setHistory] = React.useState([])
  const setHistoryPos = React.useState(0)[1]

  const loadFiles = (itemId, fromHistory = false) => {
    setLoading(true)

    const processResponse = (response) => {
      if (response.error) {
        setError(true)
      }
      setLoading(false)
      setInitialLoad(false)
      setFolderData(response.folders)
      setIsRoot(response.root)
    }

    // Save previous folder for back button
    if (!initialLoad && folderData.length) {
      setHistory((prevState) => {
        const newState = prevState.concat([folderData[0].parent])
        if (!fromHistory) {
          setHistoryPos(newState.length)
        }
        return newState
      })
    }

    if (itemId) {
      OctoPrint.simpleApiCommand("onedrive_backup", "foldersById", { id: itemId }).done(processResponse)
    } else {
      OctoPrint.simpleApiCommand("onedrive_backup", "folders").done(processResponse)
    }
  }

  const back = () => {
    setHistoryPos((prevState) => {
      const newState = prevState > 0 ? prevState - 1 : 0
      loadFiles(history[newState], true)
      return newState
    })
  }

  const setSelected = (event) => {
    const target = event.target
    const value = target.checked
    const name = target.name

    if (value) {
      setSelectedFolder(name)
    }
  }

  const files = folderData.map(folder => (
    <tr key={folder.id}>
      <td>
        {folder.childCount > 0
          ? <a onClick={() => loadFiles(folder.id)} style={{ cursor: "pointer" }}>
            <i className={"far fa-folder-open"}/> {folder.name}</a>
          : <span>
            <i className={"far fa-folder-open"} /> {folder.name}</span>
        }
      </td>
      <td>
        <input type="checkbox" name={folder.id} checked={selectedFolder === folder.id} onChange={setSelected} />
      </td>
    </tr>
  ))

  return (
    <>
      {error && <Alert variant={"error"}>
        <i className={"fas fa-times text-error"} /><strong> Error:</strong>
        {error}
      </Alert>}
      {!initialLoad
        ? <table className={"table"}>
        <thead>
        <tr>
          <th>Folder name {loading && <i className={"fas fa-spin fa-spinner"} />} </th>
          <th>Selected?</th>
        </tr>
        </thead>
        <tbody>
        {isRoot
          ? undefined
          : <tr>
            <td>
              <span onClick={back} style={{ cursor: "pointer" }}><i className={"fas fa-arrow-left"} /> Back</span>
            </td>
            <td/>
            </tr>}
        {folderData.length ? files : <tr><td><span className={"muted"}><i className={"fas fa-times"} /> This folder is empty</span></td><td/></tr>}
        </tbody>
      </table>
        : <div className={"row-fluid text-center"}>
        <button className={"btn btn-primary"} onClick={() => loadFiles()}>
          <i className={"fa-fw " + (loading ? "fas fa-spin fa-spinner" : "far fa-folder-open")}/> Load folders
        </button>
      </div>}
    </>
  )
}

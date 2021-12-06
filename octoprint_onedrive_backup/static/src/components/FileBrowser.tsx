import * as React from "react"
import { Alert } from "./bootstrap/"
import {useQuery} from "react-query";

//@ts-ignore:next-line
const OctoPrint = window.OctoPrint

export default function FileBrowser () {
    const [active, setActive] = React.useState<boolean>(false)
    const [currentFolder, setCurrentFolder] = React.useState<string>("root")

    const [history, setHistory] = React.useState<string[]>([])
    const [historyPos, setHistoryPos] = React.useState<number>(0)

    const fetchFiles = (itemId: string = "root") => {
        if (itemId === "root") {
            return OctoPrint.simpleApiCommand("onedrive_backup", "folders")
        } else {
            return OctoPrint.simpleApiCommand("onedrive_backup", "foldersById", { id: itemId })
        }
    }

    const {data, isLoading, error: queryError} = useQuery(
        ["folders", currentFolder],
        () => fetchFiles(currentFolder),
        {
            enabled: active,
        }
    )

    // TODO - make sure no duplicate network requests, with the auth component
    const {data: configData, isLoading: configDataLoading, refetch: refetchConfig} = useQuery(
        "accounts",
        () => {
            return OctoPrint.simpleApiGet("onedrive_backup")
        }
    )

    const handleSelectFolder = (target) => {
        setHistory(prevState => prevState.concat([currentFolder]))
        setCurrentFolder(target)
        setHistoryPos(prevState => prevState + 1)
    }

    const handleBack = () => {
        if (history.length >= 0 && historyPos > 0) {
            const newHistoryPos = historyPos - 1
            const newFolder = history[newHistoryPos]
            setHistoryPos(newHistoryPos)
            setCurrentFolder(newFolder)
            setHistory(prevState => prevState.slice(0, newHistoryPos))
        }
    }

    const handleActivateFolder = (folder) => {
        OctoPrint.simpleApiCommand("onedrive_backup", "setFolder", { id: folder.id, path: folder.path }).done(
            () => refetchConfig()
        )
    }

    const files = data?.folders ? data.folders.map(folder => (
        <tr key={folder.id}>
            <td>
                {folder.childCount > 0 ?
                    <a onClick={() => handleSelectFolder(folder.id)} style={{ cursor: "pointer" }}>
                        <i className={"far fa-folder-open"}/> {folder.name}
                    </a>
                    : <span><i className={"far fa-folder-open"}/> {folder.name}</span>
                }
            </td>
            <td>
                <button className={"btn btn-primary btn-mini"} onClick={() => handleActivateFolder(folder)}>
                    Set upload destination
                </button>
            </td>
        </tr>
    )) : []

    const hasError = queryError || data?.error
    const loading = isLoading || configDataLoading

    return (
        <>
            {
                configDataLoading
                    ? <span><i className={"fas fa-spin fa-spinner"} /> Loading...</span>
                    : <span>Currently configured upload destination: {configData?.folder.path ? <code>{configData.folder.path}</code> : "None"}</span>
            }
            {hasError &&
            <Alert variant={"error"}>
                <i className={"fas fa-times text-error"} /><strong> Error:</strong>
                {typeof data.error === "string" ? data.error : "Unknown error. Check octoprint.log for details."}
            </Alert>}
            {active
                ? (
                    <table className={"table"}>
                    <thead>
                        <tr>
                            <th>Folder name {loading && <i className={"fas fa-spin fa-spinner"} />} </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyPos > 0 &&
                        <tr>
                            <td>
                                <span onClick={handleBack} style={{ cursor: "pointer" }}><i className={"fas fa-arrow-left"} /> Back</span>
                            </td>
                            <td/>
                        </tr>}
                        {files.length ? files : (
                            <>
                                {!isLoading && !hasError && (
                                    <tr>
                                        <td>
                                            <i className={"fas fa-times"} /> No sub-folders found
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                    </table>
                ) :
                <div className={"row-fluid"}>
                    <button className={"btn btn-primary"} onClick={() => setActive(true)}>
                        <i className={"fa-fw " + (isLoading ? "fas fa-spin fa-spinner" : "far fa-folder-open")}/> Change folder
                    </button>
                </div>
            }
        </>
    )
}

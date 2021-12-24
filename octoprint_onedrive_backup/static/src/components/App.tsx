import * as React from "react"

import ErrorBoundary from "./ErrorBoundary"
import FileBrowser from "./FileBrowser"
import Footer from "./Footer"
import {QueryClient, QueryClientProvider} from "react-query";
import { ReactQueryDevtools } from 'react-query/devtools'
import Auth from "./Auth";
import useSocket from "../hooks/useSocket";
import SecurityWarning from "./Security";

// @ts-ignore:next-line
const Pnotify = window.PNotify
// @ts-ignore:next-line
const lodash = window._
const PLUGIN_ID = "onedrive_backup"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        }
    }
})

export default function Index() {
    return (
        <ErrorBoundary onError={OnError} >
            <QueryClientProvider client={queryClient}>
                <ReactQueryDevtools initialIsOpen={false}/>
                <App />
            </QueryClientProvider>
        </ErrorBoundary>
    )
}

function OnError () {
    return (
        <>
            <h2 className={"text-error"}>
                There was an error rendering the UI.
            </h2>
            <p>
                {"Please "}
                <a href={"https://github.com/cp2004/OctoPrint-NextGen-UI/issues/new/choose"} target={"_blank"}>
                    report this error
                </a>
                , including the full JavaScript console contents in the report.
            </p>
        </>
    )
}

function App () {
    // Store reference to notification so we can update it
    const [progressNotification, setProgressNotification] = React.useState<any>(null)

    // Backend notification handler
    useSocket("plugin", (message) => {
        const plugin = message.data.plugin
        if (plugin !== PLUGIN_ID) {
            return
        }

        const type = message.data.data.type
        if (type == "upload_progress") {
            const progress = message.data.data.content.progress

            if (progressNotification && progressNotification.state === "open"){
                progressNotification.update({
                    text: `${progress}% complete`
                })
            } else {
                const notify = new Pnotify({
                    title: "Uploading backup to OneDrive",
                    text: `Upload ${progress}% complete...`,
                    hide: false,
                })
                setProgressNotification(notify)
            }
        }
        if (type === "upload_complete") {
            if (progressNotification) {
                progressNotification.remove()
                setProgressNotification(null)
            }
            new Pnotify({
                title: "Upload complete",
                text: "Backup successfully uploaded to OneDrive",
                type: "success",
                hide: true,
                delay: 30 * 1000  // 30 seconds
            })
        }
        if (type === "upload_error") {
            if (progressNotification) {
                progressNotification.remove()
                setProgressNotification(null)
            }
            new Pnotify({
                title: "Upload error",
                text: `There was an error uploading your backup. Please check the <code>octoprint.log</code> for details. <br> <pre>${lodash.escape(message.data.data.content.error)}</pre>`,
                type: "error",
                hide: false,
            })
        }
    })

    return (
        <>
            <h5>OneDrive Backup Plugin</h5>

            <Auth />

            <hr />

            <FileBrowser />

            <SecurityWarning />

            <Footer />
        </>
    )
}

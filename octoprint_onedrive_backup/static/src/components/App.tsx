import * as React from "react"

import FileBrowser from "./FileBrowser"
import Footer from "./Footer"
import {QueryClient, QueryClientProvider} from "react-query";
import { ReactQueryDevtools } from 'react-query/devtools'
import Auth from "./Auth";

// @ts-ignore:next-line
const OctoPrint = window.OctoPrint
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
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false}/>
            <App />
        </QueryClientProvider>
    )
}

function App () {
    // TODO error boundary
    return (
        <>
            <h5>OneDrive Backup Plugin</h5>

            <Auth />

            <hr />

            <FileBrowser />

            <Footer />
        </>
    )
}

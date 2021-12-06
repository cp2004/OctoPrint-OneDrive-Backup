import * as React from "react"
import {useQuery} from "react-query";
import useSocket from "../hooks/useSocket";

// @ts-ignore:next-line
const OctoPrint = window.OctoPrint
const PLUGIN_ID = "onedrive_backup"

interface AuthData {
    url: string,
    code: string
}

interface PluginSocketMessage {
    data: {
        plugin: string;
        data: {
            type: string;
            content: object;
        }
    };
}

interface AuthProps {
    accounts: string[];
}

export default function Auth () {
    const [authSuccess, setAuthSuccess] = React.useState<boolean>(false)
    const [authLoading, setAuthLoading] = React.useState<boolean>(false)

    const {data, isLoading, error, refetch} = useQuery(
        "accounts",
        () => {
            return OctoPrint.simpleApiGet(PLUGIN_ID)
        }
    )

    const hasAccount = Boolean(data?.accounts.length)
    const addingAccount = data?.flow

    const accountsList = hasAccount ? data.accounts.map(account => (
        <li key={account}>{account}</li>
    )) : []

    useSocket("plugin", (message) => {
        const plugin = message.data.plugin
        if (plugin === "onedrive_backup") {
            const type = message.data.data.type
            if (type === "auth_done") {
                setAuthSuccess(true)
                // Rerun query to make new data show up
                refetch()
            }
        }
    })

    const addAccount = () => {
        setAuthLoading(true)
        OctoPrint.simpleApiCommand(PLUGIN_ID, "startAuth").done((data) => {
            // The parameters are also passed through `data` here, but refetching the original query is less code
            refetch()
            setAuthLoading(false)
        })
    }

    const loading = isLoading || authLoading

    return (
        <>
            {hasAccount
                ? <>
                    <p>Account registered:</p>
                    <ul>{accountsList}</ul>
                  </>
                : <p>
                    No Microsoft accounts registered, add one below
                  </p>
            }

            <div className={"row-fluid"} >
                <button className={"btn btn-success"} onClick={addAccount}>
                    <i className={"fas fa-fw " + (loading ? "fa-spin fa-spinner" : hasAccount ? "fa-user-edit" : "fa-user-plus" )} />
                    {" "}{hasAccount ? "Change Account" : "Add account"}
                </button>
            </div>

            {addingAccount && <div className={"row-fluid"}>
                <p style={{marginTop: "10px"}}>
                    Head to <a href={data.flow.verification_uri} target={"_blank"} rel={"noreferrer"}>{data.flow.verification_uri}</a> and enter code
                    {" "}<code>{data.flow.user_code}</code> to connect your Microsoft account
                </p>
            </div>
            }

            {authSuccess && <div className={"alert alert-success"}>
                <p>
                    <strong>Success! </strong>
                    Your account has been successfully added to the plugin.
                    Make sure to configure the path to upload your backups to below.
                </p>
            </div>
            }
        </>
    )
}

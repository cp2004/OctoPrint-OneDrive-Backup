import * as React from "react"
import {useQuery} from "react-query";
import useSocket from "../hooks/useSocket";
import copy from 'copy-to-clipboard'

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
        OctoPrint.simpleApiCommand(PLUGIN_ID, "startAuth").done(() => {
            // The parameters are also passed through `data` here, but refetching the original query is less code
            refetch()
            setAuthLoading(false)
        })
    }

    const forgetAccount = () => {
        setAuthLoading(true)
        OctoPrint.simpleApiCommand(PLUGIN_ID, "forget").done(() => {
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

            <div>
                <button className={"btn btn-success"} onClick={addAccount}>
                    <i className={"fas fa-fw " + (loading ? "fa-spin fa-spinner" : hasAccount ? "fa-user-edit" : "fa-user-plus" )} />
                    {" "}{hasAccount ? "Change Account" : "Add account"}
                </button>
                {hasAccount &&
                <button className={"btn btn-danger"} style={{marginLeft: "5px"}} onClick={forgetAccount}>
                    <i className={"fas fa-fw fa-trash"} />
                    {" "}Forget Account
                </button>
                }
            </div>

            {addingAccount && <div className={"row-fluid"}>
                <p style={{marginTop: "10px"}}>
                    Head to <a href={data.flow.verification_uri} target={"_blank"} rel={"noreferrer"}>{data.flow.verification_uri}</a> and enter code
                    {" "}<code>{data.flow.user_code}</code> to connect your Microsoft account
                </p>
                <p>
                    <button className={"btn btn-mini"} onClick={() => { copy(data.flow.user_code) }} >
                        <i className={"fas fa-fw fa-copy"} />
                        {" "}Copy code
                    </button>
                </p>
            </div>
            }

            {authSuccess && <div className={"alert alert-success"} style={{marginTop: "5px"}}>
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

import * as React from "react"

export default function SecurityWarning () {
    return (
        <>
            <hr />
            <h5>Important Security Notice</h5>
            <p>
                Please be aware that this plugin stores its tokens for accessing your Microsoft account in OctoPrint's
                configuration folder. As a result, if your OctoPrint install (or the server it is running on) is
                compromised, your files in OneDrive are at risk.
            </p>
            <p>
                <strong>
                    It is not recommended to use this plugin on OctoPrint installs accessible directly from the
                    internet, or multi-user installs where you may not trust every user.
                </strong>
            </p>
            <p>
                The author of this plugin is not responsible for any damage caused as a result of using this plugin.
            </p>
        </>
    )
}

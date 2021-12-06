import * as React from 'react';

// @ts-ignore:next-line
const OctoPrint = window.OctoPrint;

type socketMessage = "connected" | "current" | "history" | "event" | "slicingProgress" | "plugin"
type socketCallback = (message: any) => void

export default function useSocket(message: socketMessage, callback: socketCallback) {
    React.useEffect(() => {
        OctoPrint.socket.onMessage(message, callback);
        return () => {
            OctoPrint.socket.removeMessage(message, callback);
        }
    })
}

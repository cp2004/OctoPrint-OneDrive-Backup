import * as React from "react"

const alertClassMap = {
    error: "alert-error",
    success: "alert-success",
    info: "alert-info"
}

interface AlertProps {
    variant: "error" | "success" | "info";
    block?: boolean;
    children: React.ReactNode;
}

export function Alert ({ variant, block, children, ...rest }: AlertProps & React.HTMLAttributes<HTMLDivElement>) {
    const alertClass = "alert " + (variant ? alertClassMap[variant] : "") + (block ? " alert-block" : "")

    return (
        <div className={alertClass} {...rest}>
            {children}
        </div>
    )
}

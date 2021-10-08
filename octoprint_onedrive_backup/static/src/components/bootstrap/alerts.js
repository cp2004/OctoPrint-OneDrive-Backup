import * as React from "react"

const alertClassMap = {
  error: "alert-error",
  success: "alert-success",
  info: "alert-info"
}

export function Alert ({ variant, block, children, ...rest }) {
  const alertClass = "alert" + (variant ? alertClassMap[variant] : "") + (block ? "block" : "")

  return (
    <div className={alertClass} {...rest}>
      {children}
    </div>
  )
}

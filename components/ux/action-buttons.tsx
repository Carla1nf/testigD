import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { XCircle } from "lucide-react"
import React, { Children, ReactNode } from "react"

type ActionButtonParams = { title: string; when: boolean; disabled?: boolean; onClick: () => void }

export const ActionButton = ({ disabled, onClick, title, when }: ActionButtonParams) => {
  if (when) {
    return (
      <Button variant="action" onClick={() => onClick?.()} disabled={disabled}>
        {title}
      </Button>
    )
  }
  return null
}

type ActionMutedButtonParams = { title: string; when: boolean }

export const ActionMutedButton = ({ title, when }: ActionMutedButtonParams) => {
  if (when) {
    return (
      <Button variant="action-muted" className="cursor-default">
        {title}
      </Button>
    )
  }
  return null
}

type ActionSpinnerButtonParams = { title: string; when: boolean; disabled?: boolean; onClick?: () => void }

export const ActionSpinnerButton = ({ disabled, onClick, title, when }: ActionSpinnerButtonParams) => {
  if (when) {
    return (
      <Button variant="action" onClick={() => onClick?.()} disabled={disabled}>
        {title}
        <SpinnerIcon className="ml-2 animate-spin-slow" />
      </Button>
    )
  }
  return null
}

type ActionErrorButtonParams = { title: string; when: boolean; disabled?: boolean; onClick?: () => void }

export const ActionErrorButton = ({ disabled, onClick, title, when }: ActionErrorButtonParams) => {
  if (when) {
    return (
      <Button variant="error" className="px-12 gap-2" onClick={() => onClick?.()} disabled={disabled}>
        <XCircle className="h-5 w-5" />
        {title}
      </Button>
    )
  }
  return null
}

type ActionCancelButtonParams = { title?: string; when: boolean; onClick?: () => void }

export const ActionCancelButton = ({ onClick, title, when }: ActionCancelButtonParams) => {
  if (when) {
    // outline or ghost?
    return (
      <Button variant="ghost" className="" onClick={() => onClick?.()}>
        {title ?? "Cancel"}
      </Button>
    )
  }
  return null
}

const ActionButtonGroup = ({
  left,
  right,
  className,
  when,
}: {
  left?: ReactNode
  right?: ReactNode
  className?: string
  when: boolean
}) => {
  if (!when) {
    return null
  }
  if (left && right) {
    return (
      <div className={cn("flex flex-row justify-between", className)}>
        {left}
        {right}
      </div>
    )
  }
  if (left) {
    return <div className={cn("flex flex-row justify-end", className)}>{left}</div>
  }
  if (right) {
    return <div className={cn("flex flex-row justify-end", className)}>{right}</div>
  }
  return null
}

const ActionButtons = {
  Action: ActionButton,
  Muted: ActionMutedButton,
  Spinner: ActionSpinnerButton,
  Error: ActionErrorButton,
  Cancel: ActionCancelButton,
  Group: ActionButtonGroup,
}

export default ActionButtons

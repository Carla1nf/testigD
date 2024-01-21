import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { SpinnerIcon } from "@/components/icons"

type ActionButtonParams = { title: string; when: boolean; disabled?: boolean; onClick: () => void }

export const ActionButton = ({ disabled, onClick, title, when }: ActionButtonParams) => {
  if (when) {
    return (
      <Button variant="default" onClick={() => onClick?.()} disabled={disabled}>
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
      <Button variant="muted" className="cursor-default">
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
      <Button variant="default" onClick={() => onClick?.()} disabled={disabled}>
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
    return (
      <Button variant="outline" className="" onClick={() => onClick?.()}>
        {title ?? "Cancel"}
      </Button>
    )
  }
  return null
}

const ActionButtons = {
  Action: ActionButton,
  Muted: ActionMutedButton,
  Spinner: ActionSpinnerButton,
  Error: ActionErrorButton,
  Cancel: ActionCancelButton,
}

export default ActionButtons

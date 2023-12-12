"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  // Set a duration={30000} on the ToastProvider to make toasts auto-dismiss after 30 seconds
  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, transaction, ...props }) {
        return (
          <Toast key={id} {...props}>
            {icon ? (
              <div className="flex flex-row gap-4">
                <div className="mr-2">{icon}</div>
                <Content title={title} description={description} action={action} transaction={transaction} />
              </div>
            ) : (
              <Content title={title} description={description} action={action} transaction={transaction} />
            )}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

const Content = ({
  title,
  description,
  action,
  transaction,
}: {
  title: any
  description?: any
  action?: any
  transaction?: any
}) => {
  return (
    <div>
      <div className="grid gap-1">
        {title ? <ToastTitle>{title}</ToastTitle> : null}
        {description ? <ToastDescription>{description}</ToastDescription> : null}
      </div>
      {action}
      {transaction ? (
        <div className="mt-2">
          <Transaction transaction={transaction} />
        </div>
      ) : null}
    </div>
  )
}

const Transaction = ({ transaction }: { transaction: string }) => {
  if (!transaction) return null
  return (
    <a href={transaction} target="_blank" rel="noopener noreferrer" className="text-xs underline">
      View Tx
    </a>
  )
}

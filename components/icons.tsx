export const DashboardEqualizer = ({ className }: { className?: string }) => {
  return (
    <svg
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      data-testid="DashboardEqualizer"
      className={className}
      //   style="width: 120px; height: 120px; margin-top: 3px; color: rgb(166, 167, 102);"
    >
      <path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"></path>
    </svg>
  )
}

export const DashboardAccountBalance = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      data-testid="DashboardAccountBalance"
      //   style="width: 120px; height: 120px; margin-top: 3px; color: rgb(107, 102, 167);"
    >
      <path d="M4 10h3v7H4zm6.5 0h3v7h-3zM2 19h20v3H2zm15-9h3v7h-3zm-5-9L2 6v2h20V6z"></path>
    </svg>
  )
}

export const DashboardSavings = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      data-testid="DashboardSavings"
      //   style="width: 120px; height: 120px; margin-top: 3px; color: rgb(167, 102, 102);"
    >
      <path d="m19.83 7.5-2.27-2.27c.07-.42.18-.81.32-1.15.08-.18.12-.37.12-.58 0-.83-.67-1.5-1.5-1.5-1.64 0-3.09.79-4 2h-5C4.46 4 2 6.46 2 9.5S4.5 21 4.5 21H10v-2h2v2h5.5l1.68-5.59 2.82-.94V7.5h-2.17zM13 9H8V7h5v2zm3 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path>
    </svg>
  )
}

export const DashboardAccessAlarm = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      data-testid="DashboardAccessAlarm"
      //   style="width: 120px; height: 120px; margin-top: 3px; color: rgb(102, 167, 108);"
    >
      <path d="m22 5.72-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39 6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"></path>
    </svg>
  )
}

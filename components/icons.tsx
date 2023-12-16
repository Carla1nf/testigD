import { cn } from "@/lib/utils"

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

export const AvailableIcon = ({ className }: { className?: string }) => {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AvailableIcon" className={className}>
      {/* <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"></path> */}
      <path d="M16.53 11.06 15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"></path>
    </svg>
  )
}

export const MarketSizeIcon = ({ className }: { className?: string }) => {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AvailableIcon" className={className}>
      <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"></path>
    </svg>
  )
}

export const TotalLentIcon = ({ className }: { className?: string }) => {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AvailableIcon" className={className}>
      {/* <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"></path> */}
      {/* <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 15.76V19h-1.75v-1.29c-.74-.18-2.39-.77-3.02-2.96l1.65-.67c.06.22.58 2.09 2.4 2.09.93 0 1.98-.48 1.98-1.61 0-.96-.7-1.46-2.28-2.03-1.1-.39-3.35-1.03-3.35-3.31 0-.1.01-2.4 2.62-2.96V5h1.75v1.24c1.84.32 2.51 1.79 2.66 2.23l-1.58.67c-.11-.35-.59-1.34-1.9-1.34-.7 0-1.81.37-1.81 1.39 0 .95.86 1.31 2.64 1.9 2.4.83 3.01 2.05 3.01 3.45 0 2.63-2.5 3.13-3.02 3.22z"></path> */}
      <path d="M17 2H7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 4H7V4h10v2zm3 16H4c-1.1 0-2-.9-2-2v-1h20v1c0 1.1-.9 2-2 2zm-1.47-11.81C18.21 9.47 17.49 9 16.7 9H7.3c-.79 0-1.51.47-1.83 1.19L2 18h20l-3.47-7.81zM9.5 16h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm0-2h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm0-2h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm3 4h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm0-2h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm0-2h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm3 4h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm0-2h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5zm0-2h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5s-.22.5-.5.5z"></path>
    </svg>
  )
}

export const PriceIcon = ({ className }: { className?: string }) => {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AvailableIcon" className={className}>
      <path d="M4 9h4v11H4zm12 4h4v7h-4zm-6-9h4v16h-4z"></path>
    </svg>
  )
}

export const HourGlassIcon = ({ className }: { className?: string }) => {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AvailableIcon" className={className}>
      <path d="m18 22-.01-6L14 12l3.99-4.01L18 2H6v6l4 4-4 3.99V22h12zM8 7.5V4h8v3.5l-4 4-4-4z"></path>
    </svg>
  )
}

export const PercentageIcon = ({ className }: { className?: string }) => {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AvailableIcon" className={className}>
      <path d="M7.5 11C9.43 11 11 9.43 11 7.5S9.43 4 7.5 4 4 5.57 4 7.5 5.57 11 7.5 11zm0-5C8.33 6 9 6.67 9 7.5S8.33 9 7.5 9 6 8.33 6 7.5 6.67 6 7.5 6zM4.0025 18.5832 18.59 3.9955l1.4142 1.4143L5.4167 19.9974zM16.5 13c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm0 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
    </svg>
  )
}

export const PersonIcon = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
      <path
        d="M20,21V19a4,4,0,0,0-4-4H8a4,4,0,0,0-4,4v2"
        fill="none"
        stroke="#D1D1D1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="7"
        fill="none"
        r="4"
        stroke="#D1D1D1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export const SpinnerIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn("-ml-1 mr-3 h-5 w-5 text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

export const DebitaIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="44"
      height="34"
      viewBox="0 0 44 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("-ml-1 mr-3 h-5 w-5 text-white", className)}
    >
      <path
        d="M12.3827 25.7576C11.3469 25.7576 10.4089 25.4913 9.56842 24.9586C8.7339 24.42 8.07103 23.6299 7.57979 22.5882C7.09446 21.5406 6.8518 20.2563 6.8518 18.7352C6.8518 17.1727 7.10334 15.8736 7.60642 14.8378C8.1095 13.7962 8.77829 13.0179 9.61281 12.503C10.4532 11.9821 11.3736 11.7217 12.3738 11.7217C13.1373 11.7217 13.7736 11.8519 14.2826 12.1123C14.7975 12.3668 15.2118 12.6864 15.5255 13.0712C15.8451 13.4499 16.0877 13.8228 16.2534 14.1898H16.3688V7.35383H20.1419V25.5356H16.4132V23.3517H16.2534C16.0759 23.7305 15.8243 24.1063 15.4988 24.4792C15.1792 24.8461 14.762 25.1509 14.247 25.3936C13.738 25.6363 13.1166 25.7576 12.3827 25.7576ZM13.5812 22.748C14.1908 22.748 14.7057 22.5823 15.1259 22.2508C15.5521 21.9135 15.8776 21.443 16.1025 20.8393C16.3333 20.2356 16.4487 19.5283 16.4487 18.7175C16.4487 17.9066 16.3363 17.2023 16.1114 16.6045C15.8865 16.0068 15.561 15.5451 15.1348 15.2196C14.7087 14.8941 14.1908 14.7313 13.5812 14.7313C12.9598 14.7313 12.436 14.9 12.0098 15.2373C11.5837 15.5747 11.2611 16.0423 11.0421 16.64C10.8232 17.2378 10.7137 17.9303 10.7137 18.7175C10.7137 19.5105 10.8232 20.2119 11.0421 20.8215C11.267 21.4252 11.5896 21.8987 12.0098 22.242C12.436 22.5793 12.9598 22.748 13.5812 22.748ZM23.3224 25.5356V7.35383H27.1044V14.1898H27.2198C27.3855 13.8228 27.6252 13.4499 27.9389 13.0712C28.2585 12.6864 28.6728 12.3668 29.1818 12.1123C29.6967 11.8519 30.3359 11.7217 31.0994 11.7217C32.0937 11.7217 33.0111 11.9821 33.8515 12.503C34.692 13.0179 35.3637 13.7962 35.8668 14.8378C36.3699 15.8736 36.6214 17.1727 36.6214 18.7352C36.6214 20.2563 36.3758 21.5406 35.8846 22.5882C35.3992 23.6299 34.7364 24.42 33.8959 24.9586C33.0614 25.4913 32.1263 25.7576 31.0905 25.7576C30.3566 25.7576 29.7322 25.6363 29.2173 25.3936C28.7083 25.1509 28.291 24.8461 27.9655 24.4792C27.64 24.1063 27.3914 23.7305 27.2198 23.3517H27.0511V25.5356H23.3224ZM27.0245 18.7175C27.0245 19.5283 27.1369 20.2356 27.3618 20.8393C27.5867 21.443 27.9123 21.9135 28.3384 22.2508C28.7645 22.5823 29.2824 22.748 29.892 22.748C30.5075 22.748 31.0284 22.5793 31.4545 22.242C31.8807 21.8987 32.2032 21.4252 32.4222 20.8215C32.6471 20.2119 32.7596 19.5105 32.7596 18.7175C32.7596 17.9303 32.6501 17.2378 32.4311 16.64C32.2121 16.0423 31.8895 15.5747 31.4634 15.2373C31.0373 14.9 30.5135 14.7313 29.892 14.7313C29.2765 14.7313 28.7557 14.8941 28.3295 15.2196C27.9093 15.5451 27.5867 16.0068 27.3618 16.6045C27.1369 17.2023 27.0245 17.9066 27.0245 18.7175Z"
        fill="url(#paint0_linear_52_736)"
      />
      <line
        x1="15.9946"
        y1="32.2261"
        x2="27.4894"
        y2="32.2261"
        stroke="url(#paint1_linear_52_736)"
        stroke-width="3"
        stroke-linecap="square"
      />
      <line x1="15.9946" y1="1.5" x2="27.4894" y2="1.5" stroke="#BC528C" stroke-width="3" stroke-linecap="square" />
      <defs>
        <linearGradient
          id="paint0_linear_52_736"
          x1="4.45993"
          y1="21.0118"
          x2="40.6969"
          y2="21.0118"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#D75071" />
          <stop offset="1" stop-color="#705BDC" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_52_736"
          x1="13.9371"
          y1="32.7261"
          x2="28.4319"
          y2="32.7261"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#D75071" />
          <stop offset="1" stop-color="#725AD8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

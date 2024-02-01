"use client"

import React from "react"
import { useLocalStorage } from "usehooks-ts"
import ActionButtons from "./action-buttons"

const TermsAndConditions: React.FC = () => {
  const [showBanner, setShowBanner] = useLocalStorage("banner:terms-and-conditions", "waiting")

  if (typeof window === "undefined") {
    return null
  }
  if (showBanner === "accepted") {
    return null
  }

  const acceptTerms = () => setShowBanner("accepted")

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
      <div className="w-full max-w-lg p-5 bg-background rounded-lg overflow-hidden">
        <div className="text-lg font-semibold">Terms and Conditions</div>
        <div className="mt-2 h-[80vh] overflow-auto p-3 space-y-4 bg-secondary text-secondary-foreground text-xs">
          {/* Long Lorem Ipsum for the scrollable content */}
          <p>Acknowledgement of Terms & Conditions of access.</p>
          <p>
            Use of the Debita.fi website, services, dapp, or application is subject to the following terms and
            conditions and I hereby confirm that by proceeding and interacting with the protocol I am aware of these and
            accept them in full: Debita.fi is a smart contract protocol in alpha stage of launch, and even though a
            security audit has been completed on the smart contracts, I understand the risks associated with using the
            Debita protocol and associated functions. Any interactions that I have with the associated Debita protocol
            apps, smart contracts or any related functions MAY place my funds at risk, and I hereby release the Debita
            protocol and its contributors, team members, and service providers from any and all liability associated
            with my use of the above-mentioned functions. I am lawfully permitted to access this site and use the
            Debita.fi application functions, and I am not in contravention of any laws governing my jurisdiction of
            residence or citizenship.
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <ActionButtons.Action when={true} title="Accept Terms" onClick={acceptTerms} />
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions

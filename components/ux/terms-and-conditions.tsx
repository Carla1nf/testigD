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
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed ligula vitae sem lobortis aliquam. Sed
            nec nisl quis urna aliquet aliquam. Nullam sed nisl vel nisl aliquam luctus. Donec auctor, nunc in laoreet
            ultricies, nunc odio aliquam leo, non consectetur tortor risus eget nunc. Nullam aliquam, sem nec aliquet
            ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel turpis. Nullam sed nisl vel nisl aliquam
            luctus. Donec auctor, nunc in laoreet ultricies, nunc odio aliquam leo, non consectetur tortor risus eget
            nunc. Nullam aliquam, sem nec aliquet ultricies, purus tortor aliquam elit, eu aliquet nisl velit vel
            turpis.
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

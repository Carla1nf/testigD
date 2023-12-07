import React, { ReactElement } from "react"
import { LucideChevronRight } from "lucide-react"

type BreadcrumbsProps = {
  items: ReactElement[]
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <div className="flex gap-1 text-xs items-center mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item}
          {index < items.length - 1 ? <LucideChevronRight className="w-4 h-4 stroke-neutral-500" /> : null}
        </React.Fragment>
      ))}
    </div>
  )
}

export default Breadcrumbs

import { MoveLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const BackLink = ({ onClick }: { onClick?: () => void }) => {
  const router = useRouter()
  return (
    <div
      className="flex items-center gap-1 text-xs font-light cursor-pointer text-white/60 hover:text-white/75"
      onClick={() => {
        if (onClick) {
          onClick()
          return
        }
        router.back()
      }}
    >
      <MoveLeft className="w-5 h-5" />
      Back
    </div>
  )
}

export default BackLink

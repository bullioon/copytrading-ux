"use client"

type Props = {
  user: string
  level: "PRO" | "TORION"
  performance: number
}

export default function SocialPopup({
  user,
  level,
  performance,
}: Props) {
  return (
    <div className="fixed bottom-6 right-6 border border-green-900 bg-black p-4 rounded text-sm shadow-xl animate-pulse">
      <p className="font-bold text-green-400">
        🔔 {user} connected to {level} trader
      </p>
      <p className="text-xs opacity-70">
        Weekly performance: +{performance}%
      </p>
    </div>
  )
}


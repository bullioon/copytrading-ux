import { useEffect, useRef, useState } from "react"

export function useEquityBuffer(value: number, active: boolean) {
  const [buffer, setBuffer] = useState<number[]>([])
  const lastRef = useRef(0)

  useEffect(() => {
    if (Number.isFinite(value)) lastRef.current = value
  }, [value])

  useEffect(() => {
    if (!buffer.length) {
      setBuffer([lastRef.current])
    }
  }, [])

  useEffect(() => {
    if (!active) return

    const t = setInterval(() => {
      setBuffer(prev => {
        const next = [...prev, lastRef.current]
        return next.length > 160 ? next.slice(-160) : next
      })
    }, 1000)

    return () => clearInterval(t)
  }, [active])

  return buffer
}

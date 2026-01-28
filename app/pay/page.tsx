import { Suspense } from "react"
import PayClient from "./PayClient"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PayClient />
    </Suspense>
  )
}
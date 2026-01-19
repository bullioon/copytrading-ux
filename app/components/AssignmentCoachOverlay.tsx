"use client"

import AssignmentCoach from "./AssignmentCoach"

export type AssignmentCoachProps = {
  step: 1 | 2 | 3
  anchorId: string
  title: string
  subtitle: string
  cta: string
  onCta?: () => void
  onSkip?: () => void
}

export default function AssignmentCoachOverlay(props: AssignmentCoachProps) {
  return <AssignmentCoach {...props} />
}

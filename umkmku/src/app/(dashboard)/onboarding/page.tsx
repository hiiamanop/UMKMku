import { Suspense } from 'react'
import { OnboardingChat } from './_components/onboarding-chat'

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingChat />
    </Suspense>
  )
}

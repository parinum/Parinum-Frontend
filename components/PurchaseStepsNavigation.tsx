import { useRouter } from 'next/router'

interface Step {
  id: string
  label: string
  active: boolean
}

interface PurchaseStepsNavigationProps {
  steps: Step[]
}

export default function PurchaseStepsNavigation({ steps }: PurchaseStepsNavigationProps) {
  const router = useRouter()

  const navigateTo = (step: string) => {
    router.push(`/${step}-purchase`)
  }

  return (
    <div className="relative flex flex-wrap justify-center gap-2 mb-8 p-2 bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl">
      {/* Buttons */}
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => navigateTo(step.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 ${
            step.active
              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
              : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
          }`}
        >
          {step.label}
        </button>
      ))}
    </div>
  )
}

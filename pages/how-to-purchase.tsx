import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import PurchaseGuideDeck, { isGuideStepId, type GuideStepId } from '@/components/PurchaseGuideDeck'

export default function HowToPurchase() {
  const router = useRouter()
  const stepQuery = typeof router.query.step === 'string' ? router.query.step : null
  const activeStep: GuideStepId = stepQuery && isGuideStepId(stepQuery) ? stepQuery : 'create'

  const handleStepChange = (step: GuideStepId) => {
    router.replace(
      {
        pathname: '/how-to-purchase',
        query: { step },
      },
      undefined,
      { shallow: true }
    )
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PurchaseGuideDeck step={activeStep} onStepChange={handleStepChange} />
        </div>
      </div>
    </Layout>
  )
}

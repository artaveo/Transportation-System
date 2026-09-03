import { Suspense } from "react"
import { CheckoutForm } from "@/components/transport/checkout-form"

export default async function CheckoutPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return (
    <Suspense fallback={null}>
      <CheckoutForm tripId={tripId} />
    </Suspense>
  )
}

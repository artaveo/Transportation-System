import { Suspense } from "react"
import { BookingConfirmation } from "@/components/transport/booking-confirmation"

export default async function ConfirmationPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return (
    <Suspense fallback={null}>
      <BookingConfirmation tripId={tripId} />
    </Suspense>
  )
}

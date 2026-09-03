import { Suspense } from "react"
import { SeatSelection } from "@/components/transport/seat-selection"

export default async function SeatsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return (
    <Suspense fallback={null}>
      <SeatSelection tripId={tripId} />
    </Suspense>
  )
}

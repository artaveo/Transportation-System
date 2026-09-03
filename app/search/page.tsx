import { Suspense } from "react"
import { SearchResults } from "@/components/transport/search-results"

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  )
}

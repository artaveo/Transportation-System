import { AlertTriangle } from "lucide-react"

/**
 * Visual flag for any figure, address, or claim that has not yet been
 * confirmed by the client. Used instead of inventing a number — per the
 * project's no-fabrication rule, unresolved facts must stay visibly marked
 * until replaced with the real value.
 */
export function PlaceholderBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-destructive/50 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
      <AlertTriangle className="size-3" />
      {label}
    </span>
  )
}

/**
 * A full-width banner variant for sections with multiple unconfirmed
 * figures (e.g. the routes & prices table, homepage trust stats).
 */
export function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-3 text-xs leading-relaxed text-destructive">
      {children}
    </p>
  )
}

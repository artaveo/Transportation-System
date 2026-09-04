/**
 * Shared responsive photo primitive (Phase 4.6 — master prompt section 8.2).
 *
 * Renders a <picture> that serves a different image file per device tier
 * instead of relying on CSS object-fit alone to crop one oversized/undersized
 * file for every screen. Same visual family across tiers, different crop.
 *
 * Breakpoint cascade (matches the project's Tailwind scale in globals.css):
 *   >= 1600px (3xl, wide/ultra-wide monitor) -> `wide`
 *   >= 1024px (lg, tablet-landscape/small-laptop and up) -> `desktop`
 *   >=  768px (md, tablet-portrait)                     -> `tablet`
 *   <   768px (phones)                                   -> `mobile` (or `desktop` as fallback)
 *
 * Designed to degrade gracefully: a section that only has one image so far
 * (nothing shot for other tiers yet) just passes `desktop` and gets a plain
 * <img>, identical to today's behavior — no broken sources, nothing to
 * update later beyond adding the missing tier props once those crops exist.
 * This is the one shared pattern meant for every image on the site, not a
 * one-off for hero/fleet/about.
 */
export interface ResponsivePhotoProps {
  /** Accessible alt text. Use "" for purely decorative/background photos. */
  alt: string
  className?: string
  /** Required — also used as the ultimate fallback source. */
  desktop: string
  /** Optional — phones, roughly < 768px. Falls back to `desktop` if omitted. */
  mobile?: string
  /** Optional — tablet portrait, roughly 768–1023px. */
  tablet?: string
  /** Optional — wide/ultra-wide monitors, roughly >= 1600px. */
  wide?: string
  "aria-hidden"?: boolean | "true" | "false"
}

export function ResponsivePhoto({
  alt,
  className,
  desktop,
  mobile,
  tablet,
  wide,
  ...rest
}: ResponsivePhotoProps) {
  return (
    <picture>
      {wide && <source media="(min-width: 1600px)" srcSet={wide} />}
      <source media="(min-width: 1024px)" srcSet={desktop} />
      {tablet && <source media="(min-width: 768px)" srcSet={tablet} />}
      <img src={mobile ?? desktop} alt={alt} className={className} {...rest} />
    </picture>
  )
}

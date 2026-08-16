import type { SVGProps } from "react";

/**
 * Clavis brand mark — a simplified starburst (16 tapered rays around a hub).
 * Far fewer, bolder rays than the original so it stays crisp at small sizes.
 * Uses `currentColor` for the fill so callers control color via text color
 * (e.g. `text-[#FF3D00]`). Sized via `className` (defaults to w-4 h-4).
 */

// Build the ray path once at module load (viewBox 48×48, center 24,24).
const CENTER = 24;
const RAY_COUNT = 16;
const OUTER = 23; // long ray tip
const OUTER_SHORT = 15; // short ray tip (alternating)
const BASE = 2.4; // half-width of each ray at the hub
const HUB = 2.6; // filled center circle radius

function buildRays(): string {
  const rays: string[] = [];
  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2 - Math.PI / 2;
    const tip = i % 2 === 0 ? OUTER : OUTER_SHORT;
    // Perpendicular offset for the ray base (two shoulders at the hub).
    const px = Math.cos(angle + Math.PI / 2) * BASE;
    const py = Math.sin(angle + Math.PI / 2) * BASE;
    const tx = CENTER + Math.cos(angle) * tip;
    const ty = CENTER + Math.sin(angle) * tip;
    const b1x = CENTER + px;
    const b1y = CENTER + py;
    const b2x = CENTER - px;
    const b2y = CENTER - py;
    rays.push(
      `M${b1x.toFixed(2)} ${b1y.toFixed(2)} L${tx.toFixed(2)} ${ty.toFixed(2)} L${b2x.toFixed(2)} ${b2y.toFixed(2)} Z`
    );
  }
  return rays.join(" ");
}

const RAYS_PATH = buildRays();

export function ClavisLogo({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d={RAYS_PATH} fill="currentColor" />
      <circle cx={CENTER} cy={CENTER} r={HUB} fill="currentColor" />
    </svg>
  );
}

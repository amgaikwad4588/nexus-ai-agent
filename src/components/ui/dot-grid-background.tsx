"use client";

import DotGrid from "@/components/ui/dot-grid";

export function DotGridBackground() {
  return (
    <div className="fixed inset-0 -z-0 pointer-events-none">
      <DotGrid
        dotSize={3}
        gap={25}
        baseColor="#1e1e3f"
        activeColor="#818cf8"
        proximity={100}
        shockRadius={130}
        shockStrength={10}
        resistance={600}
        returnDuration={1.2}
      />
    </div>
  );
}

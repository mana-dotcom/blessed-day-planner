import type { Plant } from "@/lib/garden-game";

const LEAF = "#4ade80";
const STEM = "#16a34a";
const SEED = "#7c4a2d";

type Px = [number, number, string];

// 16x16 pixel sprites; stage 0 seed → 4 ready to harvest.
function pixels(plant: Plant, stage: number): Px[] {
  const c = plant.color;
  if (stage === 0) return [[6, 14, SEED], [9, 14, SEED], [7, 15, SEED]];
  const stem = (top: number): Px[] => Array.from({ length: 15 - top }, (_, i) => [7, top + i, STEM] as Px);
  if (stage === 1) return [...stem(12), [6, 12, LEAF], [8, 11, LEAF], [5, 11, LEAF]];
  if (stage === 2) return [...stem(9), [6, 12, LEAF], [5, 11, LEAF], [8, 10, LEAF], [9, 9, LEAF], [6, 9, LEAF]];

  if (plant.kind === "veg") {
    const leaves: Px[] = [[6, 10, LEAF], [7, 9, LEAF], [8, 10, LEAF], [5, 9, LEAF], [9, 9, LEAF], [7, 11, STEM], [7, 12, STEM]];
    if (stage === 3) return [...leaves, [7, 13, c], [7, 14, c]];
    return [...leaves, [6, 8, LEAF], [8, 8, LEAF], [6, 13, c], [7, 13, c], [8, 13, c], [5, 14, c], [6, 14, c], [7, 14, c], [8, 14, c], [9, 14, c], [6, 15, c], [7, 15, c], [8, 15, c]];
  }
  if (plant.kind === "fruit") {
    const bush: Px[] = [];
    for (let x = 4; x <= 10; x++) for (let y = 8; y <= 13; y++) if (Math.abs(x - 7) + Math.abs(y - 10.5) < 5) bush.push([x, y, (x + y) % 3 ? LEAF : STEM]);
    const fruits: Px[] = stage === 4 ? [[5, 10, c], [8, 9, c], [9, 12, c], [6, 12, c], [7, 11, c]] : [[6, 10, "#fef9c3"], [8, 12, "#fef9c3"]];
    return [...bush, ...stem(13), ...fruits];
  }
  // flower
  if (stage === 3) return [...stem(6), [6, 11, LEAF], [5, 10, LEAF], [8, 9, LEAF], [9, 8, LEAF], [7, 5, c], [6, 5, LEAF], [8, 5, LEAF], [7, 4, c]];
  const center = plant.id === "marguerite" || plant.id === "tournesol" ? "#a16207" : "#fde047";
  return [...stem(6), [6, 11, LEAF], [5, 10, LEAF], [8, 9, LEAF], [9, 8, LEAF],
    [7, 1, c], [6, 2, c], [7, 2, c], [8, 2, c], [5, 3, c], [6, 3, c], [8, 3, c], [9, 3, c], [7, 3, center],
    [6, 4, c], [7, 4, c], [8, 4, c], [7, 5, c]];
}

export function PlantSprite({ plant, stage, className = "h-12 w-12" }: { plant: Plant; stage: number; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
      {pixels(plant, stage).map(([x, y, fill], i) => <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />)}
    </svg>
  );
}

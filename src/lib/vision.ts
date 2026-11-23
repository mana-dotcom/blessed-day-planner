import { createPersisted, uid } from "@/lib/persisted";

export const FRAMES = ["blush", "berry", "cream", "rose", "lilac"] as const;
export type StampFrame = (typeof FRAMES)[number];
export type VisionItem = { id: string; src: string; caption: string; frame: StampFrame; tilt: number };
export type VisionBoard = { title: string; tagline: string; items: VisionItem[] };

const KEY = "blessings-vision-v1";

const initial = (): VisionBoard => ({ title: "2027", tagline: "Mon année bénie", items: [] });

const vision = createPersisted<VisionBoard>(KEY, initial, (p) => ({
  ...initial(),
  ...p,
  items: (p.items ?? []).filter((x) => x && typeof x.src === "string").map((x) => ({
    ...x, caption: x.caption ?? "", frame: FRAMES.includes(x.frame) ? x.frame : "blush", tilt: Number(x.tilt) || 0,
  })),
}));

export const useVision = vision.use;
export const updateVision = vision.update;

const randomTilt = () => Math.round((Math.random() * 6 - 3) * 10) / 10;

export const newVisionItem = (src: string, index: number): VisionItem => ({
  id: uid(), src, caption: "", frame: FRAMES[index % FRAMES.length] ?? "blush", tilt: randomTilt(),
});

// Downscale uploads so many images fit in localStorage (~5 MB).
export async function compressImage(file: File, max = 640, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

import { extractPalettes, type ImagePalettes } from "@/lib/image-palette";

// The image a palette was made from, ready for the editor.
export type SourceImage = {
  // A resized copy, the one kept with the draft and later uploaded.
  blob: Blob;
  // Object URL of `blob` for <img>; revoke it with releaseSourceImage.
  url: string;
  palettes: ImagePalettes;
};

// Big enough to look sharp on the palette page, small enough to store.
const MAX_STORED_SIDE = 1600;
// Extraction looks at about 10,000 pixels, plenty for a handful of colors.
const MAX_SAMPLED_SIDE = 100;

export class UnreadableImageError extends Error {}

function fitWithin(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decode(file: Blob) {
  try {
    return await createImageBitmap(file);
  } catch {
    // Formats the browser can't decode, like HEIC outside Safari.
    throw new UnreadableImageError();
  }
}

function draw(bitmap: ImageBitmap, maxSide: number) {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) throw new UnreadableImageError();

  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);

  return { canvas, context };
}

function encode(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, 0.85),
  );
}

// WebP keeps transparency, which logos need. Browsers that can't encode it
// (older Safari) hand back a PNG instead, which keeps it too.
async function resize(bitmap: ImageBitmap) {
  const { canvas } = draw(bitmap, MAX_STORED_SIDE);
  const blob = (await encode(canvas, "image/webp")) ?? (await encode(canvas, "image/png"));

  if (!blob) throw new UnreadableImageError();

  return blob;
}

// Reads a stored copy, so a restored draft gets the exact same palettes.
export async function loadSourceImage(blob: Blob): Promise<SourceImage> {
  const bitmap = await decode(blob);

  try {
    const { canvas, context } = draw(bitmap, MAX_SAMPLED_SIDE);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const palettes = extractPalettes(data);

    if (!palettes) throw new UnreadableImageError();

    return { blob, url: URL.createObjectURL(blob), palettes };
  } finally {
    bitmap.close();
  }
}

// From a file the user picked, dropped or pasted.
export async function createSourceImage(file: Blob) {
  const bitmap = await decode(file);
  let blob: Blob;

  try {
    blob = await resize(bitmap);
  } finally {
    bitmap.close();
  }

  return loadSourceImage(blob);
}

export function releaseSourceImage(image: SourceImage | null) {
  if (image) URL.revokeObjectURL(image.url);
}

/**
 * Client-side image compression utility.
 * Compresses images before upload to reduce storage and bandwidth.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "image/jpeg" | "image/webp";
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  outputFormat: "image/jpeg",
};

/**
 * Compress an image file on the client side.
 * Returns a compressed File object ready for upload.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for small files (< 200KB) or already-optimized formats
  if (file.size < 200 * 1024) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > opts.maxWidth!) {
        height = (height * opts.maxWidth!) / width;
        width = opts.maxWidth!;
      }
      if (height > opts.maxHeight!) {
        width = (width * opts.maxHeight!) / height;
        height = opts.maxHeight!;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: opts.outputFormat }));
          } else {
            resolve(file);
          }
        },
        opts.outputFormat,
        opts.quality,
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a responsive image URL with Supabase image transformation.
 * If the URL is a Supabase storage URL, append transformation params.
 */
export function getOptimizedImageUrl(
  url: string,
  width: number,
  height?: number,
): string {
  if (!url) return url;

  // Supabase Storage URLs support image transformation
  // Example: https://xxx.supabase.co/storage/v1/object/public/bucket/file.jpg?width=400&height=300
  if (url.includes("supabase.co/storage")) {
    const separator = url.includes("?") ? "&" : "?";
    const params = new URLSearchParams();
    params.set("width", String(width));
    if (height) params.set("height", String(height));
    params.set("resize", "cover");
    params.set("quality", "80");
    return `${url}${separator}${params.toString()}`;
  }

  return url;
}

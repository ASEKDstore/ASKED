// Utility functions for product images

/**
 * Get the main image from product images array (image with minimum sort value)
 */
export function getMainImage(images: Array<{ url: string; sort?: number }> | undefined): string | null {
  if (!images || images.length === 0) {
    return null;
  }

  // Sort by sort value (ascending), then take first
  const sorted = [...images].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return sorted[0]?.url ?? null;
}

/**
 * Normalize image URL: replace http:// with https:// for common domains
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  // List of domains that support HTTPS
  const httpsDomains = [
    'i.imgur.com',
    'imgur.com',
    'images.unsplash.com',
    'unsplash.com',
    'cdn.example.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    's3.amazonaws.com',
    'cloudinary.com',
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Check if domain supports HTTPS
    const supportsHttps = httpsDomains.some((domain) => hostname.includes(domain));

    if (urlObj.protocol === 'http:' && supportsHttps) {
      urlObj.protocol = 'https:';
      return urlObj.toString();
    }

    return url;
  } catch {
    // If URL parsing fails, return as is
    return url;
  }
}

/**
 * Get normalized main image URL
 */
export function getMainImageUrl(images: Array<{ url: string; sort?: number }> | undefined): string | null {
  const mainImage = getMainImage(images);
  return normalizeImageUrl(mainImage);
}








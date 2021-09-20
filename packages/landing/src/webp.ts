const WebpImage = `data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=`;

// Source https://stackoverflow.com/questions/5573096/detecting-webp-support
function isCanvasWebpSupported(): boolean {
  const elem = document.createElement('canvas');

  if (!!(elem.getContext && elem.getContext('2d'))) {
    // was able or not to get WebP representation
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // very old browser like IE 8, canvas not supported
  return false;
}

/**
 * Is this runtime able to support webp
 */
function isWebpImageSupported(): Promise<boolean> {
  // Some browsers (firefox) support rendering webp but not creating with canvas
  const img = new Image();
  const promise = new Promise<boolean>((resolve) => {
    img.onload = (): void => resolve(true);
    img.onerror = (): void => resolve(false);
  });
  img.src = WebpImage;
  return promise;
}

/** Is WebP able to be rendered in this environment */
export function isWebpSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    if (isCanvasWebpSupported()) return resolve(true);
    isWebpImageSupported().then(resolve);
  });
}

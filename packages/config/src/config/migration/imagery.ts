import { ConfigImagery, ConfigImageryAll } from '../imagery.js';

export function migrateConfigImagery(img: ConfigImageryAll): ConfigImagery {
  // Already latest version
  if (img.v === 2) return img;

  return {
    ...img,
    v: 2,
    title: img.title ?? img.name,
    bands: (img.bands ?? []).map((m) => {
      return { type: m };
    }),
  };
}

export interface Experiment { id: string; name: string; variants: Variant[]; trafficPercentage: number; startDate: Date; endDate?: Date; }
export interface Variant { id: string; name: string; weight: number; config: Record<string, unknown>; }
export function assignVariant(experiment: Experiment, userId: string): Variant {
  const hash = ((userId + experiment.id).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0));
  const bucket = Math.abs(hash) % 100;
  let cumulative = 0;
  for (const variant of experiment.variants) { cumulative += variant.weight; if (bucket < cumulative) return variant; }
  return experiment.variants[experiment.variants.length - 1];
}

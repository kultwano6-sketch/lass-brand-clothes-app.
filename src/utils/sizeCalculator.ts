export type FitSilhouette = 'fitted' | 'relaxed' | 'oversized';

export interface SizeCalculationInput {
  heightCm: number;
  weightKg: number;
  fitPreference: FitSilhouette;
}

export interface SizeRecommendationResult {
  recommendedSize: 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  alternativeSize?: 'S' | 'M' | 'L' | 'XL' | '2XL';
  confidenceScore: number; // e.g. 96 (%)
  chestWidthCm: number;
  totalLengthCm: number;
  silhouetteNote: string;
  fabricDrapeAdvice: string;
}

export const SIZE_STORAGE_KEY = 'lass_saved_size_preference_v1';

export function calculateStreetwearSize({
  heightCm,
  weightKg,
  fitPreference,
}: SizeCalculationInput): SizeRecommendationResult {
  // Approximate standard chest circumference based on height and weight
  // Using standard anthropometric volumetric approximation calibrated for South African builds
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const estimatedChestCm = Math.round(weightKg * 1.08 + (heightCm - 160) * 0.25 + (bmi > 25 ? (bmi - 25) * 1.5 : 0));

  let baseSize: 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' = 'L';

  if (estimatedChestCm < 98 || weightKg < 62) {
    baseSize = 'S';
  } else if (estimatedChestCm < 105 || weightKg < 74) {
    baseSize = 'M';
  } else if (estimatedChestCm < 112 || weightKg < 87) {
    baseSize = 'L';
  } else if (estimatedChestCm < 120 || weightKg < 102) {
    baseSize = 'XL';
  } else if (estimatedChestCm < 128 || weightKg < 118) {
    baseSize = '2XL';
  } else {
    baseSize = '3XL';
  }

  // Adjust for silhouette preference
  const sizeOrder: ('S' | 'M' | 'L' | 'XL' | '2XL' | '3XL')[] = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  let finalIndex = sizeOrder.indexOf(baseSize);

  if (fitPreference === 'fitted') {
    if (finalIndex > 0 && weightKg % 10 < 4) {
      finalIndex = Math.max(0, finalIndex - 1);
    }
  } else if (fitPreference === 'oversized') {
    finalIndex = Math.min(sizeOrder.length - 1, finalIndex + 1);
  }

  const recommendedSize = sizeOrder[finalIndex];

  // Garment specifications per size
  const specs: Record<string, { chest: number; length: number }> = {
    S: { chest: 98, length: 70 },
    M: { chest: 104, length: 72 },
    L: { chest: 110, length: 74 },
    XL: { chest: 116, length: 76 },
    '2XL': { chest: 122, length: 78 },
    '3XL': { chest: 130, length: 80 },
  };

  const garmentSpec = specs[recommendedSize] || specs['L'];

  // Confidence calculation
  const confidenceScore = Math.min(99, Math.max(88, 97 - Math.abs(22 - bmi) * 0.8));

  // Silhouette-specific description
  let silhouetteNote = 'Balanced streetwear drape with clean shoulder lines and chest breathing room.';
  if (fitPreference === 'fitted') {
    silhouetteNote = 'Clean tailored street cut; sits closer across shoulders with minimal loose drape.';
  } else if (fitPreference === 'oversized') {
    silhouetteNote = 'Signature 90s dropped shoulders with roomy boxy chest drape that hangs straight.';
  }

  const fabricDrapeAdvice =
    'LASS 200gsm heavyweight combed cotton is pre-shrunk. It maintains its structural silhouette without clinging.';

  const alternativeSize =
    fitPreference === 'fitted'
      ? sizeOrder[Math.min(sizeOrder.length - 1, finalIndex + 1)] as any
      : sizeOrder[Math.max(0, finalIndex - 1)] as any;

  return {
    recommendedSize,
    alternativeSize,
    confidenceScore: Math.round(confidenceScore),
    chestWidthCm: garmentSpec.chest,
    totalLengthCm: garmentSpec.length,
    silhouetteNote,
    fabricDrapeAdvice,
  };
}

export function getSavedSizePreference(): string | null {
  try {
    return localStorage.getItem(SIZE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSizePreference(size: string): void {
  try {
    localStorage.setItem(SIZE_STORAGE_KEY, size);
  } catch {}
}

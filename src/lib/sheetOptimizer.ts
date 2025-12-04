// Core 2D Bin Packing Algorithm with Guillotine Heuristic
// Phase 1: Foundation

export interface Part {
  id: string;
  width: number;
  height: number;
  quantity: number;
  material?: string;
  edging?: string;
  edgingMaterial?: string;
  rotated?: boolean;
  grainDirection?: 0 | 90 | 'any'; // Grain constraint: 0 (horizontal), 90 (vertical), or 'any'
}

export interface PlacedPart extends Part {
  x: number;
  y: number;
  sheetIndex: number;
}

export interface CutSequence {
  step: number;
  type: 'horizontal' | 'vertical';
  position: number;
  description: string;
}

export interface Sheet {
  width: number;
  height: number;
  type: SheetType;
  parts: PlacedPart[];
  wastePercentage: number;
  usedArea: number;
  cutSequence?: CutSequence[];
  costs?: {
    materialCost: number;
    cuttingCost: number;
    edgingCost: number;
    totalCost: number;
  };
}

export type SheetType = 'melamine' | 'masonite' | 'quartz';

export const SHEET_SIZES: Record<SheetType, { width: number; height: number }> = {
  melamine: { width: 2750, height: 1830 },
  masonite: { width: 2440, height: 1220 },
  quartz: { width: 3200, height: 1820 },
};

export interface OptimizationConfig {
  sheetType: SheetType;
  kerf: number; // Cut width in mm
  allowRotation?: boolean;
  edgingMargin?: number; // Extra margin for edging (mm)
  minLeftoverSize?: number; // Minimum usable leftover size (mm)
  mode?: 'fast' | 'balanced' | 'precision'; // Optimization mode
  costs?: {
    materialCostPerSheet: number; // Cost per sheet
    cutCostPerMeter: number; // Cost per meter of cutting
    edgingCostPerMeter: number; // Cost per meter of edging
  };
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

class GuillotinePacker {
  private freeRects: Rectangle[] = [];
  private usedRects: PlacedPart[] = [];
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;

  constructor(width: number, height: number, kerf: number) {
    this.sheetWidth = width;
    this.sheetHeight = height;
    this.kerf = kerf;
    this.freeRects = [{ x: 0, y: 0, width, height }];
  }

  canFit(part: Part, allowRotation: boolean = false): boolean {
    const adjustedWidth = part.width + this.kerf;
    const adjustedHeight = part.height + this.kerf;

    for (const rect of this.freeRects) {
      if (rect.width >= adjustedWidth && rect.height >= adjustedHeight) {
        return true;
      }
      if (allowRotation && this.canRotate(part) && rect.width >= adjustedHeight && rect.height >= adjustedWidth) {
        return true;
      }
    }
    return false;
  }

  private canRotate(part: Part): boolean {
    if (!part.grainDirection || part.grainDirection === 'any') {
      return true;
    }
    return false;
  }

  insert(part: Part, sheetIndex: number, allowRotation: boolean = false): PlacedPart | null {
    const adjustedWidth = part.width + this.kerf;
    const adjustedHeight = part.height + this.kerf;

    // Try multiple fit heuristics and pick best
    let bestRect: Rectangle | null = null;
    let bestScore = Infinity;
    let rotated = false;

    const canRotatePart = allowRotation && this.canRotate(part);

    for (const rect of this.freeRects) {
      // Try normal orientation - use Best Short Side Fit (minimizes leftover on shortest side)
      if (rect.width >= adjustedWidth && rect.height >= adjustedHeight) {
        const leftoverH = rect.width - adjustedWidth;
        const leftoverV = rect.height - adjustedHeight;
        const score = Math.min(leftoverH, leftoverV); // Best Short Side Fit
        if (score < bestScore) {
          bestScore = score;
          bestRect = rect;
          rotated = false;
        }
      }

      // Try rotated orientation
      if (canRotatePart && rect.width >= adjustedHeight && rect.height >= adjustedWidth) {
        const leftoverH = rect.width - adjustedHeight;
        const leftoverV = rect.height - adjustedWidth;
        const score = Math.min(leftoverH, leftoverV);
        if (score < bestScore) {
          bestScore = score;
          bestRect = rect;
          rotated = true;
        }
      }
    }

    if (!bestRect) return null;

    const placedPart: PlacedPart = {
      ...part,
      x: bestRect.x,
      y: bestRect.y,
      sheetIndex,
      rotated,
      width: rotated ? part.height : part.width,
      height: rotated ? part.width : part.height,
    };

    this.usedRects.push(placedPart);
    this.splitFreeRect(bestRect, placedPart);

    return placedPart;
  }

  private splitFreeRect(freeRect: Rectangle, usedRect: PlacedPart): void {
    const index = this.freeRects.indexOf(freeRect);
    if (index > -1) {
      this.freeRects.splice(index, 1);
    }

    const usedWidth = usedRect.width + this.kerf;
    const usedHeight = usedRect.height + this.kerf;

    // Calculate remaining space
    const remainingRight = freeRect.width - usedWidth;
    const remainingBottom = freeRect.height - usedHeight;

    // Use Shorter Leftover Axis Split - split along the axis with less remaining space
    // This tends to produce more usable rectangles
    if (remainingRight <= remainingBottom) {
      // Split horizontally first (shorter leftover on right)
      if (remainingRight > 0) {
        this.freeRects.push({
          x: freeRect.x + usedWidth,
          y: freeRect.y,
          width: remainingRight,
          height: freeRect.height, // Full height
        });
      }
      if (remainingBottom > 0) {
        this.freeRects.push({
          x: freeRect.x,
          y: freeRect.y + usedHeight,
          width: usedWidth, // Only up to used width
          height: remainingBottom,
        });
      }
    } else {
      // Split vertically first (shorter leftover on bottom)
      if (remainingBottom > 0) {
        this.freeRects.push({
          x: freeRect.x,
          y: freeRect.y + usedHeight,
          width: freeRect.width, // Full width
          height: remainingBottom,
        });
      }
      if (remainingRight > 0) {
        this.freeRects.push({
          x: freeRect.x + usedWidth,
          y: freeRect.y,
          width: remainingRight,
          height: usedHeight, // Only up to used height
        });
      }
    }

    this.mergeFreeRects();
  }

  private mergeFreeRects(): void {
    // Lower minimum size to 20mm to capture more usable space
    const minSize = 20;
    this.freeRects = this.freeRects.filter(
      rect => rect.width >= minSize && rect.height >= minSize
    );

    // Sort by area descending for better merge opportunities
    this.freeRects.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // Multiple merge passes for better results
    for (let pass = 0; pass < 3; pass++) {
      let merged = false;
      for (let i = 0; i < this.freeRects.length; i++) {
        for (let j = i + 1; j < this.freeRects.length; j++) {
          const rect1 = this.freeRects[i];
          const rect2 = this.freeRects[j];

          // Merge horizontally
          if (rect1.y === rect2.y && rect1.height === rect2.height) {
            if (rect1.x + rect1.width === rect2.x) {
              rect1.width += rect2.width;
              this.freeRects.splice(j, 1);
              merged = true;
              j--;
              continue;
            }
            if (rect2.x + rect2.width === rect1.x) {
              rect1.x = rect2.x;
              rect1.width += rect2.width;
              this.freeRects.splice(j, 1);
              merged = true;
              j--;
              continue;
            }
          }

          // Merge vertically
          if (rect1.x === rect2.x && rect1.width === rect2.width) {
            if (rect1.y + rect1.height === rect2.y) {
              rect1.height += rect2.height;
              this.freeRects.splice(j, 1);
              merged = true;
              j--;
              continue;
            }
            if (rect2.y + rect2.height === rect1.y) {
              rect1.y = rect2.y;
              rect1.height += rect2.height;
              this.freeRects.splice(j, 1);
              merged = true;
              j--;
              continue;
            }
          }
        }
      }
      if (!merged) break;
    }
  }

  getUsedRects(): PlacedPart[] {
    return this.usedRects;
  }

  getUsedArea(): number {
    return this.usedRects.reduce(
      (sum, part) => sum + part.width * part.height,
      0
    );
  }
}

// Try multiple sorting strategies and return the best result
function tryOptimization(
  expandedParts: Part[],
  sheetSize: { width: number; height: number },
  config: OptimizationConfig,
  startingSheetIndex: number
): { sheets: Sheet[]; totalWaste: number } {
  const sheets: Sheet[] = [];
  const packers: GuillotinePacker[] = [];
  
  // Use first-fit decreasing - try to fit in existing sheets first
  for (const part of expandedParts) {
    let placed = false;
    
    // Try to fit in existing sheets first (maximize utilization)
    for (let i = 0; i < packers.length; i++) {
      if (packers[i].canFit(part, config.allowRotation !== false)) {
        const result = packers[i].insert(part, startingSheetIndex + i, config.allowRotation !== false);
        if (result) {
          placed = true;
          break;
        }
      }
    }
    
    // If couldn't fit in existing sheets, create new one
    if (!placed) {
      const newPacker = new GuillotinePacker(sheetSize.width, sheetSize.height, config.kerf);
      const result = newPacker.insert(part, startingSheetIndex + packers.length, config.allowRotation !== false);
      if (result) {
        packers.push(newPacker);
      } else {
        console.warn(`Could not place part ${part.id} - dimensions may exceed sheet size`);
      }
    }
  }
  
  // Convert packers to sheets
  let totalWaste = 0;
  const totalArea = sheetSize.width * sheetSize.height;
  
  for (const packer of packers) {
    const usedArea = packer.getUsedArea();
    const wastePercentage = ((totalArea - usedArea) / totalArea) * 100;
    totalWaste += wastePercentage;
    const placedParts = packer.getUsedRects();
    const cutSequence = generateCutSequence(placedParts, sheetSize.width, sheetSize.height);

    let costs;
    if (config.costs) {
      const totalCutLength = calculateTotalCutLength(cutSequence);
      const totalEdgingLength = calculateTotalEdgingLength(placedParts);
      
      costs = {
        materialCost: config.costs.materialCostPerSheet,
        cuttingCost: (totalCutLength / 1000) * config.costs.cutCostPerMeter,
        edgingCost: (totalEdgingLength / 1000) * config.costs.edgingCostPerMeter,
        totalCost: 0,
      };
      costs.totalCost = costs.materialCost + costs.cuttingCost + costs.edgingCost;
    }

    sheets.push({
      width: sheetSize.width,
      height: sheetSize.height,
      type: config.sheetType,
      parts: placedParts,
      wastePercentage,
      usedArea,
      cutSequence,
      costs,
    });
  }
  
  return { sheets, totalWaste };
}

export function optimizeSheetLayout(
  parts: Part[],
  config: OptimizationConfig
): Sheet[] {
  const allSheets: Sheet[] = [];
  const sheetSize = SHEET_SIZES[config.sheetType];
  
  // Apply edging margin to parts if specified
  const adjustedParts = config.edgingMargin 
    ? parts.map(part => ({
        ...part,
        width: part.width + (config.edgingMargin || 0),
        height: part.height + (config.edgingMargin || 0),
      }))
    : parts;

  // Group parts by material - each material gets its own sheets
  const partsByMaterial: Record<string, Part[]> = {};
  adjustedParts.forEach(part => {
    const material = part.material || 'Unknown';
    if (!partsByMaterial[material]) {
      partsByMaterial[material] = [];
    }
    partsByMaterial[material].push(part);
  });

  // Process each material group separately
  Object.entries(partsByMaterial).forEach(([material, materialParts]) => {
    // Expand parts by quantity for this material
    const expandedParts: Part[] = [];
    materialParts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        expandedParts.push({ ...part, quantity: 1, id: `${part.id}-${i}` });
      }
    });

    // Try multiple sorting strategies and pick the best one
    const sortingStrategies = [
      // Strategy 1: Area descending (largest first)
      [...expandedParts].sort((a, b) => (b.width * b.height) - (a.width * a.height)),
      // Strategy 2: Longest dimension first
      [...expandedParts].sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height)),
      // Strategy 3: Perimeter descending
      [...expandedParts].sort((a, b) => (b.width + b.height) - (a.width + a.height)),
      // Strategy 4: Width descending
      [...expandedParts].sort((a, b) => b.width - a.width),
      // Strategy 5: Height descending
      [...expandedParts].sort((a, b) => b.height - a.height),
      // Strategy 6: Area then perimeter (precision)
      [...expandedParts].sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        if (areaA !== areaB) return areaB - areaA;
        return (b.width + b.height) - (a.width + a.height);
      }),
    ];

    let bestResult: { sheets: Sheet[]; totalWaste: number } | null = null;
    
    for (const sortedParts of sortingStrategies) {
      const result = tryOptimization(sortedParts, sheetSize, config, allSheets.length);
      
      // Pick result with fewer sheets, or if same sheets, less total waste
      if (!bestResult || 
          result.sheets.length < bestResult.sheets.length ||
          (result.sheets.length === bestResult.sheets.length && result.totalWaste < bestResult.totalWaste)) {
        bestResult = result;
      }
    }

    if (bestResult) {
      allSheets.push(...bestResult.sheets);
    }
  });

  return allSheets;
}

function generateCutSequence(parts: PlacedPart[], sheetWidth: number, sheetHeight: number): CutSequence[] {
  const sequence: CutSequence[] = [];
  let step = 1;

  // Sort parts by position for logical cutting order
  const sortedParts = [...parts].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // Generate guillotine-style cuts
  const uniqueYPositions = [...new Set(sortedParts.map(p => p.y))].sort((a, b) => a - b);
  
  uniqueYPositions.forEach((yPos, idx) => {
    if (yPos > 0) {
      sequence.push({
        step: step++,
        type: 'horizontal',
        position: yPos,
        description: `Horizontal cut at ${yPos}mm from bottom`,
      });
    }
    
    // Find parts at this Y position and add vertical cuts
    const partsAtY = sortedParts.filter(p => p.y === yPos).sort((a, b) => a.x - b.x);
    partsAtY.forEach((part, partIdx) => {
      if (part.x > 0 && partIdx === 0) {
        sequence.push({
          step: step++,
          type: 'vertical',
          position: part.x,
          description: `Vertical cut at ${part.x}mm from left`,
        });
      }
      if (partIdx < partsAtY.length - 1) {
        const nextX = part.x + part.width;
        sequence.push({
          step: step++,
          type: 'vertical',
          position: nextX,
          description: `Vertical cut at ${nextX}mm from left`,
        });
      }
    });
  });

  return sequence;
}

function calculateTotalCutLength(cutSequence?: CutSequence[]): number {
  if (!cutSequence) return 0;
  // Approximate cut length based on cut sequence
  return cutSequence.reduce((total, cut) => total + cut.position, 0);
}

function calculateTotalEdgingLength(parts: PlacedPart[]): number {
  return parts.reduce((total, part) => {
    if (!part.edging || part.edging === 'None') return total;
    
    const edgingType = part.edging.toUpperCase();
    let length = 0;
    
    // Parse edging types: 1L, 2L, 1S, 2S, AR (All Round), combinations
    if (edgingType.includes('AR') || edgingType.includes('ALL')) {
      // All edges
      length = 2 * (part.width + part.height);
    } else {
      // Count long edges (width)
      const longMatch = edgingType.match(/(\d+)\s*L/);
      if (longMatch) {
        length += parseInt(longMatch[1]) * part.width;
      }
      
      // Count short edges (height)
      const shortMatch = edgingType.match(/(\d+)\s*S/);
      if (shortMatch) {
        length += parseInt(shortMatch[1]) * part.height;
      }
    }
    
    return total + length;
  }, 0);
}

export function calculateTotalStats(sheets: Sheet[]) {
  const totalSheets = sheets.length;
  const totalArea = sheets.reduce((sum, sheet) => sum + sheet.width * sheet.height, 0);
  const totalUsedArea = sheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);
  const totalWaste = totalArea - totalUsedArea;
  const averageWastePercentage = totalSheets > 0 
    ? sheets.reduce((sum, sheet) => sum + sheet.wastePercentage, 0) / totalSheets 
    : 0;
  const totalCost = sheets.reduce((sum, sheet) => sum + (sheet.costs?.totalCost || 0), 0);

  return {
    totalSheets,
    totalArea,
    totalUsedArea,
    totalWaste,
    averageWastePercentage,
    totalCost: totalCost > 0 ? totalCost : undefined,
  };
}

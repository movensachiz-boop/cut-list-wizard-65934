// MaxCut-style 2D Bin Packing Algorithm with Guillotine Heuristic
// Implements Best Short Side Fit (BSSF), Best Long Side Fit (BLSF), Best Area Fit (BAF)

export interface Part {
  id: string;
  width: number;
  height: number;
  quantity: number;
  material?: string;
  edging?: string;
  edgingMaterial?: string;
  rotated?: boolean;
  grainDirection?: 0 | 90 | 'any';
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

export type SheetType = 'melamine' | 'masonite' | 'quartz' | 'custom';

export const SHEET_SIZES: Record<SheetType, { width: number; height: number }> = {
  melamine: { width: 2750, height: 1830 },
  masonite: { width: 2440, height: 1220 },
  quartz: { width: 3200, height: 1820 },
  custom: { width: 2440, height: 1220 },
};

// MaxCut-style sub-sheet sizes for automatic selection
export const SHEET_SUB_SIZES = [
  { width: 2750, height: 1830, name: 'Full Sheet' },
  { width: 2440, height: 1220, name: 'Standard' },
  { width: 1830, height: 1220, name: 'Half Sheet' },
  { width: 1220, height: 915, name: 'Quarter Sheet' },
];

export type FitHeuristic = 'BSSF' | 'BLSF' | 'BAF';
export type SplitRule = 'ShorterLeftover' | 'LongerLeftover' | 'MinArea' | 'MaxArea';

export interface OptimizationConfig {
  sheetType: SheetType;
  kerf: number;
  allowRotation?: boolean;
  edgingMargin?: number;
  minLeftoverSize?: number;
  mode?: 'fast' | 'balanced' | 'precision';
  seed?: number; // MaxCut-style optimization seed for different variations
  trimAllowance?: number; // Allowance for rough sheet edges
  fitHeuristic?: FitHeuristic;
  splitRule?: SplitRule;
  customSheetSize?: { width: number; height: number };
  costs?: {
    materialCostPerSheet: number;
    cutCostPerMeter: number;
    edgingCostPerMeter: number;
  };
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Seeded random number generator for reproducible results (MaxCut-style)
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

class GuillotinePacker {
  private freeRects: Rectangle[] = [];
  private usedRects: PlacedPart[] = [];
  private sheetWidth: number;
  private sheetHeight: number;
  private kerf: number;
  private fitHeuristic: FitHeuristic;
  private splitRule: SplitRule;

  constructor(
    width: number, 
    height: number, 
    kerf: number,
    trimAllowance: number = 0,
    fitHeuristic: FitHeuristic = 'BSSF',
    splitRule: SplitRule = 'ShorterLeftover'
  ) {
    // Apply trim allowance (MaxCut feature - account for rough edges)
    this.sheetWidth = width - (trimAllowance * 2);
    this.sheetHeight = height - (trimAllowance * 2);
    this.kerf = kerf;
    this.fitHeuristic = fitHeuristic;
    this.splitRule = splitRule;
    this.freeRects = [{ 
      x: trimAllowance, 
      y: trimAllowance, 
      width: this.sheetWidth, 
      height: this.sheetHeight 
    }];
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

  // Calculate score based on selected heuristic (MaxCut-style)
  private calculateScore(rect: Rectangle, partWidth: number, partHeight: number): number {
    const leftoverH = rect.width - partWidth;
    const leftoverV = rect.height - partHeight;

    switch (this.fitHeuristic) {
      case 'BSSF': // Best Short Side Fit - minimizes leftover on shortest side
        return Math.min(leftoverH, leftoverV);
      case 'BLSF': // Best Long Side Fit - minimizes leftover on longest side
        return Math.max(leftoverH, leftoverV);
      case 'BAF': // Best Area Fit - minimizes total leftover area
        return leftoverH * leftoverV;
      default:
        return Math.min(leftoverH, leftoverV);
    }
  }

  insert(part: Part, sheetIndex: number, allowRotation: boolean = false): PlacedPart | null {
    const adjustedWidth = part.width + this.kerf;
    const adjustedHeight = part.height + this.kerf;

    let bestRect: Rectangle | null = null;
    let bestScore = Infinity;
    let rotated = false;

    const canRotatePart = allowRotation && this.canRotate(part);

    for (const rect of this.freeRects) {
      // Try normal orientation
      if (rect.width >= adjustedWidth && rect.height >= adjustedHeight) {
        const score = this.calculateScore(rect, adjustedWidth, adjustedHeight);
        if (score < bestScore) {
          bestScore = score;
          bestRect = rect;
          rotated = false;
        }
      }

      // Try rotated orientation
      if (canRotatePart && rect.width >= adjustedHeight && rect.height >= adjustedWidth) {
        const score = this.calculateScore(rect, adjustedHeight, adjustedWidth);
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

    const remainingRight = freeRect.width - usedWidth;
    const remainingBottom = freeRect.height - usedHeight;

    // MaxCut-style split rules
    let splitHorizontally: boolean;
    switch (this.splitRule) {
      case 'ShorterLeftover':
        splitHorizontally = remainingRight <= remainingBottom;
        break;
      case 'LongerLeftover':
        splitHorizontally = remainingRight > remainingBottom;
        break;
      case 'MinArea':
        splitHorizontally = (remainingRight * freeRect.height) <= (remainingBottom * freeRect.width);
        break;
      case 'MaxArea':
        splitHorizontally = (remainingRight * freeRect.height) > (remainingBottom * freeRect.width);
        break;
      default:
        splitHorizontally = remainingRight <= remainingBottom;
    }

    if (splitHorizontally) {
      // Split horizontally first
      if (remainingRight > 0) {
        this.freeRects.push({
          x: freeRect.x + usedWidth,
          y: freeRect.y,
          width: remainingRight,
          height: freeRect.height,
        });
      }
      if (remainingBottom > 0) {
        this.freeRects.push({
          x: freeRect.x,
          y: freeRect.y + usedHeight,
          width: usedWidth,
          height: remainingBottom,
        });
      }
    } else {
      // Split vertically first
      if (remainingBottom > 0) {
        this.freeRects.push({
          x: freeRect.x,
          y: freeRect.y + usedHeight,
          width: freeRect.width,
          height: remainingBottom,
        });
      }
      if (remainingRight > 0) {
        this.freeRects.push({
          x: freeRect.x + usedWidth,
          y: freeRect.y,
          width: remainingRight,
          height: usedHeight,
        });
      }
    }

    this.mergeFreeRects();
  }

  private mergeFreeRects(): void {
    const minSize = 20;
    this.freeRects = this.freeRects.filter(
      rect => rect.width >= minSize && rect.height >= minSize
    );

    // Sort by area descending
    this.freeRects.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // Multiple merge passes
    for (let pass = 0; pass < 5; pass++) {
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

  getFreeRects(): Rectangle[] {
    return this.freeRects;
  }
}

// MaxCut-style sorting strategies with seed-based variations
function getSortingStrategies(parts: Part[], seed: number): Part[][] {
  const random = seededRandom(seed);
  
  const strategies: Part[][] = [
    // Strategy 1: Area descending (largest first) - MaxCut default
    [...parts].sort((a, b) => (b.width * b.height) - (a.width * a.height)),
    
    // Strategy 2: Longest dimension first
    [...parts].sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height)),
    
    // Strategy 3: Perimeter descending
    [...parts].sort((a, b) => (b.width + b.height) - (a.width + a.height)),
    
    // Strategy 4: Width descending
    [...parts].sort((a, b) => b.width - a.width),
    
    // Strategy 5: Height descending
    [...parts].sort((a, b) => b.height - a.height),
    
    // Strategy 6: Area then longest side (MaxCut precision)
    [...parts].sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      if (areaA !== areaB) return areaB - areaA;
      return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    }),
    
    // Strategy 7: Shortest side descending (for strip packing)
    [...parts].sort((a, b) => Math.min(b.width, b.height) - Math.min(a.width, a.height)),
    
    // Strategy 8: Difference between sides (squareness)
    [...parts].sort((a, b) => {
      const diffA = Math.abs(a.width - a.height);
      const diffB = Math.abs(b.width - b.height);
      return diffA - diffB; // More square parts first
    }),
  ];

  // Add seed-based shuffled variations (MaxCut optimization seed feature)
  if (seed > 0) {
    for (let i = 0; i < 4; i++) {
      const shuffled = [...parts];
      // Fisher-Yates shuffle with seed
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
      // Then sort by area but with slight randomization
      shuffled.sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        if (Math.abs(areaA - areaB) < 1000) {
          return random() > 0.5 ? 1 : -1;
        }
        return areaB - areaA;
      });
      strategies.push(shuffled);
    }
  }

  return strategies;
}

// Try optimization with specific configuration
function tryOptimization(
  expandedParts: Part[],
  sheetSize: { width: number; height: number },
  config: OptimizationConfig,
  startingSheetIndex: number
): { sheets: Sheet[]; totalWaste: number; totalCuts: number } {
  const sheets: Sheet[] = [];
  const packers: GuillotinePacker[] = [];
  
  for (const part of expandedParts) {
    let placed = false;
    
    // Try to fit in existing sheets first (First Fit Decreasing)
    for (let i = 0; i < packers.length; i++) {
      if (packers[i].canFit(part, config.allowRotation !== false)) {
        const result = packers[i].insert(part, startingSheetIndex + i, config.allowRotation !== false);
        if (result) {
          placed = true;
          break;
        }
      }
    }
    
    // Create new sheet if needed
    if (!placed) {
      const newPacker = new GuillotinePacker(
        sheetSize.width, 
        sheetSize.height, 
        config.kerf,
        config.trimAllowance || 0,
        config.fitHeuristic || 'BSSF',
        config.splitRule || 'ShorterLeftover'
      );
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
  let totalCuts = 0;
  const totalArea = sheetSize.width * sheetSize.height;
  
  for (const packer of packers) {
    const usedArea = packer.getUsedArea();
    const wastePercentage = ((totalArea - usedArea) / totalArea) * 100;
    totalWaste += wastePercentage;
    const placedParts = packer.getUsedRects();
    const cutSequence = generateCutSequence(placedParts, sheetSize.width, sheetSize.height);
    totalCuts += cutSequence.length;

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
  
  return { sheets, totalWaste, totalCuts };
}

export function optimizeSheetLayout(
  parts: Part[],
  config: OptimizationConfig
): Sheet[] {
  const allSheets: Sheet[] = [];
  const sheetSize = config.customSheetSize || SHEET_SIZES[config.sheetType];
  
  // Apply edging margin to parts
  const adjustedParts = config.edgingMargin 
    ? parts.map(part => ({
        ...part,
        width: part.width + (config.edgingMargin || 0),
        height: part.height + (config.edgingMargin || 0),
      }))
    : parts;

  // Group parts by material
  const partsByMaterial: Record<string, Part[]> = {};
  adjustedParts.forEach(part => {
    const material = part.material || 'Unknown';
    if (!partsByMaterial[material]) {
      partsByMaterial[material] = [];
    }
    partsByMaterial[material].push(part);
  });

  // Determine number of optimization passes based on mode (MaxCut-style)
  const passes = config.mode === 'fast' ? 4 : config.mode === 'precision' ? 16 : 8;
  const heuristics: FitHeuristic[] = config.mode === 'precision' 
    ? ['BSSF', 'BLSF', 'BAF'] 
    : ['BSSF'];
  const splitRules: SplitRule[] = config.mode === 'precision'
    ? ['ShorterLeftover', 'LongerLeftover']
    : ['ShorterLeftover'];

  // Process each material group
  Object.entries(partsByMaterial).forEach(([material, materialParts]) => {
    // Expand parts by quantity
    const expandedParts: Part[] = [];
    materialParts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        expandedParts.push({ ...part, quantity: 1, id: `${part.id}-${i}` });
      }
    });

    const seed = config.seed || 1;
    const sortingStrategies = getSortingStrategies(expandedParts, seed);
    
    let bestResult: { sheets: Sheet[]; totalWaste: number; totalCuts: number } | null = null;

    // Try all combinations (MaxCut-style exhaustive search)
    for (const sortedParts of sortingStrategies.slice(0, passes)) {
      for (const heuristic of heuristics) {
        for (const splitRule of splitRules) {
          const testConfig = { ...config, fitHeuristic: heuristic, splitRule };
          const result = tryOptimization(sortedParts, sheetSize, testConfig, allSheets.length);
          
          // MaxCut-style scoring: prioritize fewer sheets, then less waste, then fewer cuts
          if (!bestResult || 
              result.sheets.length < bestResult.sheets.length ||
              (result.sheets.length === bestResult.sheets.length && result.totalWaste < bestResult.totalWaste) ||
              (result.sheets.length === bestResult.sheets.length && 
               Math.abs(result.totalWaste - bestResult.totalWaste) < 0.1 && 
               result.totalCuts < bestResult.totalCuts)) {
            bestResult = result;
          }
        }
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

  // Generate guillotine-style cuts (MaxCut compatible)
  const horizontalCuts = new Set<number>();
  const verticalCutsByRow = new Map<number, Set<number>>();

  // Collect all horizontal cut positions
  sortedParts.forEach(part => {
    if (part.y > 0) horizontalCuts.add(part.y);
    const bottomEdge = part.y + part.height;
    if (bottomEdge < sheetHeight) horizontalCuts.add(bottomEdge);
  });

  // Sort horizontal cuts
  const sortedHorizontalCuts = Array.from(horizontalCuts).sort((a, b) => a - b);

  // Generate horizontal cuts first (MaxCut order)
  sortedHorizontalCuts.forEach(yPos => {
    sequence.push({
      step: step++,
      type: 'horizontal',
      position: yPos,
      description: `Horizontal cut at ${yPos}mm`,
    });
  });

  // Collect vertical cuts for each row
  sortedParts.forEach(part => {
    const rowKey = part.y;
    if (!verticalCutsByRow.has(rowKey)) {
      verticalCutsByRow.set(rowKey, new Set());
    }
    const cuts = verticalCutsByRow.get(rowKey)!;
    if (part.x > 0) cuts.add(part.x);
    const rightEdge = part.x + part.width;
    if (rightEdge < sheetWidth) cuts.add(rightEdge);
  });

  // Generate vertical cuts by row
  verticalCutsByRow.forEach((cuts, rowY) => {
    const sortedCuts = Array.from(cuts).sort((a, b) => a - b);
    sortedCuts.forEach(xPos => {
      sequence.push({
        step: step++,
        type: 'vertical',
        position: xPos,
        description: `Vertical cut at ${xPos}mm (row at ${rowY}mm)`,
      });
    });
  });

  return sequence;
}

function calculateTotalCutLength(cutSequence?: CutSequence[]): number {
  if (!cutSequence) return 0;
  return cutSequence.length * 1000; // Approximate
}

function calculateTotalEdgingLength(parts: PlacedPart[]): number {
  return parts.reduce((total, part) => {
    if (part.edging && part.edging !== 'None') {
      const perimeter = 2 * (part.width + part.height);
      return total + perimeter;
    }
    return total;
  }, 0);
}

export function calculateTotalStats(sheets: Sheet[]): {
  totalSheets: number;
  totalArea: number;
  totalUsedArea: number;
  totalWaste: number;
  averageWastePercentage: number;
  totalCost?: number;
} {
  const totalSheets = sheets.length;
  const totalArea = sheets.reduce((sum, s) => sum + s.width * s.height, 0);
  const totalUsedArea = sheets.reduce((sum, s) => sum + s.usedArea, 0);
  const totalWaste = totalArea - totalUsedArea;
  const averageWastePercentage = sheets.length > 0
    ? sheets.reduce((sum, s) => sum + s.wastePercentage, 0) / sheets.length
    : 0;
  const totalCost = sheets.some(s => s.costs)
    ? sheets.reduce((sum, s) => sum + (s.costs?.totalCost || 0), 0)
    : undefined;

  return {
    totalSheets,
    totalArea,
    totalUsedArea,
    totalWaste,
    averageWastePercentage,
    totalCost,
  };
}

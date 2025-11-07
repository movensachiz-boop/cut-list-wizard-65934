import { Sheet, OptimizationConfig } from './sheetOptimizer';

export interface OptimizationRun {
  id: string;
  timestamp: Date;
  config: OptimizationConfig;
  sheets: Sheet[];
  stats: {
    totalSheets: number;
    totalArea: number;
    totalUsedArea: number;
    totalWaste: number;
    averageWastePercentage: number;
    totalCost?: number;
  };
  name?: string;
}

const STORAGE_KEY = 'fast_cut_optimization_history';
const MAX_HISTORY_SIZE = 10;

export function saveOptimizationRun(
  sheets: Sheet[],
  config: OptimizationConfig,
  stats: any,
  name?: string
): OptimizationRun {
  const run: OptimizationRun = {
    id: `run_${Date.now()}`,
    timestamp: new Date(),
    config,
    sheets,
    stats,
    name: name || `Run ${new Date().toLocaleString()}`,
  };

  const history = getOptimizationHistory();
  history.unshift(run);

  // Keep only the last MAX_HISTORY_SIZE runs
  if (history.length > MAX_HISTORY_SIZE) {
    history.splice(MAX_HISTORY_SIZE);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return run;
}

export function getOptimizationHistory(): OptimizationRun[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return history.map((run: any) => ({
      ...run,
      timestamp: new Date(run.timestamp),
    }));
  } catch (error) {
    console.error('Error loading optimization history:', error);
    return [];
  }
}

export function deleteOptimizationRun(runId: string): void {
  const history = getOptimizationHistory();
  const filtered = history.filter(run => run.id !== runId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearOptimizationHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function compareRuns(run1: OptimizationRun, run2: OptimizationRun) {
  return {
    sheetsDifference: run1.stats.totalSheets - run2.stats.totalSheets,
    wasteDifference: run1.stats.averageWastePercentage - run2.stats.averageWastePercentage,
    costDifference: (run1.stats.totalCost || 0) - (run2.stats.totalCost || 0),
    timeDifference: run1.timestamp.getTime() - run2.timestamp.getTime(),
  };
}

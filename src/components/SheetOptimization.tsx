import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetType, optimizeSheetLayout, calculateTotalStats, Part, SHEET_SIZES, FitHeuristic, SplitRule } from "@/lib/sheetOptimizer";
import { SheetLayoutViewer } from "./SheetLayoutViewer";
import { exportCuttingListToCSV, exportToExcel, exportSheetLayoutToPDF } from "@/lib/exportUtils";
import { exportToCNC, exportToDXF } from "@/lib/cncExport";
import { saveOptimizationRun } from "@/lib/optimizationHistory";
import { OptimizationHistory } from "./OptimizationHistory";
import { QuoteGenerator } from "./QuoteGenerator";
import { Loader2, Maximize2, Package, FileText, FileSpreadsheet, Printer, Cog, DollarSign, Zap, Scale, Target, Shuffle, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SheetOptimizationProps {
  cuttingItems: Array<{
    id: string;
    length: number;
    width: number;
    quantity: number;
    material: string;
    edging: string;
    edgingMaterial: string;
    notes?: string;
  }>;
}

export const SheetOptimization = ({ cuttingItems }: SheetOptimizationProps) => {
  const [sheetType, setSheetType] = useState<SheetType>('melamine');
  const [kerf, setKerf] = useState(3);
  const [allowRotation, setAllowRotation] = useState(true);
  const [edgingMargin, setEdgingMargin] = useState(2);
  const [minLeftoverSize, setMinLeftoverSize] = useState(100);
  const [optimizationMode, setOptimizationMode] = useState<'fast' | 'balanced' | 'precision'>('balanced');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedSheets, setOptimizedSheets] = useState<Sheet[]>([]);
  
  // MaxCut-style features
  const [optimizationSeed, setOptimizationSeed] = useState(1);
  const [trimAllowance, setTrimAllowance] = useState(0);
  const [fitHeuristic, setFitHeuristic] = useState<FitHeuristic>('BSSF');
  const [splitRule, setSplitRule] = useState<SplitRule>('ShorterLeftover');
  
  // Cost estimation
  const [enableCostEstimation, setEnableCostEstimation] = useState(false);
  const [materialCostPerSheet, setMaterialCostPerSheet] = useState(50);
  const [cutCostPerMeter, setCutCostPerMeter] = useState(0.5);
  const [edgingCostPerMeter, setEdgingCostPerMeter] = useState(1.0);
  
  const { toast } = useToast();

  const handleOptimize = () => {
    if (cuttingItems.length === 0) {
      toast({
        title: "No items to optimize",
        description: "Please add cutting items before optimizing.",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);

    // Convert cutting items to parts format
    const parts: Part[] = cuttingItems.map(item => ({
      id: item.id,
      width: item.length,
      height: item.width,
      quantity: item.quantity,
      material: item.material,
      edging: item.edging,
    }));

    // Run optimization in a setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const sheets = optimizeSheetLayout(parts, {
          sheetType,
          kerf,
          allowRotation,
          edgingMargin,
          minLeftoverSize,
          mode: optimizationMode,
          seed: optimizationSeed,
          trimAllowance,
          fitHeuristic,
          splitRule,
          costs: enableCostEstimation ? {
            materialCostPerSheet,
            cutCostPerMeter,
            edgingCostPerMeter,
          } : undefined,
        });

        setOptimizedSheets(sheets);
        
        const stats = calculateTotalStats(sheets);
        
        // Save to history
        saveOptimizationRun(
          sheets,
          {
            sheetType,
            kerf,
            allowRotation,
            edgingMargin,
            minLeftoverSize,
            mode: optimizationMode,
            seed: optimizationSeed,
            trimAllowance,
            fitHeuristic,
            splitRule,
            costs: enableCostEstimation ? {
              materialCostPerSheet,
              cutCostPerMeter,
              edgingCostPerMeter,
            } : undefined,
          },
          stats
        );
        
        toast({
          title: "Optimization Complete",
          description: `Used ${stats.totalSheets} sheet(s) with ${stats.averageWastePercentage.toFixed(1)}% average waste${
            stats.totalCost ? ` • Total cost: $${stats.totalCost.toFixed(2)}` : ''
          }`,
        });
      } catch (error) {
        console.error("Optimization error:", error);
        toast({
          title: "Optimization Failed",
          description: "An error occurred during optimization. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsOptimizing(false);
      }
    }, 100);
  };

  const stats = optimizedSheets.length > 0 ? calculateTotalStats(optimizedSheets) : null;
  const selectedSheetSize = SHEET_SIZES[sheetType];

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card className="p-6 border-2 border-primary/20">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Maximize2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Sheet Optimization</h2>
              <p className="text-sm text-muted-foreground">
                Phase 2: Enhanced edge visualization & balanced optimization
              </p>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sheet Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="sheet-type">Sheet Type</Label>
              <Select value={sheetType} onValueChange={(value) => setSheetType(value as SheetType)}>
                <SelectTrigger id="sheet-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="melamine">
                    Melamine (2750×1830mm)
                  </SelectItem>
                  <SelectItem value="masonite">
                    Masonite (2440×1220mm)
                  </SelectItem>
                  <SelectItem value="quartz">
                    Quartz (3200×1820mm)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedSheetSize.width} × {selectedSheetSize.height} mm
              </p>
            </div>

            {/* Optimization Mode */}
            <div className="space-y-2">
              <Label htmlFor="opt-mode">Optimization Mode</Label>
              <Select value={optimizationMode} onValueChange={(value) => setOptimizationMode(value as 'fast' | 'balanced' | 'precision')}>
                <SelectTrigger id="opt-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Fast
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Balanced
                    </div>
                  </SelectItem>
                  <SelectItem value="precision">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Precision
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {optimizationMode === 'fast' ? 'Quick results (~5s)' : 
                 optimizationMode === 'balanced' ? 'Good efficiency (~10s)' : 
                 'Maximum efficiency (~20s)'}
              </p>
            </div>

            {/* Kerf Configuration */}
            <div className="space-y-2">
              <Label htmlFor="kerf">Kerf (Cut Width)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="kerf"
                  type="number"
                  value={kerf}
                  onChange={(e) => setKerf(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Blade thickness (typically 3mm)
              </p>
            </div>

            {/* Edging Margin */}
            <div className="space-y-2">
              <Label htmlFor="edging-margin">Edging Margin</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edging-margin"
                  type="number"
                  value={edgingMargin}
                  onChange={(e) => setEdgingMargin(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Extra margin for edge banding
              </p>
            </div>

            {/* Minimum Leftover Size */}
            <div className="space-y-2">
              <Label htmlFor="min-leftover">Min Leftover Size</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="min-leftover"
                  type="number"
                  value={minLeftoverSize}
                  onChange={(e) => setMinLeftoverSize(Number(e.target.value))}
                  min={50}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum usable leftover piece
              </p>
            </div>

            {/* Rotation Option */}
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2 h-10">
                <Checkbox
                  id="rotation"
                  checked={allowRotation}
                  onCheckedChange={(checked) => setAllowRotation(checked as boolean)}
                />
                <label
                  htmlFor="rotation"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Allow 90° rotation
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Parts can rotate (unless grain restricted)
              </p>
            </div>
          </div>

          {/* MaxCut-Style Advanced Settings */}
          <Collapsible className="space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  <span>MaxCut Advanced Settings</span>
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                {/* Optimization Seed */}
                <div className="space-y-2">
                  <Label htmlFor="opt-seed">Optimization Seed</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="opt-seed"
                      type="number"
                      value={optimizationSeed}
                      onChange={(e) => setOptimizationSeed(Number(e.target.value))}
                      min={1}
                      max={999}
                      className="w-full"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setOptimizationSeed(Math.floor(Math.random() * 999) + 1)}
                      title="Random seed"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Different seeds = different layouts
                  </p>
                </div>

                {/* Trim Allowance */}
                <div className="space-y-2">
                  <Label htmlFor="trim-allowance">Trim Allowance</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="trim-allowance"
                      type="number"
                      value={trimAllowance}
                      onChange={(e) => setTrimAllowance(Number(e.target.value))}
                      min={0}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For rough sheet edges
                  </p>
                </div>

                {/* Fit Heuristic */}
                <div className="space-y-2">
                  <Label htmlFor="fit-heuristic">Fit Heuristic</Label>
                  <Select value={fitHeuristic} onValueChange={(value) => setFitHeuristic(value as FitHeuristic)}>
                    <SelectTrigger id="fit-heuristic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BSSF">Best Short Side Fit</SelectItem>
                      <SelectItem value="BLSF">Best Long Side Fit</SelectItem>
                      <SelectItem value="BAF">Best Area Fit</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Part placement strategy
                  </p>
                </div>

                {/* Split Rule */}
                <div className="space-y-2">
                  <Label htmlFor="split-rule">Split Rule</Label>
                  <Select value={splitRule} onValueChange={(value) => setSplitRule(value as SplitRule)}>
                    <SelectTrigger id="split-rule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ShorterLeftover">Shorter Leftover</SelectItem>
                      <SelectItem value="LongerLeftover">Longer Leftover</SelectItem>
                      <SelectItem value="MinArea">Min Area Split</SelectItem>
                      <SelectItem value="MaxArea">Max Area Split</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How to split free space
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Cost Estimation (Collapsible) */}
          <Collapsible className="space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Cost Estimation (Optional)</span>
                </div>
                <Checkbox
                  checked={enableCostEstimation}
                  onCheckedChange={(checked) => setEnableCostEstimation(checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                />
              </Button>
            </CollapsibleTrigger>
            
            {enableCostEstimation && (
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="material-cost">Material Cost per Sheet ($)</Label>
                    <Input
                      id="material-cost"
                      type="number"
                      value={materialCostPerSheet}
                      onChange={(e) => setMaterialCostPerSheet(Number(e.target.value))}
                      min={0}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cut-cost">Cutting Cost per Meter ($)</Label>
                    <Input
                      id="cut-cost"
                      type="number"
                      value={cutCostPerMeter}
                      onChange={(e) => setCutCostPerMeter(Number(e.target.value))}
                      min={0}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edging-cost">Edging Cost per Meter ($)</Label>
                    <Input
                      id="edging-cost"
                      type="number"
                      value={edgingCostPerMeter}
                      onChange={(e) => setEdgingCostPerMeter(Number(e.target.value))}
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>

          {/* Optimize Button */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing || cuttingItems.length === 0}
              size="lg"
              className="gap-2"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  Optimize Layout
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {cuttingItems.length} item(s) ready to optimize
            </div>

            <OptimizationHistory />
          </div>
        </div>
      </Card>

      {/* Summary Statistics */}
      {stats && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Optimization Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Sheets</div>
                <div className="text-2xl font-bold text-primary">{stats.totalSheets}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Area</div>
                <div className="text-2xl font-bold">{(stats.totalArea / 1000000).toFixed(2)} m²</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Used Area</div>
                <div className="text-2xl font-bold text-green-600">
                  {(stats.totalUsedArea / 1000000).toFixed(2)} m²
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Waste Area</div>
                <div className="text-2xl font-bold text-orange-600">
                  {(stats.totalWaste / 1000000).toFixed(2)} m²
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Avg. Waste %</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageWastePercentage.toFixed(1)}%
                </div>
              </div>
              {stats.totalCost && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${stats.totalCost.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sheet Layouts */}
      {optimizedSheets.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xl font-semibold">Optimized Layouts</h3>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportCuttingListToCSV(cuttingItems, 'fast_cut_cutlist')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                CSV (Cutlist)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToExcel(optimizedSheets, 'fast_cut_layout')}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportSheetLayoutToPDF(optimizedSheets, 'fast_cut_optimization')}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                PDF (Optimization)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCNC(optimizedSheets, 'fast_cut_layout')}
                className="gap-2"
              >
                <Cog className="h-4 w-4" />
                CNC Program
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToDXF(optimizedSheets, 'fast_cut_layout')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                DXF
              </Button>
              <QuoteGenerator 
                cuttingItems={cuttingItems}
                optimizedSheets={optimizedSheets}
              />
            </div>
          </div>
          
          <div className="grid gap-6">
            {optimizedSheets.map((sheet, index) => (
              <SheetLayoutViewer
                key={`sheet-${index}`}
                sheet={sheet}
                sheetIndex={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {optimizedSheets.length === 0 && !isOptimizing && (
        <Card className="p-12 text-center border-dashed">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No Optimization Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add cutting items and click "Optimize Layout" to see the results
          </p>
        </Card>
      )}
    </div>
  );
};

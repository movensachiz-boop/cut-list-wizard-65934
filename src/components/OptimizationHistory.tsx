import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getOptimizationHistory, 
  deleteOptimizationRun, 
  OptimizationRun 
} from "@/lib/optimizationHistory";
import { History, Trash2, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const OptimizationHistory = () => {
  const [history, setHistory] = useState<OptimizationRun[]>([]);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(getOptimizationHistory());
  };

  const handleDelete = (runId: string) => {
    deleteOptimizationRun(runId);
    loadHistory();
    setSelectedRuns(prev => prev.filter(id => id !== runId));
  };

  const handleCompare = () => {
    if (selectedRuns.length !== 2) return null;
    
    const run1 = history.find(r => r.id === selectedRuns[0]);
    const run2 = history.find(r => r.id === selectedRuns[1]);
    
    if (!run1 || !run2) return null;

    return {
      sheetsDiff: run1.stats.totalSheets - run2.stats.totalSheets,
      wasteDiff: run1.stats.averageWastePercentage - run2.stats.averageWastePercentage,
      costDiff: (run1.stats.totalCost || 0) - (run2.stats.totalCost || 0),
    };
  };

  const comparison = selectedRuns.length === 2 ? handleCompare() : null;

  if (history.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          View History ({history.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Optimization History</DialogTitle>
          <DialogDescription>
            Compare previous optimization runs. Select 2 runs to compare.
          </DialogDescription>
        </DialogHeader>

        {comparison && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h4 className="font-semibold mb-3">Comparison Results</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {comparison.sheetsDiff === 0 ? (
                  <Badge variant="secondary">Same sheets</Badge>
                ) : comparison.sheetsDiff < 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {Math.abs(comparison.sheetsDiff)} fewer sheet(s)
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {comparison.sheetsDiff} more sheet(s)
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {comparison.wasteDiff < 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {Math.abs(comparison.wasteDiff).toFixed(1)}% less waste
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {comparison.wasteDiff.toFixed(1)}% more waste
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {comparison.costDiff !== 0 && (
                  comparison.costDiff < 0 ? (
                    <>
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        ${Math.abs(comparison.costDiff).toFixed(2)} cheaper
                      </span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">
                        ${comparison.costDiff.toFixed(2)} more expensive
                      </span>
                    </>
                  )
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {history.map((run) => (
            <Card
              key={run.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedRuns.includes(run.id) ? 'bg-primary/10 border-primary' : ''
              }`}
              onClick={() => {
                if (selectedRuns.includes(run.id)) {
                  setSelectedRuns(prev => prev.filter(id => id !== run.id));
                } else if (selectedRuns.length < 2) {
                  setSelectedRuns(prev => [...prev, run.id]);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{run.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {run.config.mode || 'fast'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {run.config.sheetType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {run.timestamp.toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sheets:</span>{' '}
                      <span className="font-medium">{run.stats.totalSheets}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Waste:</span>{' '}
                      <span className="font-medium">
                        {run.stats.averageWastePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kerf:</span>{' '}
                      <span className="font-medium">{run.config.kerf}mm</span>
                    </div>
                    {run.stats.totalCost && (
                      <div>
                        <span className="text-muted-foreground">Cost:</span>{' '}
                        <span className="font-medium">${run.stats.totalCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(run.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

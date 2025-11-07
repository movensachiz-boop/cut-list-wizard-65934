import { Card } from "@/components/ui/card";
import { Sheet, PlacedPart } from "@/lib/sheetOptimizer";
import { Badge } from "@/components/ui/badge";
import { detectEdgesNeedingBanding, getEdgingDescription } from "@/lib/edgingDetector";

interface SheetLayoutViewerProps {
  sheet: Sheet;
  sheetIndex: number;
}

export const SheetLayoutViewer = ({ sheet, sheetIndex }: SheetLayoutViewerProps) => {
  // Calculate scale to fit sheet in viewport
  const viewportWidth = 600;
  const viewportHeight = 800;
  const scaleX = viewportWidth / sheet.width;
  const scaleY = viewportHeight / sheet.height;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

  const scaledWidth = sheet.width * scale;
  const scaledHeight = sheet.height * scale;

  // Color palette for parts
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#06b6d4', '#6366f1', '#f97316'
  ];

  const getPartColor = (part: PlacedPart, index: number) => {
    return colors[index % colors.length];
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold">
            Sheet {sheetIndex + 1} - {sheet.type.toUpperCase()}
          </h3>
          <div className="flex gap-2">
            <Badge variant="secondary">{sheet.parts.length} parts</Badge>
            <Badge variant="outline">{sheet.wastePercentage.toFixed(1)}% waste</Badge>
            {sheet.cutSequence && (
              <Badge variant="outline">{sheet.cutSequence.length} cuts</Badge>
            )}
          </div>
        </div>

        <div className="flex justify-center bg-muted/20 rounded-lg p-4">
          <svg
            width={scaledWidth}
            height={scaledHeight}
            className="border-2 border-border bg-background"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Sheet background */}
            <rect
              x={0}
              y={0}
              width={scaledWidth}
              height={scaledHeight}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="2"
            />

            {/* Grid lines for reference */}
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={`grid-${i}`}>
                <line
                  x1={(i + 1) * (scaledWidth / 10)}
                  y1={0}
                  x2={(i + 1) * (scaledWidth / 10)}
                  y2={scaledHeight}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <line
                  x1={0}
                  y1={(i + 1) * (scaledHeight / 10)}
                  x2={scaledWidth}
                  y2={(i + 1) * (scaledHeight / 10)}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              </g>
            ))}

            {/* Placed parts */}
            {sheet.parts.map((part, index) => {
              const x = part.x * scale;
              const y = part.y * scale;
              const width = part.width * scale;
              const height = part.height * scale;
              const color = getPartColor(part, index);
              
              // Detect which edges need banding
              const edges = detectEdgesNeedingBanding(part.edging, part.rotated);
              const edgingColor = "#059669";
              const edgingWidth = 4;

              return (
                <g key={`${part.id}-${index}`}>
                  {/* Part rectangle */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={color}
                    fillOpacity="0.3"
                    stroke={color}
                    strokeWidth="2"
                  />
                  
                  {/* Edge banding visualization - thicker colored lines on edges that need edging */}
                  {edges.top && (
                    <line
                      x1={x}
                      y1={y}
                      x2={x + width}
                      y2={y}
                      stroke={edgingColor}
                      strokeWidth={edgingWidth}
                      strokeLinecap="round"
                    />
                  )}
                  {edges.bottom && (
                    <line
                      x1={x}
                      y1={y + height}
                      x2={x + width}
                      y2={y + height}
                      stroke={edgingColor}
                      strokeWidth={edgingWidth}
                      strokeLinecap="round"
                    />
                  )}
                  {edges.left && (
                    <line
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={y + height}
                      stroke={edgingColor}
                      strokeWidth={edgingWidth}
                      strokeLinecap="round"
                    />
                  )}
                  {edges.right && (
                    <line
                      x1={x + width}
                      y1={y}
                      x2={x + width}
                      y2={y + height}
                      stroke={edgingColor}
                      strokeWidth={edgingWidth}
                      strokeLinecap="round"
                    />
                  )}
                  
                  {/* Part label with dimensions */}
                  {width > 40 && height > 30 && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 - 25}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      {part.width}×{part.height}
                      {part.rotated && ' ↻'}
                    </text>
                  )}
                  
                  {/* Material label */}
                  {part.material && width > 40 && height > 50 && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 - 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fontWeight="500"
                      fill="#6b7280"
                    >
                      {part.material}
                    </text>
                  )}
                  
                  {/* Edging type label */}
                  {part.edging && part.edging !== 'None' && width > 40 && height > 65 && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 3}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#059669"
                    >
                      {part.edging}
                    </text>
                  )}
                  
                  {/* Edging material label */}
                  {part.edgingMaterial && width > 40 && height > 80 && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 16}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fontWeight="500"
                      fill="#047857"
                    >
                      {part.edgingMaterial}
                    </text>
                  )}
                  
                  {/* Part ID label */}
                  {width > 40 && height > 95 && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 30}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fill="#9ca3af"
                    >
                      #{part.id.split('-')[0].slice(-4)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Dimension labels */}
            <text
              x={scaledWidth / 2}
              y={scaledHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {sheet.width} mm
            </text>
            <text
              x={-10}
              y={scaledHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              transform={`rotate(-90, -10, ${scaledHeight / 2})`}
            >
              {sheet.height} mm
            </text>
          </svg>
        </div>

        {/* Parts list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Parts on this sheet ({sheet.parts.length}):</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {sheet.parts.map((part, index) => (
              <div
                key={`${part.id}-list-${index}`}
                className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50"
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: getPartColor(part, index) }}
                />
                <span>
                  {part.width}×{part.height}
                  {part.rotated && ' ↻'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t text-sm">
          <div>
            <div className="text-muted-foreground">Used Area</div>
            <div className="font-medium text-green-600">
              {(sheet.usedArea / 1000000).toFixed(2)} m²
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Waste Area</div>
            <div className="font-medium text-orange-600">
              {((sheet.width * sheet.height - sheet.usedArea) / 1000000).toFixed(2)} m²
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Parts Count</div>
            <div className="font-medium">{sheet.parts.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Efficiency</div>
            <div className="font-medium text-blue-600">
              {(100 - sheet.wastePercentage).toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Cost Breakdown (if available) */}
        {sheet.costs && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Material</div>
              <div className="font-medium">${sheet.costs.materialCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cutting</div>
              <div className="font-medium">${sheet.costs.cuttingCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Edging</div>
              <div className="font-medium">${sheet.costs.edgingCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sheet Total</div>
              <div className="font-medium text-blue-600">${sheet.costs.totalCost.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Cut Sequence */}
        {sheet.cutSequence && sheet.cutSequence.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-semibold">Guillotine Cut Sequence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs max-h-32 overflow-y-auto">
              {sheet.cutSequence.map((cut) => (
                <div key={cut.step} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Badge variant="outline" className="shrink-0">
                    {cut.step}
                  </Badge>
                  <span className={cut.type === 'horizontal' ? 'text-blue-600' : 'text-green-600'}>
                    {cut.type === 'horizontal' ? '↔' : '↕'}
                  </span>
                  <span className="truncate">{cut.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

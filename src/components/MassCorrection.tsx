import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { SmartSelect } from "@/components/SmartSelect";

const MATERIAL_OPTIONS = [
  "White Melamine", "Azzano High Gloss", "Grain colored board", "Glass 4mm", "Storm grey matt", "Grigio Matt", "Laricina Melamine", "Storm grey gloss", "Masonite 2.3", "Masonite 2.4", "Postform", "PVC Board 2.4", "Black Board Matt", "Gloss white board", "Postform Large", "Caraz", "Luca polenta", "High Gloss melamine", "Plain Colored boards", "Iceberg white-Gloss", "Brookhill Matt", "Folkstone Grey Gloss", "Grigio", "Leatherwood", "Lucapolenta", "Lucaurban", "Masonite-Large", "PVC (2.4X1.2)", "PVC (2.75X1.83)", "High Gloss", "Superwood", "Congo Matt", "MDF Boards", "Shale Oak", "Black Matt", "Washed Shale", "Capuccino Board Matt", "Black Cherry board", "Harvard Cherry Board", "Granite", "Folkstone Grey Matt Board", "Calacatta Quartz", "Dunblane Grey Matt Board", "Color Board [TBA]", "Natural Oak Matt", "Plywood", "Camden Board Matt", "Cascade Board Matt", "Coimbra Board Matt", "Sahara Board Matt", "Quartz Star Gray", "Quartz (Star Range)", "American Walnut", "Quartz Slab", "Quartz Stone", "Royal Mahogany", "Calacatta Quartz Slab", "Calais Board", "Catalan Postform", "Dunblane gloss board", "Capuccino Gloss"
];


interface CuttingItem {
  id: string;
  length: number;
  width: number;
  quantity: number;
  material: string;
  edging: string;
  edgingMaterial: string;
  notes?: string;
}

interface MassCorrectionProps {
  items: CuttingItem[];
  onUpdateItems: (itemIds: string[], updates: Partial<CuttingItem>) => void;
}

interface GroupedItems {
  [material: string]: CuttingItem[];
}

export function MassCorrection({ items, onUpdateItems }: MassCorrectionProps) {
  const [open, setOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [edgingType, setEdgingType] = useState<string>("");
  const [edgingMaterial, setEdgingMaterial] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [replaceMaterial, setReplaceMaterial] = useState<string>("");

  const groupedItems: GroupedItems = items.reduce((acc, item) => {
    if (!acc[item.material]) {
      acc[item.material] = [];
    }
    acc[item.material].push(item);
    return acc;
  }, {} as GroupedItems);

  const materials = Object.keys(groupedItems).sort();
  const selectedGroup = selectedMaterial ? groupedItems[selectedMaterial] : [];

  const handleApplyChanges = () => {
    if (!selectedMaterial || selectedGroup.length === 0) {
      toast.error("Please select a material group");
      return;
    }

    const updates: Partial<CuttingItem> = {};
    if (edgingType) updates.edging = edgingType;
    if (edgingMaterial) updates.edgingMaterial = edgingMaterial;
    if (notes) updates.notes = notes;
    if (replaceMaterial) updates.material = replaceMaterial;

    if (Object.keys(updates).length === 0) {
      toast.error("Please specify at least one change");
      return;
    }

    const itemIds = selectedGroup.map(item => item.id);
    onUpdateItems(itemIds, updates);

    toast.success(`Updated ${itemIds.length} items in "${selectedMaterial}" group`);
    
    // Reset form
    setEdgingType("");
    setEdgingMaterial("");
    setNotes("");
    setReplaceMaterial("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Mass Correction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mass Correction & Auto Grouping</DialogTitle>
          <DialogDescription>
            Group items by material and apply changes to all similar items at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Material Selection */}
          <div className="space-y-2">
            <Label>Select Material Group</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a material..." />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material} ({groupedItems[material].length} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Selected Group */}
          {selectedGroup.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h3 className="font-semibold text-sm">Selected Group Preview:</h3>
              <div className="text-sm text-muted-foreground">
                <p>Material: <span className="font-medium text-foreground">{selectedMaterial}</span></p>
                <p>Total Items: <span className="font-medium text-foreground">{selectedGroup.length}</span></p>
                <p>Total Quantity: <span className="font-medium text-foreground">
                  {selectedGroup.reduce((sum, item) => sum + item.quantity, 0)}
                </span></p>
              </div>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {selectedGroup.map((item, idx) => (
                  <div key={item.id} className="text-xs bg-background rounded px-2 py-1">
                    #{idx + 1}: {item.length}×{item.width} mm, Qty: {item.quantity}, Edging: {item.edging}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Edit Options */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Apply Changes to All Items in Group:</h3>
            
            <div className="space-y-2">
              <Label htmlFor="replace-material">Replace Material With</Label>
              <SmartSelect
                value={replaceMaterial}
                onValueChange={setReplaceMaterial}
                placeholder="Leave unchanged..."
                options={MATERIAL_OPTIONS}
                category="material"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edging-type">Edging Type</Label>
              <Select value={edgingType} onValueChange={setEdgingType}>
                <SelectTrigger id="edging-type">
                  <SelectValue placeholder="Leave unchanged..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="1L">1 Long Side</SelectItem>
                  <SelectItem value="2L">2 Long Sides</SelectItem>
                  <SelectItem value="1W">1 Short Side</SelectItem>
                  <SelectItem value="2W">2 Short Sides</SelectItem>
                  <SelectItem value="all">All Sides</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edging-material">Edging Material</Label>
              <Select value={edgingMaterial} onValueChange={setEdgingMaterial}>
                <SelectTrigger id="edging-material">
                  <SelectValue placeholder="Leave unchanged..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="pvc">PVC</SelectItem>
                  <SelectItem value="abs">ABS</SelectItem>
                  <SelectItem value="veneer">Veneer</SelectItem>
                  <SelectItem value="melamine">Melamine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Leave empty to keep existing notes..."
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyChanges} disabled={!selectedMaterial}>
              Apply to {selectedGroup.length} Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

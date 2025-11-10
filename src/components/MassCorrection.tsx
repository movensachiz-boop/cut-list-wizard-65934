import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { SmartSelect } from "@/components/SmartSelect";
import { Checkbox } from "@/components/ui/checkbox";

const EDGING_TYPE_OPTIONS = ["None", "1 Long", "2 Long", "1 Short", "2 Short", "All Round", "1 Long 1 Short", "2 Long 1 Short", "1 Long 2 Short"];
const EDGING_MATERIAL_OPTIONS = ["White matt edging", "Colour Edging", "Storm grey matt edging", "Storm grey gloss edging", "White gloss edging", "Grigio Matt Edging", "American W Matt", "Black Gloss Edging", "Black matt edging", "Black matt 2mm", "0.4mm Lucaurban edging", "0.4mm Loose edging", "32mm Edging", "0.4mm Black matt edging", "White Edging", "Grain Colored Edging", "32mm Own Edging Charge", "Black Edging", "Gloss White Edging", "Grain colored - 32mm", "American Walnut Gloss", "Brookhill edging", "Folkstone Grey Matt Edging", "Gloss Edging", "Grigio Edging", "Leatherwood Edging", "Loose edging", "0.4 White edging", "0.4 Loose edging", "Folkstone Grey Gloss", "0.4mm color edging", "Congo 0.4 Edging", "Black Cherry Edging", "Caraz Edging", "Loose - Folkstone grey matt", "0.4 own edging", "Dunblane Grey Edging", "Natural Oak Edging", "2mm white edging", "2mm black edging", "0.4 Lucaurban edging", "American  Walnut edging", "Own Edging charge", "0.4 Lucapolenta edging", "0.4mm black edging", "Harvard cherry edging", "0.4mm s/grey edging", "African Wenge Edging", "Cappuccino edging", "Coimbra loose edging", "White Loose edging", "32mm Storm Grey Matt", "Coimbra Edging", "Folkstone gloss edging [Lawlinon]", "Camden Edging", "Cascade Edging", "Grooving per metre", "0.4mm red edging", "Iceberg gloss Edging [Promotion]", "Sahara Edging", "Royal Mahogany Edging", "Cappuccino gloss edging", "32mm White Edging", "Petrol Blue Edging", "Gloss Edging (promo)", "Dunblane grey matt edging", "Dunblane grey gloss edging", "PVC Edge"];

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
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const groupedItems: GroupedItems = items.reduce((acc, item) => {
    if (!acc[item.material]) {
      acc[item.material] = [];
    }
    acc[item.material].push(item);
    return acc;
  }, {} as GroupedItems);

  const materials = Object.keys(groupedItems).sort();
  const selectedGroup = selectedMaterial ? groupedItems[selectedMaterial] : [];

  // Auto-select all items when material changes
  useEffect(() => {
    if (selectedGroup.length > 0) {
      setSelectedItemIds(new Set(selectedGroup.map(item => item.id)));
    } else {
      setSelectedItemIds(new Set());
    }
  }, [selectedMaterial]);

  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === selectedGroup.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(selectedGroup.map(item => item.id)));
    }
  };

  const handleApplyChanges = () => {
    try {
      if (!selectedMaterial || selectedGroup.length === 0) {
        toast.error("Please select a material group");
        return;
      }

      if (selectedItemIds.size === 0) {
        toast.error("Please select at least one item to update");
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

      console.log("Applying updates:", updates, "to items:", Array.from(selectedItemIds));
      
      const itemIds = Array.from(selectedItemIds);
      onUpdateItems(itemIds, updates);

      toast.success(`Updated ${itemIds.length} items in "${selectedMaterial}" group`);
      
      // Reset form
      setEdgingType("");
      setEdgingMaterial("");
      setNotes("");
      setReplaceMaterial("");
      setSelectedItemIds(new Set());
      setOpen(false);
    } catch (error) {
      console.error("Error applying mass correction:", error);
      toast.error("Failed to apply changes. Please try again.");
    }
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Selected Group Preview:</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedItemIds.size === selectedGroup.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Material: <span className="font-medium text-foreground">{selectedMaterial}</span></p>
                <p>Total Items: <span className="font-medium text-foreground">{selectedGroup.length}</span></p>
                <p>Selected: <span className="font-medium text-foreground">{selectedItemIds.size}</span></p>
                <p>Total Quantity: <span className="font-medium text-foreground">
                  {selectedGroup.filter(item => selectedItemIds.has(item.id)).reduce((sum, item) => sum + item.quantity, 0)}
                </span></p>
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {selectedGroup.map((item, idx) => (
                  <label 
                    key={item.id} 
                    className="flex items-start gap-2 text-xs bg-background rounded px-2 py-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span className="flex-1">
                      #{idx + 1}: {item.length}×{item.width} mm, Qty: {item.quantity}, Edging: {item.edging}
                    </span>
                  </label>
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
              <SmartSelect
                value={edgingType}
                onValueChange={setEdgingType}
                placeholder="Leave unchanged..."
                options={EDGING_TYPE_OPTIONS}
                category="edging_type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edging-material">Edging Material</Label>
              <SmartSelect
                value={edgingMaterial}
                onValueChange={setEdgingMaterial}
                placeholder="Leave unchanged..."
                options={EDGING_MATERIAL_OPTIONS}
                category="edging_material"
              />
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
            <Button onClick={handleApplyChanges} disabled={!selectedMaterial || selectedItemIds.size === 0}>
              Apply to {selectedItemIds.size} Selected Item{selectedItemIds.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

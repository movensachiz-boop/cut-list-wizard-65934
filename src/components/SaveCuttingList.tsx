import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CuttingItem {
  length: number;
  width: number;
  quantity: number;
  material: string;
  edging: string;
  edgingMaterial: string;
  notes?: string;
  confidence?: "high" | "medium" | "low";
}

interface SaveCuttingListProps {
  items: CuttingItem[];
  onSaved?: (cuttingListId: string) => void;
}

export const SaveCuttingList = ({ items, onSaved }: SaveCuttingListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your cutting list",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No items",
        description: "Please add items before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to save cutting lists to the database",
          variant: "destructive",
        });
        
        // Fallback to localStorage
        const savedLists = JSON.parse(localStorage.getItem('cuttingLists') || '[]');
        const newList = {
          id: Date.now().toString(),
          name: name.trim(),
          notes: notes.trim() || null,
          total_items: items.length,
          created_at: new Date().toISOString(),
          items: items.map(item => ({
            length: item.length,
            width: item.width,
            quantity: item.quantity,
            material: item.material,
            edging: item.edging,
            edgingMaterial: item.edgingMaterial,
            notes: item.notes || null,
            confidence: item.confidence || null,
          }))
        };
        savedLists.push(newList);
        localStorage.setItem('cuttingLists', JSON.stringify(savedLists));
        
        toast({
          title: "Saved locally",
          description: `Saved "${name}" to browser storage. Sign in to use hardware features.`,
        });
        
        setIsOpen(false);
        setName("");
        setNotes("");
        setIsSaving(false);
        return;
      }

      // Create cutting list in database
      const { data: cuttingList, error: listError } = await supabase
        .from('cutting_lists')
        .insert({
          user_id: user.id,
          name: name.trim(),
          notes: notes.trim() || null,
          total_items: items.length,
        })
        .select()
        .single();

      if (listError) throw listError;

      // Insert cutting items
      const { error: itemsError } = await supabase
        .from('cutting_items')
        .insert(
          items.map(item => ({
            cutting_list_id: cuttingList.id,
            length: item.length,
            width: item.width,
            quantity: item.quantity,
            material: item.material,
            edging_type: item.edging,
            edging_material: item.edgingMaterial,
            notes: item.notes || null,
            confidence: item.confidence || null,
          }))
        );

      if (itemsError) throw itemsError;

      toast({
        title: "Success!",
        description: `Saved cutting list "${name}" with ${items.length} items to database`,
      });

      // Call the onSaved callback with the cutting list ID
      onSaved?.(cuttingList.id);

      setIsOpen(false);
      setName("");
      setNotes("");
    } catch (error: any) {
      console.error("Error saving cutting list:", error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="gap-2">
          <Save className="h-5 w-5" />
          Save List
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect">
        <DialogHeader>
          <DialogTitle>Save Cutting List</DialogTitle>
          <DialogDescription>
            Save your cutting list to the database to enable hardware selection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              List Name *
            </label>
            <Input
              placeholder="e.g., Kitchen Cabinet - Project A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Add any notes about this cutting list..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""} will be saved
            </p>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderOpen, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CuttingItem {
  id: string;
  length: number;
  width: number;
  quantity: number;
  material: string;
  edging: string;
  edgingMaterial: string;
  notes?: string;
  confidence?: "high" | "medium" | "low";
}

interface CuttingList {
  id: string;
  name: string;
  notes: string | null;
  total_items: number;
  created_at: string;
  items: Array<{
    length: number;
    width: number;
    quantity: number;
    material: string;
    edging: string;
    edgingMaterial: string;
    notes?: string | null;
    confidence?: "high" | "medium" | "low" | null;
  }>;
}

interface LoadCuttingListProps {
  onLoad: (items: CuttingItem[]) => void;
}

export const LoadCuttingList = ({ onLoad }: LoadCuttingListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<CuttingList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  const loadLists = () => {
    setIsLoading(true);
    try {
      const savedLists = JSON.parse(localStorage.getItem('cuttingLists') || '[]');
      setLists(savedLists.reverse()); // Show newest first
    } catch (error: any) {
      console.error("Error loading lists:", error);
      toast({
        title: "Load failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = (listId: string, listName: string) => {
    try {
      const list = lists.find(l => l.id === listId);
      if (!list) throw new Error("List not found");

      const items: CuttingItem[] = list.items.map((item) => ({
        id: Date.now().toString() + Math.random(),
        length: item.length,
        width: item.width,
        quantity: item.quantity,
        material: item.material,
        edging: item.edging,
        edgingMaterial: item.edgingMaterial,
        notes: item.notes || undefined,
        confidence: item.confidence ? (item.confidence as "high" | "medium" | "low") : undefined,
      }));

      onLoad(items);
      setIsOpen(false);
      
      toast({
        title: "List loaded!",
        description: `Loaded "${listName}" with ${items.length} items`,
      });
    } catch (error: any) {
      console.error("Error loading items:", error);
      toast({
        title: "Load failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (listId: string, listName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${listName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const savedLists = JSON.parse(localStorage.getItem('cuttingLists') || '[]');
      const updatedLists = savedLists.filter((list: any) => list.id !== listId);
      localStorage.setItem('cuttingLists', JSON.stringify(updatedLists));

      toast({
        title: "Deleted",
        description: `Deleted "${listName}"`,
      });

      loadLists();
    } catch (error: any) {
      console.error("Error deleting list:", error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <FolderOpen className="h-5 w-5" />
          Load List
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Cutting List</DialogTitle>
          <DialogDescription>
            Select a saved cutting list to load
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No saved cutting lists yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  className="p-4 cursor-pointer hover:border-primary/40 transition-all group"
                  onClick={() => handleLoad(list.id, list.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {list.name}
                      </h3>
                      {list.notes && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {list.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          📋 {list.total_items} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(list.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(list.id, list.name, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

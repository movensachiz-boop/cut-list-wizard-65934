import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HardwareItem {
  id: string;
  name: string;
  short_name?: string;
  cost?: number;
  price?: number;
}

interface HardwareEntry {
  id: string;
  hardware_item_id?: string;
  quantity: number;
  custom_name?: string;
  notes?: string;
  hardware_items?: HardwareItem;
}

interface HardwareSelectorProps {
  cuttingListId: string;
  onHardwareChange?: () => void;
}

export function HardwareSelector({ cuttingListId, onHardwareChange }: HardwareSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchedItem, setMatchedItem] = useState<HardwareItem | null>(null);
  const [confidence, setConfidence] = useState<string>("");
  const [reasoning, setReasoning] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [hardwareEntries, setHardwareEntries] = useState<HardwareEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHardwareEntries();
  }, [cuttingListId]);

  const loadHardwareEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('hardware_entries')
        .select(`
          *,
          hardware_items (
            id,
            name,
            short_name,
            cost,
            price
          )
        `)
        .eq('cutting_list_id', cuttingListId);

      if (error) throw error;
      setHardwareEntries(data || []);
    } catch (error) {
      console.error('Error loading hardware entries:', error);
    }
  };

  const searchHardware = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter search term",
        description: "Please enter a hardware item name to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setMatchedItem(null);

    try {
      const { data, error } = await supabase.functions.invoke('match-hardware', {
        body: { userInput: searchQuery }
      });

      if (error) throw error;

      if (data?.matched_item) {
        setMatchedItem(data.matched_item);
        setConfidence(data.confidence || "");
        setReasoning(data.reasoning || "");
      } else {
        toast({
          title: "No match found",
          description: "Try a different search term or add as custom hardware",
        });
      }
    } catch (error) {
      console.error('Error matching hardware:', error);
      toast({
        title: "Search failed",
        description: "Unable to search hardware items",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addHardwareEntry = async () => {
    if (!matchedItem) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('hardware_entries')
        .insert({
          cutting_list_id: cuttingListId,
          hardware_item_id: matchedItem.id,
          quantity: quantity
        });

      if (error) throw error;

      toast({
        title: "Hardware added",
        description: `Added ${quantity}x ${matchedItem.name}`
      });

      setSearchQuery("");
      setMatchedItem(null);
      setQuantity(1);
      setConfidence("");
      setReasoning("");
      await loadHardwareEntries();
      onHardwareChange?.();
    } catch (error) {
      console.error('Error adding hardware:', error);
      toast({
        title: "Failed to add hardware",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeHardwareEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('hardware_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Hardware removed",
        description: "Item removed from list"
      });

      await loadHardwareEntries();
      onHardwareChange?.();
    } catch (error) {
      console.error('Error removing hardware:', error);
      toast({
        title: "Failed to remove",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (entryId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('hardware_entries')
        .update({ quantity: newQuantity })
        .eq('id', entryId);

      if (error) throw error;

      await loadHardwareEntries();
      onHardwareChange?.();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Hardware Selection
        </CardTitle>
        <CardDescription>
          Search and add hardware items with smart matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search hardware (e.g., 'hinges soft close', '192mm handles')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchHardware()}
              />
            </div>
            <Button 
              onClick={searchHardware} 
              disabled={isSearching}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Matched Item Display */}
          {matchedItem && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{matchedItem.name}</h4>
                  {matchedItem.short_name && (
                    <p className="text-sm text-muted-foreground">{matchedItem.short_name}</p>
                  )}
                </div>
                
                {confidence && (
                  <Badge variant={
                    confidence === "high" ? "default" : 
                    confidence === "medium" ? "secondary" : 
                    "outline"
                  }>
                    {confidence} confidence
                  </Badge>
                )}

                {reasoning && (
                  <p className="text-sm text-muted-foreground italic">{reasoning}</p>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                  </div>
                  <Button 
                    onClick={addHardwareEntry} 
                    disabled={isLoading}
                    className="gap-2 mt-6"
                  >
                    <Plus className="h-4 w-4" />
                    Add to List
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hardware Entries List */}
        {hardwareEntries.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Added Hardware ({hardwareEntries.length})
            </h3>
            <ScrollArea className="h-[300px] rounded-lg border-2 p-4">
              <div className="space-y-2">
                {hardwareEntries.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">
                          {entry.hardware_items?.name || entry.custom_name || "Unknown Item"}
                        </p>
                        {entry.hardware_items?.short_name && (
                          <p className="text-sm text-muted-foreground">
                            {entry.hardware_items.short_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(e) => updateQuantity(entry.id, parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHardwareEntry(entry.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

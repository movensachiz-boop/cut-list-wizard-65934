import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Download, Plus, List, AlertTriangle, Zap, Calculator as CalcIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SmartSelect } from "@/components/SmartSelect";
import { HeroSection } from "@/components/HeroSection";
import { ImageAnalysisSection } from "@/components/ImageAnalysisSection";
import { SaveCuttingList } from "@/components/SaveCuttingList";
import { LoadCuttingList } from "@/components/LoadCuttingList";
import { MassCorrection } from "@/components/MassCorrection";
import { AIAssistant } from "@/components/AIAssistant";
import { BibleVerseSlider } from "@/components/BibleVerseSlider";
import { SheetOptimization } from "@/components/SheetOptimization";
import { HardwareSelector } from "@/components/HardwareSelector";
import { Announcements } from "@/components/Announcements";
import { Calculator } from "@/components/Calculator";
import { CompanySettings } from "@/components/CompanySettings";
const MATERIAL_OPTIONS = [
// Traditional Materials
"White Melamine", "Azzano High Gloss", "Grain colored board", "Grain example board", "Glass 4mm", "Storm grey matt", "Grigio Matt", "Laricina Melamine", "Storm grey gloss", "Masonite 2.3", "Masonite 2.4", "Postform", "POSTFORM", "PVC Board 2.4", "Black Board Matt", "Gloss white board", "Postform Large", "Caraz", "Hardboard", "Luca polenta", "High Gloss melamine", "Plain Colored boards", "Iceberg white-Gloss", "Brookhill Matt", "Folkstone Grey Gloss", "Grigio", "Leatherwood", "Lucapolenta", "Lucaurban", "Masonite-Large", "PVC (2.4X1.2)", "PVC (2.75X1.83)", "High Gloss", "Superwood", "Congo Matt", "MDF Boards", "Shale Oak", "Black Matt", "Washed Shale", "Capuccino Board Matt", "Black Cherry board", "Harvard Cherry Board", "Granite", "Folkstone Grey Matt Board", "Calacatta Quartz", "Dunblane Grey Matt Board", "Color Board [TBA]", "Natural Oak Matt", "Plywood", "Camden Board Matt", "Cascade Board Matt", "Coimbra Board Matt", "Sahara Board Matt", "Quartz Star Gray", "Quartz (Star Range)", "American Walnut", "Quartz Slab", "Quartz Stone", "Royal Mahogany", "Calacatta Quartz Slab", "Calais Board", "Catalan Postform", "Dunblane gloss board", "Capuccino Gloss",
// Hardware Items
"Straight hinges ordinary", "192mm Light handles", "Wire nails", "Leg Example Item", "Small plastic brackets", "Anchor nails (6X70)", "Runner Example Item", "16mm Screws", "30mm Screws", "40mm Screws", "300mm runners", "50mm Screws", "Contact glue 500", "500mm runners", "192mm Heavy  handles", "Hinges corner", "Silicone clear", "Postform jointer", "PVC adj legs 150mm sets", "Spice rack pull out", "400mm runners", "Straight hinges soft close", "Hanging rail per metre", "Chrome Hanging rail per metre", "500mm PTO runners", "Woodfiller", "Steel corner brackets", "Veg baskets 500", "Bin ordinary 25L", "288mm Heavy  handles", "Drawer locks", "Singless Hinges", "450mm runners", "Bradnails 50F", "Silicone paintable", "Plastic glass clips", "1 inch nails half", "Black neptune 192", "Silicone white", "192mm Black Heavy Handles", "350mm runners", "Drywall screws 41mm", "Metal glass clips", "Glass holders plastic", "Shelf studs", "Silicone grey", "Wine rack - 6R", "Wine rack - 9R", "Woodfiller grey", "Hinges BIC softclose", "PVC adj legs 100m", "Camlock", "Labour", "Shelf holders", "45mm Screws", "Hinges Kitchen Standard", "Nails kg", "Chrome Leg 150mm", "Shelf Stud Item", "Box Anchor Nails (6X70)", "Double Action Runners", "Screw 8x16", "Screw 8x30", "Screw 8x40", "Plastic shelf brackets +lids", "Hanging Rail + Brackets", "Pull Out Shoe Rack (600mm)", "Metal Corner Brackets", "BIC Hinges", "Hinges Blind Corner", "Corner Hinge", "Bar Handles Heavy Steel 128mm", "Bar Handles Heavy Steel 192mm", "Cutting fee per sheet", "Anchor nails  8x70", "Hinges Soft Close", "Handle Gold Bar", "Chrome Leg 100mm", "Chrome Leg 80mm", "Plastic Legs", "Ball Bearing Drawer Tracks - 500", "Ball Bearing Drawer Tracks - 450", "Pull Out Bin", "Veg Basket 500", "Hanger Rail Brackets", "Grooving", "Legs plastics adjustable", "Steel brackets", "Edging charge per metre", "Ball Bearing Drawer Tracks - 450 (Soft close)", "Ball Bearing Drawer Tracks - 500 (Soft close)", "Rotating Pot Rack", "Corner Hinges Soft Close", "Pot Rotating Rack", "Cutting - pieces", "Pantry Brackets", "Cups", "Thinners", "Filler", "Snow white paint 500", "Spice rack", "Bin - Swing", "Bin Ordinary", "Screw Bits PZ2", "Edging (32mm)", "Holesaw", "Desk grommets", "Edging 16mm", "Bar Handles Heavy Steel 288mm", "Flash barrel boards", "Handle Roman 224", "Pull out plate rack - 900 unit", "Transport", "Aluminium line handles", "Hanging rail ends", "Floating shelf holder", "knob handle", "POS Bits (Box)", "Plastic shelf brackets big", "Door catchers", "Timber (76X38)", "Hanging rail - pull out", "Sliding Bottom Guide - 3m", "Sliding pulling profile (upright handles)", "Sliding top guide", "Sliding U-Channel - 3m", "Sliding wheel set", "Site Visit", "Door knob", "Glass clips plastic", "Glass clips metal", "Transport - Outside Gweru", "Screw Big Box 40mm", "Screw Big Box 30mm", "Screw Box 16mm", "Screw 8x50", "Forklift hire - local", "Spice pull out", "Hinges - BICs", "Tie rack 305", "Trouse rack", "Vegetable rack", "Hanger - Pull Out", "Forklift Hire", "Towel rack", "Nails pack", "Hanging Rail", "Cutting fee", "Ball Bearing Drawer Tracks - 500 PTO", "Hinge Piano", "Anchor nails  8x100", "Labour, Transport", "Hinges BIC Soft Close", "Barrel bolts", "Sliding door fittings", "Sliding doors clips", "Brandering 38X38", "Drywall - 40mm", "Glue", "Screw Big Box 50mm", "Flexible corners", "Flutted panels", "Concrete bits", "Ball Bearing Drawer Tracks - 400", "Handles - light 198", "Ventilation metal", "Cutting fee half", "Tape measure", "Fisher plugs box", "Bar Light Aluminium 192mm", "Hinge fixers", "TNails", "Sink full set", "Sealant white", "Silicone - black", "Brandering", "Butt hinge", "Bolts verandah", "Ball Bearing Drawer Tracks - 300", "Ball Bearing Drawer Tracks - 350", "Flush hinges", "screws 8*60", "Handles -light 96mm", "Handles -light 128mm", "Silicone - Paintable", "Push to Open-Special", "1kg 1inch nails", "Glass shelf holder", "Cutting fee clients", "Pvc adjustable legs 1 pack 100mm", "Pvc adjustable legs 1 pack 150mm", "Ball Bearing Drawer Tracks - 250", "Padlocks", "Bits star", "Bits square", "Glass holders", "Grey paint 1l", "Hinge holes", "Plastic corner brackets", "light round 4 corner", "Roman Handles", "Floated Panels", "Gas Hinge", "Bar Handles steel black 192mm", "Airvents", "Panels", "stickers", "Sticker pack", "Chrome hanging rail", "Silicone -grey", "Bits 8mm", "Neptune handles 192mm", "Metal bits", "Concrete bits", "Big Push to Open", "Metal Glass Clips", "Post Form joiners", "U Channel", "TOP Guide", "Bottom Guide", "Profile", "Wheels Set", "Rail Center Support", "Roman handles 288mm", "Masonary Bits", "Handles 288 Bar", "Glass studs", "Keys", "Chrome handles 192mm", "Chrome handles 288", "Hooks", "Dry walls -25mm", "Woodfiller brown", "16mm Square Screws", "30mm Square Screws", "40mm Square Screws", "16mm Box Square Screws", "30mm Box Square Screws", "40mm Box Square Screws", "30mm Screws Box", "16mm Box Screws", "40mm Box Screws", "Fix It Glue", "Drywalls-25", "288mm Light  handles", "Postform full", "Postform half", "Gold Handles 192", "Aluminium kickplate", "Woodglue", "Cloth", "Screw covers white pack", "Screw covers color pack", "Rhinotape", "L-angle", "U-Tracks", "Drywall screws 3.5X20 (Box)", "Wire nails (kg)", "Steel nails (Kg)", "Kickplate joiners", "Ends Hanging rail", "Mutton Cloth", "Kick plate", "Brad nails half", "1 inch nails", "Strip handles 128mm", "Strip handles 320mm", "Routing charges", "Speckled white", "Round leg", "Star black", "Corner brackets big", "Postform double (900)", "Hanger centre chrome", "Plastic brackets TapIn", "H Channel", "2.5m U Channel", "Concrete nails (kg)", "Interior Flash Doors [Clearance price]", "Line handles (3m)", "Mirror 3mm", "Cornice pine 6m", "Polishing Brush", "Chrome legs 50mm", "Island Quartz (1.7X0.7)", "Quartz Star Black [1800X900]", "192mm Light black handle", "Main BiC", "BiC 1", "BiC 2", "PVC Ceiling (6X0.2)", "3 inch Wire nails", "Cornices", "Labour (Ceiling)", "Quartz Stone White (1820X1135)", "Glasses", "Bradnail 30", "Stick like Shit Glue Devil", "PTO 300 runners", "Flutted Wall Panels (Special)", "Nordic Handles", "450mm PTO runners", "PTO 450 RUNNERS", "PTO 350 RUNNERS"];

// Set of hardware items that don't need edging
const HARDWARE_ITEMS = new Set(["Straight hinges ordinary", "192mm Light handles", "Wire nails", "Leg Example Item", "Small plastic brackets", "Anchor nails (6X70)", "Runner Example Item", "16mm Screws", "30mm Screws", "40mm Screws", "300mm runners", "50mm Screws", "Contact glue 500", "500mm runners", "192mm Heavy  handles", "Hinges corner", "Silicone clear", "Postform jointer", "PVC adj legs 150mm sets", "Spice rack pull out", "400mm runners", "Straight hinges soft close", "Hanging rail per metre", "Chrome Hanging rail per metre", "500mm PTO runners", "Woodfiller", "Steel corner brackets", "Veg baskets 500", "Bin ordinary 25L", "288mm Heavy  handles", "Drawer locks", "Singless Hinges", "450mm runners", "Bradnails 50F", "Silicone paintable", "Plastic glass clips", "1 inch nails half", "Black neptune 192", "Silicone white", "192mm Black Heavy Handles", "350mm runners", "Drywall screws 41mm", "Metal glass clips", "Glass holders plastic", "Shelf studs", "Silicone grey", "Wine rack - 6R", "Wine rack - 9R", "Woodfiller grey", "Hinges BIC softclose", "PVC adj legs 100m", "Camlock", "Labour", "Shelf holders", "45mm Screws", "Hinges Kitchen Standard", "Nails kg", "Chrome Leg 150mm", "Shelf Stud Item", "Box Anchor Nails (6X70)", "Double Action Runners", "Screw 8x16", "Screw 8x30", "Screw 8x40", "Plastic shelf brackets +lids", "Hanging Rail + Brackets", "Pull Out Shoe Rack (600mm)", "Metal Corner Brackets", "BIC Hinges", "Hinges Blind Corner", "Corner Hinge", "Bar Handles Heavy Steel 128mm", "Bar Handles Heavy Steel 192mm", "Cutting fee per sheet", "Anchor nails  8x70", "Hinges Soft Close", "Handle Gold Bar", "Chrome Leg 100mm", "Chrome Leg 80mm", "Plastic Legs", "Ball Bearing Drawer Tracks - 500", "Ball Bearing Drawer Tracks - 450", "Pull Out Bin", "Veg Basket 500", "Hanger Rail Brackets", "Grooving", "Legs plastics adjustable", "Steel brackets", "Edging charge per metre", "Ball Bearing Drawer Tracks - 450 (Soft close)", "Ball Bearing Drawer Tracks - 500 (Soft close)", "Rotating Pot Rack", "Corner Hinges Soft Close", "Pot Rotating Rack", "Cutting - pieces", "Pantry Brackets", "Cups", "Thinners", "Filler", "Snow white paint 500", "Spice rack", "Bin - Swing", "Bin Ordinary", "Screw Bits PZ2", "Edging (32mm)", "Holesaw", "Desk grommets", "Edging 16mm", "Bar Handles Heavy Steel 288mm", "Flash barrel boards", "Handle Roman 224", "Pull out plate rack - 900 unit", "Transport", "Aluminium line handles", "Hanging rail ends", "Floating shelf holder", "knob handle", "POS Bits (Box)", "Plastic shelf brackets big", "Door catchers", "Timber (76X38)", "Hanging rail - pull out", "Sliding Bottom Guide - 3m", "Sliding pulling profile (upright handles)", "Sliding top guide", "Sliding U-Channel - 3m", "Sliding wheel set", "Site Visit", "Door knob", "Glass clips plastic", "Glass clips metal", "Transport - Outside Gweru", "Screw Big Box 40mm", "Screw Big Box 30mm", "Screw Box 16mm", "Screw 8x50", "Forklift hire - local", "Spice pull out", "Hinges - BICs", "Tie rack 305", "Trouse rack", "Vegetable rack", "Hanger - Pull Out", "Forklift Hire", "Towel rack", "Nails pack", "Hanging Rail", "Cutting fee", "Ball Bearing Drawer Tracks - 500 PTO", "Hinge Piano", "Anchor nails  8x100", "Labour, Transport", "Hinges BIC Soft Close", "Barrel bolts", "Sliding door fittings", "Sliding doors clips", "Brandering 38X38", "Drywall - 40mm", "Glue", "Screw Big Box 50mm", "Flexible corners", "Flutted panels", "Concrete bits", "Ball Bearing Drawer Tracks - 400", "Handles - light 198", "Ventilation metal", "Cutting fee half", "Tape measure", "Fisher plugs box", "Bar Light Aluminium 192mm", "Hinge fixers", "TNails", "Sink full set", "Sealant white", "Silicone - black", "Brandering", "Butt hinge", "Bolts verandah", "Ball Bearing Drawer Tracks - 300", "Ball Bearing Drawer Tracks - 350", "Flush hinges", "screws 8*60", "Handles -light 96mm", "Handles -light 128mm", "Silicone - Paintable", "Push to Open-Special", "1kg 1inch nails", "Glass shelf holder", "Cutting fee clients", "Pvc adjustable legs 1 pack 100mm", "Pvc adjustable legs 1 pack 150mm", "Ball Bearing Drawer Tracks - 250", "Padlocks", "Bits star", "Bits square", "Glass holders", "Grey paint 1l", "Hinge holes", "Plastic corner brackets", "light round 4 corner", "Roman Handles", "Floated Panels", "Gas Hinge", "Bar Handles steel black 192mm", "Airvents", "Panels", "stickers", "Sticker pack", "Chrome hanging rail", "Silicone -grey", "Bits 8mm", "Neptune handles 192mm", "Metal bits", "Concrete bits", "Big Push to Open", "Metal Glass Clips", "Post Form joiners", "U Channel", "TOP Guide", "Bottom Guide", "Profile", "Wheels Set", "Rail Center Support", "Roman handles 288mm", "Masonary Bits", "Handles 288 Bar", "Glass studs", "Keys", "Chrome handles 192mm", "Chrome handles 288", "Hooks", "Dry walls -25mm", "Woodfiller brown", "16mm Square Screws", "30mm Square Screws", "40mm Square Screws", "16mm Box Square Screws", "30mm Box Square Screws", "40mm Box Square Screws", "30mm Screws Box", "16mm Box Screws", "40mm Box Screws", "Fix It Glue", "Drywalls-25", "288mm Light  handles", "Gold Handles 192", "Aluminium kickplate", "Woodglue", "Cloth", "Screw covers white pack", "Screw covers color pack", "Rhinotape", "L-angle", "U-Tracks", "Drywall screws 3.5X20 (Box)", "Wire nails (kg)", "Steel nails (Kg)", "Kickplate joiners", "Ends Hanging rail", "Mutton Cloth", "Kick plate", "Brad nails half", "1 inch nails", "Strip handles 128mm", "Strip handles 320mm", "Routing charges", "Speckled white", "Round leg", "Star black", "Corner brackets big", "Hanger centre chrome", "Plastic brackets TapIn", "H Channel", "2.5m U Channel", "Concrete nails (kg)", "Interior Flash Doors [Clearance price]", "Line handles (3m)", "Mirror 3mm", "Cornice pine 6m", "Polishing Brush", "Chrome legs 50mm", "Island Quartz (1.7X0.7)", "Quartz Star Black [1800X900]", "192mm Light black handle", "Main BiC", "BiC 1", "BiC 2", "PVC Ceiling (6X0.2)", "3 inch Wire nails", "Cornices", "Labour (Ceiling)", "Quartz Stone White (1820X1135)", "Glasses", "Bradnail 30", "Stick like Shit Glue Devil", "PTO 300 runners", "Flutted Wall Panels (Special)", "Nordic Handles", "450mm PTO runners", "PTO 450 RUNNERS", "PTO 350 RUNNERS"]);
const EDGING_TYPE_OPTIONS = ["None", "1 Long", "2 Long", "1 Short", "2 Short", "All Round", "1 Long 1 Short", "2 Long 1 Short", "1 Long 2 Short"];
const EDGING_MATERIAL_OPTIONS = ["White matt edging", "Colour Edging", "Storm grey matt edging", "Storm grey gloss edging", "White gloss edging", "Grigio Matt Edging", "American W Matt", "Black Gloss Edging", "Black matt edging", "Black matt 2mm", "0.4mm Lucaurban edging", "0.4mm Loose edging", "32mm Edging", "0.4mm Black matt edging", "White Edging", "Grain Colored Edging", "32mm Own Edging Charge", "Black Edging", "Gloss White Edging", "Grain colored - 32mm", "American Walnut Gloss", "Brookhill edging", "Folkstone Grey Matt Edging", "Gloss Edging", "Grigio Edging", "Leatherwood Edging", "Loose edging", "0.4 White edging", "0.4 Loose edging", "Folkstone Grey Gloss", "0.4mm color edging", "Congo 0.4 Edging", "Black Cherry Edging", "Caraz Edging", "Loose - Folkstone grey matt", "0.4 own edging", "Dunblane Grey Edging", "Natural Oak Edging", "2mm white edging", "2mm black edging", "0.4 Lucaurban edging", "American  Walnut edging", "Own Edging charge", "0.4 Lucapolenta edging", "0.4mm black edging", "Harvard cherry edging", "0.4mm s/grey edging", "African Wenge Edging", "Cappuccino edging", "Coimbra loose edging", "White Loose edging", "32mm Storm Grey Matt", "Coimbra Edging", "Folkstone gloss edging [Lawlinon]", "Camden Edging", "Cascade Edging", "Grooving per metre", "0.4mm red edging", "Iceberg gloss Edging [Promotion]", "Sahara Edging", "Royal Mahogany Edging", "Cappuccino gloss edging", "32mm White Edging", "Petrol Blue Edging", "Gloss Edging (promo)", "Dunblane grey matt edging", "Dunblane grey gloss edging", "PVC Edge"];
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
const Index = () => {
  const [items, setItems] = useState<CuttingItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [material, setMaterial] = useState("White Melamine");
  const [edging, setEdging] = useState("None");
  const [edgingMaterial, setEdgingMaterial] = useState("White Edging");
  const [notes, setNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastBatchSize, setLastBatchSize] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMaterial, setBulkMaterial] = useState("White Melamine");
  const [bulkEdging, setBulkEdging] = useState("None");
  const [bulkEdgingMaterial, setBulkEdgingMaterial] = useState("White Edging");
  const [initialBulkMaterial, setInitialBulkMaterial] = useState("White Melamine");
  const [initialBulkEdging, setInitialBulkEdging] = useState("None");
  const [initialBulkEdgingMaterial, setInitialBulkEdgingMaterial] = useState("White Edging");
  const [currentCuttingListId, setCurrentCuttingListId] = useState<string | null>(null);
  const [showHardwareSelector, setShowHardwareSelector] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isAutoCorrectingRef = useRef(false);

  // Auto-edging logic: Apply "1 Long" to melamine/colorboard items
  useEffect(() => {
    // Prevent infinite loops and validate items
    if (isAutoCorrectingRef.current || !items || !Array.isArray(items) || items.length === 0) return;

    try {
      // Group items by material with defensive checks
      const materialGroups = new Map<string, CuttingItem[]>();
      items.forEach(item => {
        if (!item || !item.material) return; // Skip invalid items
        const existing = materialGroups.get(item.material) || [];
        materialGroups.set(item.material, [...existing, item]);
      });

      const updatedItems: CuttingItem[] = [];
      let hasChanges = false;

      materialGroups.forEach((groupItems, material) => {
        // Defensive checks
        if (!groupItems || !Array.isArray(groupItems) || groupItems.length === 0 || !material) {
          return;
        }
        
        const materialLower = material.toLowerCase();
        
        // Check if this material should have auto-edging
        const shouldAutoEdge = 
          (materialLower.includes('melamine') || materialLower.includes('colorboard')) &&
          !materialLower.includes('superwood') &&
          !materialLower.includes('masonite') &&
          !materialLower.includes('quartz');

        if (!shouldAutoEdge) {
          updatedItems.push(...groupItems);
          return;
        }

        // Check if any items in this group already have "1 Long" edging
        const hasExplicit1L = groupItems.some(item => item && item.edging === "1 Long");
        
        // Check if this material should default to "Colour Edging"
        const shouldDefaultColourEdging = 
          materialLower === 'white melamine' || 
          (materialLower.includes('colorboard') && materialLower.includes('tba')) ||
          (materialLower.includes('color board') && materialLower.includes('tba'));

        groupItems.forEach(item => {
          if (!item) return; // Skip invalid items
          
          let updatedItem = { ...item };
          
          // If no items have 1L and this item has no edging, apply 1L
          if (!hasExplicit1L && (item.edging === "None" || !item.edging)) {
            updatedItem.edging = "1 Long";
            hasChanges = true;
          }
          
          // Auto-set edging material to "Colour Edging" for White Melamine and Colorboard TBA
          if (shouldDefaultColourEdging && (!item.edgingMaterial || item.edgingMaterial.trim() === '')) {
            updatedItem.edgingMaterial = "Colour Edging";
            hasChanges = true;
          }
          
          updatedItems.push(updatedItem);
        });
      });

      if (hasChanges) {
        isAutoCorrectingRef.current = true;
        setItems(updatedItems);
        setTimeout(() => {
          isAutoCorrectingRef.current = false;
        }, 100);
      }
    } catch (error) {
      console.error("Error in auto-edging logic:", error);
      isAutoCorrectingRef.current = false;
    }
  }, [items]);
  
  // Auto-format phone numbers in notes
  useEffect(() => {
    // Prevent infinite loops and validate items
    if (isAutoCorrectingRef.current || !items || !Array.isArray(items) || items.length === 0) return;

    try {
      let hasChanges = false;
      const updatedItems = items.map(item => {
        if (!item || !item.notes) return item;
        
        // Auto-format phone numbers: convert 0XXXXXXXXX to +263 XXXXXXXXX
        const phoneRegex = /\b0(\d{9})\b/g;
        const formattedNotes = item.notes.replace(phoneRegex, (match, digits) => {
          hasChanges = true;
          return `+263 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
        });
        
        if (formattedNotes !== item.notes) {
          return { ...item, notes: formattedNotes };
        }
        return item;
      });

      if (hasChanges) {
        isAutoCorrectingRef.current = true;
        setItems(updatedItems);
        setTimeout(() => {
          isAutoCorrectingRef.current = false;
        }, 100);
      }
    } catch (error) {
      console.error("Error in phone number auto-formatting:", error);
      isAutoCorrectingRef.current = false;
    }
  }, [items]);
  
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            analyzeImage(file);
            toast({
              title: "Image pasted",
              description: "Analyzing cutting dimensions..."
            });
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [material, edging, edgingMaterial, items]);
  const parseShorthand = (input: string): {
    length: number;
    width: number;
    quantity: number;
    edgingMaterial?: string;
    notes?: string;
  } | null => {
    // Support formats like: 300X400X2, 300x400x2, 300*400*2
    const regex = /(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)/;
    const match = input.match(regex);
    if (match) {
      // Check if "32mm" is mentioned in the input
      const has32mm = /32mm/i.test(input);
      
      // Check if "groove" is mentioned in the input
      const hasGroove = /groove/i.test(input);
      
      // Auto-format phone numbers: convert 0XXXXXXXXX to +263 XXXXXXXXX
      let notesText = hasGroove ? "groove" : "";
      const phoneRegex = /\b0(\d{9})\b/g;
      const phoneMatches = input.match(phoneRegex);
      if (phoneMatches) {
        phoneMatches.forEach(phone => {
          const formatted = `+263 ${phone.substring(1, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
          notesText = notesText ? `${notesText} ${formatted}` : formatted;
        });
      }
      
      return {
        length: parseInt(match[1]),
        width: parseInt(match[2]),
        quantity: parseInt(match[3]),
        edgingMaterial: has32mm ? "32mm Edging" : undefined,
        notes: notesText || undefined
      };
    }
    return null;
  };
  const addItem = () => {
    const parsed = parseShorthand(inputValue);
    if (!parsed) {
      toast({
        title: "Invalid format",
        description: "Use format: LengthXWidthXQuantity (e.g., 300X400X2)",
        variant: "destructive"
      });
      return;
    }
    const newItem: CuttingItem = {
      id: Date.now().toString(),
      length: parsed.length,
      width: parsed.width,
      quantity: parsed.quantity,
      material,
      edging,
      edgingMaterial: parsed.edgingMaterial || edgingMaterial,
      notes: parsed.notes || notes
    };
    setItems([...items, newItem]);
    setLastBatchSize(1);
    setInputValue("");
    setNotes("");
    toast({
      title: "Item added",
      description: `${parsed.length}x${parsed.width}x${parsed.quantity} added to cutting list`
    });
  };
  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: "Item deleted from cutting list"
    });
  };

  const handleUpdateMultipleItems = (itemIds: string[], updates: Partial<CuttingItem>) => {
    try {
      console.log("handleUpdateMultipleItems called with:", { itemIds, updates });
      
      if (!itemIds || itemIds.length === 0) {
        console.error("No item IDs provided");
        toast({
          title: "Update failed",
          description: "No items selected for update",
          variant: "destructive"
        });
        return;
      }

      if (!updates || Object.keys(updates).length === 0) {
        console.error("No updates provided");
        toast({
          title: "Update failed", 
          description: "No changes specified",
          variant: "destructive"
        });
        return;
      }
      
      // Temporarily disable auto-correction during mass updates
      isAutoCorrectingRef.current = true;
      
      setItems(prevItems => {
        // Defensive check to ensure prevItems is valid
        if (!prevItems || !Array.isArray(prevItems)) {
          console.error("Invalid prevItems state:", prevItems);
          return prevItems || [];
        }
        
        // Apply updates only to selected items, preserving all other fields
        const newItems = prevItems.map(item => {
          if (itemIds.includes(item.id)) {
            // Only update fields that are in the updates object
            return { ...item, ...updates };
          }
          return item;
        });
        
        console.log("Mass update complete. Updated items:", newItems.filter(item => itemIds.includes(item.id)));
        return newItems;
      });
      
      // Dynamic delay based on number of items (1-3 seconds)
      const delay = Math.min(1000 + (itemIds.length * 50), 3000);
      setTimeout(() => {
        isAutoCorrectingRef.current = false;
      }, delay);
      
      toast({
        title: "Items updated",
        description: `Successfully updated ${itemIds.length} item${itemIds.length !== 1 ? 's' : ''}`
      });
    } catch (error) {
      console.error("Error in handleUpdateMultipleItems:", error);
      toast({
        title: "Update failed",
        description: "Failed to update items. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    // MaxCut CSV format
    let csv = 'Sep=,\n';
    csv += '"Type","Name","Length","Width","Quantity","Notes","Can Rotate (0 = No / 1 = Yes / 2 = Same As Material)","Material","Edging Length 1","Edging Length 2","Edging Width 1","Edging Width 2","Include Edging Thickness","Note 1","Note 2","Note 3","Note 4","Group","Report Tags","Import ID","Parent ID","Library Item Name","Holes Length 1","Holes Length 2","Holes Width 1","Holes Width 2","Grooving Length 1","Grooving Length 2","Grooving Width 1","Grooving Width 2","Material Tag","Edging Length 1 Tag","Edging Length 2 Tag","Edging Width 1 Tag","Edging Width 2 Tag","Apply Machining Charge","Long Expansion","Short Expansion"\n';
    items.forEach((item, index) => {
      // Map edging to CSV columns based on selection
      // Columns: Edging Length 1, Edging Length 2, Edging Width 1, Edging Width 2
      let edgingL1 = "",
        edgingL2 = "",
        edgingW1 = "",
        edgingW2 = "";
      const edgingType = item.edgingMaterial;
      switch (item.edging) {
        case "1 Long":
          edgingL1 = edgingType; // First column only
          break;
        case "2 Long":
          edgingL1 = edgingType; // First and second columns
          edgingL2 = edgingType;
          break;
        case "1 Short":
          edgingW1 = edgingType; // Third column only
          break;
        case "2 Short":
          edgingW1 = edgingType; // Third and fourth columns
          edgingW2 = edgingType;
          break;
        case "All Round":
          edgingL1 = edgingType; // All four columns
          edgingL2 = edgingType;
          edgingW1 = edgingType;
          edgingW2 = edgingType;
          break;
      }
      csv += `"Input Panel","","${item.length} mm","${item.width} mm","${item.quantity}","${item.notes || ""}","IfNoGrain","${item.material}","${edgingL1}","${edgingL2}","${edgingW1}","${edgingW2}","False","","","","","","","${index + 1}","${index + 1}","","","","","","","","","","","","","","","","0","0"\n`;
    });
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cutting_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Export successful",
      description: `${items.length} items exported to GROX CUT CSV format`
    });
  };
  const addBulkItems = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      toast({
        title: "No items to add",
        description: "Please enter at least one item",
        variant: "destructive"
      });
      return;
    }
    let successCount = 0;
    let failCount = 0;
    const newItems: CuttingItem[] = [];
    lines.forEach(line => {
      const parsed = parseShorthand(line.trim());
      if (parsed) {
        newItems.push({
          id: `${Date.now()}-${Math.random()}`,
          length: parsed.length,
          width: parsed.width,
          quantity: parsed.quantity,
          material: bulkMaterial,
          edging: bulkEdging,
          edgingMaterial: parsed.edgingMaterial || bulkEdgingMaterial,
          notes: parsed.notes || notes
        });
        successCount++;
      } else {
        failCount++;
      }
    });
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
      setLastBatchSize(newItems.length);
      setBulkInput("");
      setNotes("");
    }
    if (failCount > 0) {
      toast({
        title: `Added ${successCount} items`,
        description: `${failCount} items had invalid format and were skipped`,
        variant: "default"
      });
    } else {
      toast({
        title: "Bulk add successful",
        description: `${successCount} items added to cutting list`
      });
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  const handleMaterialChange = (value: string) => {
    console.log('Material changed to:', value);
    
    // Automatically set "High Gloss melamine" when "gloss" is mentioned
    if (value.toLowerCase().includes('gloss')) {
      setMaterial("High Gloss melamine");
      setEdging("All Round");
      setEdgingMaterial("Gloss Edging");
      return;
    }
    
    setMaterial(value);
    // Automatically set "Colour Edging" when material contains "Color Board"
    if (value.toLowerCase().includes('color board') || value.toLowerCase().includes('colour board')) {
      console.log('Setting edging material to Colour Edging');
      setEdgingMaterial("Colour Edging");
    }
    // Automatically set "All Round" when material contains "doors"
    if (value.toLowerCase().includes('door')) {
      console.log('Setting edging to All Round for doors');
      setEdging("All Round");
    }
  };

  const handleBulkMaterialChange = (value: string) => {
    // Automatically set "High Gloss melamine" when "gloss" is mentioned
    if (value.toLowerCase().includes('gloss')) {
      setBulkMaterial("High Gloss melamine");
      setBulkEdging("All Round");
      setBulkEdgingMaterial("Gloss Edging");
      return;
    }
    
    setBulkMaterial(value);
    // Automatically set "Colour Edging" when material contains "Color Board"
    if (value.toLowerCase().includes('color board') || value.toLowerCase().includes('colour board')) {
      setBulkEdgingMaterial("Colour Edging");
    }
    // Automatically set "All Round" when material contains "doors"
    if (value.toLowerCase().includes('door')) {
      setBulkEdging("All Round");
    }
  };
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Downscale + compress large photos (e.g. 4K camera captures) so the
   * request payload stays small enough for the analyzer.
   */
  const prepareImageData = async (file: File): Promise<string> => {
    const raw = await convertImageToBase64(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = raw;
      });

      const MAX_DIM = 2200;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return raw;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);

      let quality = 0.85;
      let out = canvas.toDataURL("image/jpeg", quality);
      // Keep under ~3MB base64
      while (out.length > 3_000_000 && quality > 0.4) {
        quality -= 0.15;
        out = canvas.toDataURL("image/jpeg", quality);
      }
      return out;
    } catch {
      return raw;
    }
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);
    try {
      // Convert image to base64
      setAnalysisProgress(20);
      const imageData = await convertImageToBase64(file);

      // Call edge function to analyze image
      setAnalysisProgress(40);
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageData
        }
      });
      setAnalysisProgress(80);
      if (error) throw error;
      if (!data.success) {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        const isNoItems = typeof data.error === "string" && data.error.toLowerCase().includes("no cutting dimensions");
        toast({
          title: isNoItems ? "No items found" : "Error 3546",
          description: isNoItems ? data.error : "Scan could not be completed. Please try again.",
          variant: "destructive"
        });
        return;
      }
      setAnalysisProgress(95);
      if (data.dimensions && data.dimensions.length > 0) {
        // Add all found cutting dimensions to the list
        const newItems: CuttingItem[] = data.dimensions.map((dim: {
          value: string;
          confidence: string;
          material?: string;
          edging?: string;
        }) => {
          const confidenceNote = dim.confidence === "low" || dim.confidence === "medium" ? ` (${dim.confidence} confidence)` : "";

          // Handle cutting dimensions
          const parsed = parseShorthand(dim.value);
          const itemMaterial = dim.material || material;
          let itemEdging = dim.edging || edging;
          
          // Automatically set "All Round" when material contains "door"
          if (itemMaterial.toLowerCase().includes('door')) {
            itemEdging = "All Round";
          }
          
          // Automatically set "Colour Edging" when material contains "Color Board"
          let itemEdgingMaterial = edgingMaterial;
          if (itemMaterial.toLowerCase().includes('color board') || itemMaterial.toLowerCase().includes('colour board')) {
            itemEdgingMaterial = "Colour Edging";
          }
          
          // Use parsed edging material if 32mm was detected
          if (parsed?.edgingMaterial) {
            itemEdgingMaterial = parsed.edgingMaterial;
          }
          
          // Build notes: start with parsed notes if available, then append image info
          let itemNotes = parsed?.notes || "";
          const imageNote = `From image${confidenceNote}`;
          itemNotes = itemNotes ? `${itemNotes}, ${imageNote}` : imageNote;
          
          return {
            id: `${Date.now()}-${Math.random()}`,
            length: parsed!.length,
            width: parsed!.width,
            quantity: parsed!.quantity,
            material: itemMaterial,
            edging: itemEdging,
            edgingMaterial: itemEdgingMaterial,
            notes: itemNotes,
            confidence: dim.confidence as "high" | "medium" | "low"
          };
        });
        setAnalysisProgress(100);
        setItems([...items, ...newItems]);
        setLastBatchSize(newItems.length);
        const uncertainCount = newItems.filter(item => item.confidence === "low" || item.confidence === "medium").length;
        
        // Handle hardware items if found
        let hardwareMessage = "";
        if (data.hardware && data.hardware.length > 0) {
          hardwareMessage = ` | ${data.hardware.length} hardware items detected`;
          
          // Add hardware to the cutting list if we have a current cutting list ID
          if (currentCuttingListId) {
            for (const hw of data.hardware) {
              if (hw.matched_item) {
                await supabase.from('hardware_entries').insert({
                  cutting_list_id: currentCuttingListId,
                  hardware_item_id: hw.matched_item.id,
                  quantity: hw.quantity,
                  notes: `From image (${hw.confidence} confidence)`
                });
              }
            }
          } else {
            // Show hardware items that were detected but couldn't be saved
            const hwNames = data.hardware.map((hw: { quantity: number; name: string }) => `${hw.quantity}x ${hw.name}`).join(', ');
            toast({
              title: "Hardware detected",
              description: `Found: ${hwNames}. Save cutting list first to add hardware items.`
            });
          }
        }
        
        toast({
          title: "Image analyzed successfully",
          description: uncertainCount > 0 
            ? `Found ${newItems.length} dimensions${hardwareMessage}. ${uncertainCount} marked as uncertain - please verify!` 
            : `Found ${newItems.length} dimensions${hardwareMessage}`
        });
      } else if (data.hardware && data.hardware.length > 0) {
        // Only hardware found, no cutting dimensions
        setAnalysisProgress(100);
        
        if (currentCuttingListId) {
          for (const hw of data.hardware) {
            if (hw.matched_item) {
              await supabase.from('hardware_entries').insert({
                cutting_list_id: currentCuttingListId,
                hardware_item_id: hw.matched_item.id,
                quantity: hw.quantity,
                notes: `From image (${hw.confidence} confidence)`
              });
            }
          }
          toast({
            title: "Hardware added",
            description: `Found and added ${data.hardware.length} hardware items from image`
          });
        } else {
          const hwNames = data.hardware.map((hw: { quantity: number; name: string }) => `${hw.quantity}x ${hw.name}`).join(', ');
          toast({
            title: "Hardware detected",
            description: `Found: ${hwNames}. Save cutting list first to add hardware items.`
          });
        }
      } else {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        toast({
          title: "No items found",
          description: "Could not find any cutting dimensions or hardware in the image",
          variant: "destructive"
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      toast({
        title: "Error 3546",
        description: "Scan could not be completed. Please try again.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 500);
    }
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeImage(file);
    }
  };
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeImage(file);
    }
  };
  const clearAllItems = () => {
    setItems([]);
    toast({
      title: "All items cleared",
      description: "Cutting list has been reset"
    });
  };
  const undoAllData = () => {
    setItems([]);
    setInputValue("");
    setBulkInput("");
    setMaterial("White Melamine");
    setEdging("None");
    setEdgingMaterial("White Edging");
    setNotes("");
    setLastBatchSize(0);
    toast({
      title: "All data cleared",
      description: "All inputs and cutting list have been reset"
    });
  };
  const undoLast = () => {
    if (lastBatchSize === 0 || items.length === 0) {
      toast({
        title: "Nothing to undo",
        description: "No recent additions to remove",
        variant: "destructive"
      });
      return;
    }
    const itemsToRemove = Math.min(lastBatchSize, items.length);
    const newItems = items.slice(0, -itemsToRemove);
    setItems(newItems);
    setLastBatchSize(0);
    toast({
      title: "Last addition undone",
      description: `Removed ${itemsToRemove} item(s) from cutting list`
    });
  };
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
      // Reset initial values when clearing selection
      setInitialBulkMaterial(bulkMaterial);
      setInitialBulkEdging(bulkEdging);
      setInitialBulkEdgingMaterial(bulkEdgingMaterial);
    } else {
      const newSelected = new Set(items.map(item => item.id));
      setSelectedItems(newSelected);
    }
  };
  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      // Reset initial values when clearing last selection
      if (newSelected.size === 0) {
        setInitialBulkMaterial(bulkMaterial);
        setInitialBulkEdging(bulkEdging);
        setInitialBulkEdgingMaterial(bulkEdgingMaterial);
      }
    } else {
      newSelected.add(id);
      // Set initial bulk values when first item is selected
      if (selectedItems.size === 0) {
        setInitialBulkMaterial(bulkMaterial);
        setInitialBulkEdging(bulkEdging);
        setInitialBulkEdgingMaterial(bulkEdgingMaterial);
      }
    }
    setSelectedItems(newSelected);
  };
  const applyBulkChanges = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to apply bulk changes",
        variant: "destructive"
      });
      return;
    }
    
    // Determine which fields have changed
    const materialChanged = bulkMaterial !== initialBulkMaterial;
    const edgingChanged = bulkEdging !== initialBulkEdging;
    const edgingMaterialChanged = bulkEdgingMaterial !== initialBulkEdgingMaterial;
    
    setItems(items.map(item => {
      if (selectedItems.has(item.id)) {
        const updates: Partial<CuttingItem> = {};
        if (materialChanged) updates.material = bulkMaterial;
        if (edgingChanged) updates.edging = bulkEdging;
        if (edgingMaterialChanged) updates.edgingMaterial = bulkEdgingMaterial;
        
        return {
          ...item,
          ...updates
        };
      }
      return item;
    }));
    
    const changedFields = [
      materialChanged && "material",
      edgingChanged && "edging",
      edgingMaterialChanged && "edging material"
    ].filter(Boolean);
    
    toast({
      title: "Bulk changes applied",
      description: changedFields.length > 0 
        ? `Updated ${changedFields.join(", ")} for ${selectedItems.size} item(s)`
        : `No changes made`
    });
    setSelectedItems(new Set());
  };

  return <div className="min-h-screen bg-background p-4 md:p-8">
      <BibleVerseSlider />
      <div className="max-w-7xl mx-auto pt-12">
        {/* Header with actions */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h2 className="text-lg text-muted-foreground">
              FastCut Cutting List Manager
            </h2>
          </div>
          <div className="flex gap-3 flex-wrap">
        <AIAssistant 
          items={items}
          onAddItem={(item) => {
            const newItem: CuttingItem = {
              id: Date.now().toString(),
              ...item
            };
            setItems([...items, newItem]);
            setLastBatchSize(1);
            toast({
              title: "Item added",
              description: `${item.length}x${item.width}x${item.quantity} added to cutting list`
            });
          }}
          onRemoveItems={(itemIds) => {
            setItems(items.filter(item => !itemIds.includes(item.id)));
            toast({
              title: "Items removed",
              description: `${itemIds.length} item(s) removed from cutting list`
            });
          }}
          onUpdateItem={(itemId, updates) => {
            setItems(items.map(item => 
              item.id === itemId ? { ...item, ...updates } : item
            ));
            toast({
              title: "Item updated",
              description: "Cutting list item has been updated"
            });
          }}
          onClearList={() => {
            setItems([]);
            setSelectedItems(new Set());
            toast({
              title: "List cleared",
              description: "All items removed from cutting list"
            });
          }}
        />
            <LoadCuttingList onLoad={(loadedItems) => setItems(loadedItems)} />
            <SaveCuttingList 
              items={items} 
              onSaved={(cuttingListId) => {
                setCurrentCuttingListId(cuttingListId);
                toast({
                  title: "Cutting list saved",
                  description: "You can now add hardware items to this list"
                });
              }}
            />
            <MassCorrection items={items} onUpdateItems={handleUpdateMultipleItems} />
            <CompanySettings />
          </div>
        </div>

        <HeroSection />

        {/* News & Announcements Section */}
        <Announcements />

        <ImageAnalysisSection isAnalyzing={isAnalyzing} analysisProgress={analysisProgress} fileInputRef={fileInputRef} cameraInputRef={cameraInputRef} handleFileUpload={handleFileUpload} handleCameraCapture={handleCameraCapture} onCameraFile={analyzeImage} />

        {/* Input Section */}
        <Card className="p-8 mb-8 border-2 border-primary/20 glass-effect hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-500"></div>
          
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Quick Entry
          </h3>
          
          <div className="grid gap-6 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Dimensions (LengthXWidthXQuantity)
              </label>
              <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="e.g., 300X400X2" className="font-mono text-lg" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Material
              </label>
              <SmartSelect value={material} onValueChange={handleMaterialChange} options={MATERIAL_OPTIONS} category="material" placeholder="Search materials..." />
            </div>

            {!HARDWARE_ITEMS.has(material) ? <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Edging Type
                  </label>
                  <SmartSelect value={edging} onValueChange={setEdging} options={EDGING_TYPE_OPTIONS} category="edging_type" placeholder="Search edging types..." />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Edging Material
                  </label>
                  <SmartSelect value={edgingMaterial} onValueChange={setEdgingMaterial} options={EDGING_MATERIAL_OPTIONS} category="edging_material" placeholder="Search edging materials..." />
                </div>
              </> : <div className="md:col-span-2 flex items-center justify-center glass-effect p-4 rounded-lg">
                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                  <span>🔧</span> Hardware items don't require edging
                </p>
              </div>}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Notes (optional)
              </label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} onKeyPress={handleKeyPress} placeholder="Optional notes..." />
            </div>
          </div>

          <Button onClick={addItem} className="mt-6 w-full md:w-auto" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </Card>

        {/* Bulk Entry Section */}
        <Card className="p-8 mb-8 border-2 border-accent/20 glass-effect hover:border-accent/30 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-all duration-500"></div>
          
          <div className="mb-6">
            <label className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span> Bulk Entry
              <span className="text-sm font-normal text-muted-foreground">(paste multiple lines)</span>
            </label>
            <Textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="300x450x2&#10;1200x600x4&#10;800x500x1&#10;..." className="font-mono text-lg min-h-[200px] border-2 focus:border-accent transition-all" />
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              💡 Paste multiple items, one per line. Format: LengthXWidthXQuantity
            </p>
          </div>

          <Button onClick={addBulkItems} variant="accent" className="w-full md:w-auto" size="lg">
            <List className="mr-2 h-5 w-5" />
            Add All Items
          </Button>
        </Card>

        {/* Cutting List Table */}
        {items.length > 0 && <Card className="p-8 border-2 border-primary/20 glass-effect animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                📋 Cutting List <span className="text-2xl">({items.length})</span>
                {selectedItems.size > 0 && <span className="ml-2 text-lg font-normal text-muted-foreground">
                    ({selectedItems.size} selected)
                  </span>}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button onClick={undoLast} variant="outline" disabled={lastBatchSize === 0} size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Undo Last
                </Button>
                <Button onClick={undoAllData} variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
                <Button onClick={exportToCSV} variant="accent" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Bulk Edit Panel */}
            {selectedItems.size > 0 && <div className="mb-6 p-6 glass-effect border-2 border-primary/30 rounded-xl animate-scale-in">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-xl">✏️</span> Bulk Edit Selected Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Material</label>
                    <Select value={bulkMaterial} onValueChange={handleBulkMaterialChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="White Melamine">White Melamine</SelectItem>
                        <SelectItem value="Azzano High Gloss">Azzano High Gloss</SelectItem>
                        <SelectItem value="Grain colored board">Grain colored board</SelectItem>
                        <SelectItem value="Storm grey matt">Storm grey matt</SelectItem>
                        <SelectItem value="Grigio Matt">Grigio Matt</SelectItem>
                        <SelectItem value="Storm grey gloss">Storm grey gloss</SelectItem>
                        <SelectItem value="Masonite 2.4">Masonite 2.4</SelectItem>
                        <SelectItem value="Postform">Postform</SelectItem>
                        <SelectItem value="PVC Board 2.4">PVC Board 2.4</SelectItem>
                        <SelectItem value="Black Board Matt">Black Board Matt</SelectItem>
                        <SelectItem value="Gloss white board">Gloss white board</SelectItem>
                        <SelectItem value="Brookhill Matt">Brookhill Matt</SelectItem>
                        <SelectItem value="Folkstone Grey Gloss">Folkstone Grey Gloss</SelectItem>
                        <SelectItem value="High Gloss">High Gloss</SelectItem>
                        <SelectItem value="Superwood">Superwood</SelectItem>
                        <SelectItem value="MDF Boards">MDF Boards</SelectItem>
                        <SelectItem value="Black Matt">Black Matt</SelectItem>
                        <SelectItem value="Harvard Cherry Board">Harvard Cherry Board</SelectItem>
                        <SelectItem value="Folkstone Grey Matt Board">Folkstone Grey Matt Board</SelectItem>
                        <SelectItem value="Dunblane Grey Matt Board">Dunblane Grey Matt Board</SelectItem>
                        <SelectItem value="Color Board [TBA]">Color Board [TBA]</SelectItem>
                        <SelectItem value="Plywood">Plywood</SelectItem>
                        <SelectItem value="Royal Mahogany">Royal Mahogany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Edging Type</label>
                    <Select value={bulkEdging} onValueChange={setBulkEdging} disabled={HARDWARE_ITEMS.has(bulkMaterial)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="1 Long">1 Long</SelectItem>
                        <SelectItem value="2 Long">2 Long</SelectItem>
                        <SelectItem value="1 Short">1 Short</SelectItem>
                        <SelectItem value="2 Short">2 Short</SelectItem>
                        <SelectItem value="All Round">All Round</SelectItem>
                        <SelectItem value="1 Long 1 Short">1 Long 1 Short</SelectItem>
                        <SelectItem value="2 Long 1 Short">2 Long 1 Short</SelectItem>
                        <SelectItem value="1 Long 2 Short">1 Long 2 Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Edging Material</label>
                    <Select value={bulkEdgingMaterial} onValueChange={setBulkEdgingMaterial} disabled={HARDWARE_ITEMS.has(bulkMaterial)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="White matt edging">White matt edging</SelectItem>
                        <SelectItem value="Colour Edging">Colour Edging</SelectItem>
                        <SelectItem value="Storm grey matt edging">Storm grey matt edging</SelectItem>
                        <SelectItem value="Storm grey gloss edging">Storm grey gloss edging</SelectItem>
                        <SelectItem value="White gloss edging">White gloss edging</SelectItem>
                        <SelectItem value="Grigio Matt Edging">Grigio Matt Edging</SelectItem>
                        <SelectItem value="American W Matt">American W Matt</SelectItem>
                        <SelectItem value="Black Gloss Edging">Black Gloss Edging</SelectItem>
                        <SelectItem value="Black matt edging">Black matt edging</SelectItem>
                        <SelectItem value="Black matt 2mm">Black matt 2mm</SelectItem>
                        <SelectItem value="0.4mm Lucaurban edging">0.4mm Lucaurban edging</SelectItem>
                        <SelectItem value="0.4mm Loose edging">0.4mm Loose edging</SelectItem>
                        <SelectItem value="32mm Edging">32mm Edging</SelectItem>
                        <SelectItem value="0.4mm Black matt edging">0.4mm Black matt edging</SelectItem>
                        <SelectItem value="White Edging">White Edging</SelectItem>
                        <SelectItem value="Grain Colored Edging">Grain Colored Edging</SelectItem>
                        <SelectItem value="32mm Own Edging Charge">32mm Own Edging Charge</SelectItem>
                        <SelectItem value="Black Edging">Black Edging</SelectItem>
                        <SelectItem value="Gloss White Edging">Gloss White Edging</SelectItem>
                        <SelectItem value="Grain colored - 32mm">Grain colored - 32mm</SelectItem>
                        <SelectItem value="American Walnut Gloss">American Walnut Gloss</SelectItem>
                        <SelectItem value="Brookhill edging">Brookhill edging</SelectItem>
                        <SelectItem value="Folkstone Grey Matt Edging">Folkstone Grey Matt Edging</SelectItem>
                        <SelectItem value="Gloss Edging">Gloss Edging</SelectItem>
                        <SelectItem value="Grigio Edging">Grigio Edging</SelectItem>
                        <SelectItem value="Leatherwood Edging">Leatherwood Edging</SelectItem>
                        <SelectItem value="Loose edging">Loose edging</SelectItem>
                        <SelectItem value="0.4 White edging">0.4 White edging</SelectItem>
                        <SelectItem value="0.4 Loose edging">0.4 Loose edging</SelectItem>
                        <SelectItem value="Folkstone Grey Gloss">Folkstone Grey Gloss</SelectItem>
                        <SelectItem value="0.4mm color edging">0.4mm color edging</SelectItem>
                        <SelectItem value="Congo 0.4 Edging">Congo 0.4 Edging</SelectItem>
                        <SelectItem value="Black Cherry Edging">Black Cherry Edging</SelectItem>
                        <SelectItem value="Caraz Edging">Caraz Edging</SelectItem>
                        <SelectItem value="Loose - Folkstone grey matt">Loose - Folkstone grey matt</SelectItem>
                        <SelectItem value="0.4 own edging">0.4 own edging</SelectItem>
                        <SelectItem value="Dunblane Grey Edging">Dunblane Grey Edging</SelectItem>
                        <SelectItem value="Natural Oak Edging">Natural Oak Edging</SelectItem>
                        <SelectItem value="2mm white edging">2mm white edging</SelectItem>
                        <SelectItem value="2mm black edging">2mm black edging</SelectItem>
                        <SelectItem value="0.4 Lucaurban edging">0.4 Lucaurban edging</SelectItem>
                        <SelectItem value="American  Walnut edging">American  Walnut edging</SelectItem>
                        <SelectItem value="Own Edging charge">Own Edging charge</SelectItem>
                        <SelectItem value="0.4 Lucapolenta edging">0.4 Lucapolenta edging</SelectItem>
                        <SelectItem value="0.4mm black edging">0.4mm black edging</SelectItem>
                        <SelectItem value="Harvard cherry edging">Harvard cherry edging</SelectItem>
                        <SelectItem value="0.4mm s/grey edging">0.4mm s/grey edging</SelectItem>
                        <SelectItem value="African Wenge Edging">African Wenge Edging</SelectItem>
                        <SelectItem value="Cappuccino edging">Cappuccino edging</SelectItem>
                        <SelectItem value="Coimbra loose edging">Coimbra loose edging</SelectItem>
                        <SelectItem value="White Loose edging">White Loose edging</SelectItem>
                        <SelectItem value="32mm Storm Grey Matt">32mm Storm Grey Matt</SelectItem>
                        <SelectItem value="Coimbra Edging">Coimbra Edging</SelectItem>
                        <SelectItem value="Folkstone gloss edging [Lawlinon]">Folkstone gloss edging [Lawlinon]</SelectItem>
                        <SelectItem value="Camden Edging">Camden Edging</SelectItem>
                        <SelectItem value="Cascade Edging">Cascade Edging</SelectItem>
                        <SelectItem value="Grooving per metre">Grooving per metre</SelectItem>
                        <SelectItem value="0.4mm red edging">0.4mm red edging</SelectItem>
                        <SelectItem value="Iceberg gloss Edging [Promotion]">Iceberg gloss Edging [Promotion]</SelectItem>
                        <SelectItem value="Sahara Edging">Sahara Edging</SelectItem>
                        <SelectItem value="Royal Mahogany Edging">Royal Mahogany Edging</SelectItem>
                        <SelectItem value="Cappuccino gloss edging">Cappuccino gloss edging</SelectItem>
                        <SelectItem value="32mm White Edging">32mm White Edging</SelectItem>
                        <SelectItem value="Petrol Blue Edging">Petrol Blue Edging</SelectItem>
                        <SelectItem value="Gloss Edging (promo)">Gloss Edging (promo)</SelectItem>
                        <SelectItem value="Dunblane grey matt edging">Dunblane grey matt edging</SelectItem>
                        <SelectItem value="Dunblane grey gloss edging">Dunblane grey gloss edging</SelectItem>
                        <SelectItem value="PVC Edge">PVC Edge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={applyBulkChanges} className="w-full h-9">
                      Apply to Selected
                    </Button>
                  </div>
                </div>
              </div>}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-3">
                      <Checkbox checked={items && Array.isArray(items) && selectedItems.size === items.length && items.length > 0} onCheckedChange={toggleSelectAll} />
                    </th>
                    <th className="text-left p-3 font-semibold text-foreground">#</th>
                    <th className="text-left p-3 font-semibold text-foreground">Length (mm)</th>
                    <th className="text-left p-3 font-semibold text-foreground">Width (mm)</th>
                    <th className="text-left p-3 font-semibold text-foreground">Quantity</th>
                    <th className="text-left p-3 font-semibold text-foreground">Material</th>
                    <th className="text-left p-3 font-semibold text-foreground">Edging Type</th>
                    <th className="text-left p-3 font-semibold text-foreground">Edging Material</th>
                    <th className="text-left p-3 font-semibold text-foreground">Notes</th>
                    <th className="text-left p-3 font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items && Array.isArray(items) && items.map((item, index) => <tr key={item.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${item.confidence === "low" || item.confidence === "medium" ? "bg-yellow-50 dark:bg-yellow-950/20" : ""} ${selectedItems.has(item.id) ? "bg-primary/10" : ""}`}>
                      <td className="p-3">
                        <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => toggleSelectItem(item.id)} />
                      </td>
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={item.length} 
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setItems(items.map(i => i.id === item.id ? { ...i, length: value } : i));
                              }
                            }}
                            className="h-8 w-24 text-sm font-mono"
                          />
                          {(item.confidence === "low" || item.confidence === "medium") && <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={item.width} 
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setItems(items.map(i => i.id === item.id ? { ...i, width: value } : i));
                              }
                            }}
                            className="h-8 w-24 text-sm font-mono"
                          />
                          {(item.confidence === "low" || item.confidence === "medium") && <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setItems(items.map(i => i.id === item.id ? { ...i, quantity: value } : i));
                              }
                            }}
                            className="h-8 w-20 text-sm font-mono"
                          />
                          {(item.confidence === "low" || item.confidence === "medium") && <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />}
                        </div>
                      </td>
                      <td className="p-2">
                        <Select value={item.material} onValueChange={value => {
                    setItems(items.map(i => i.id === item.id ? {
                      ...i,
                      material: value
                    } : i));
                  }}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="White Melamine">White Melamine</SelectItem>
                            <SelectItem value="Azzano High Gloss">Azzano High Gloss</SelectItem>
                            <SelectItem value="Grain colored board">Grain colored board</SelectItem>
                            <SelectItem value="Storm grey matt">Storm grey matt</SelectItem>
                            <SelectItem value="Grigio Matt">Grigio Matt</SelectItem>
                            <SelectItem value="Storm grey gloss">Storm grey gloss</SelectItem>
                            <SelectItem value="Masonite 2.4">Masonite 2.4</SelectItem>
                            <SelectItem value="Postform">Postform</SelectItem>
                            <SelectItem value="PVC Board 2.4">PVC Board 2.4</SelectItem>
                            <SelectItem value="Black Board Matt">Black Board Matt</SelectItem>
                            <SelectItem value="Gloss white board">Gloss white board</SelectItem>
                            <SelectItem value="Brookhill Matt">Brookhill Matt</SelectItem>
                            <SelectItem value="Folkstone Grey Gloss">Folkstone Grey Gloss</SelectItem>
                            <SelectItem value="High Gloss">High Gloss</SelectItem>
                            <SelectItem value="Superwood">Superwood</SelectItem>
                            <SelectItem value="MDF Boards">MDF Boards</SelectItem>
                            <SelectItem value="Black Matt">Black Matt</SelectItem>
                            <SelectItem value="Harvard Cherry Board">Harvard Cherry Board</SelectItem>
                            <SelectItem value="Folkstone Grey Matt Board">Folkstone Grey Matt Board</SelectItem>
                            <SelectItem value="Dunblane Grey Matt Board">Dunblane Grey Matt Board</SelectItem>
                            <SelectItem value="Color Board [TBA]">Color Board [TBA]</SelectItem>
                            <SelectItem value="Plywood">Plywood</SelectItem>
                            <SelectItem value="Royal Mahogany">Royal Mahogany</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select value={item.edging} onValueChange={value => {
                    setItems(items.map(i => i.id === item.id ? {
                      ...i,
                      edging: value
                    } : i));
                  }}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="1 Long">1 Long</SelectItem>
                            <SelectItem value="2 Long">2 Long</SelectItem>
                            <SelectItem value="1 Short">1 Short</SelectItem>
                            <SelectItem value="2 Short">2 Short</SelectItem>
                            <SelectItem value="All Round">All Round</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select value={item.edgingMaterial} onValueChange={value => {
                    setItems(items.map(i => i.id === item.id ? {
                      ...i,
                      edgingMaterial: value
                    } : i));
                  }}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="White Edging">White Edging</SelectItem>
                            <SelectItem value="Black Edging">Black Edging</SelectItem>
                            <SelectItem value="Wood Edging">Wood Edging</SelectItem>
                            <SelectItem value="PVC Edging">PVC Edging</SelectItem>
                            <SelectItem value="ABS Edging">ABS Edging</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-muted-foreground">{item.notes || "-"}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </Card>}

        {items.length === 0 && <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No items in cutting list. Start by adding dimensions above.
            </p>
          </Card>}

        {/* Hardware Selection Section */}
        {items.length > 0 && (
          <div className="mt-10">
            <Button 
              onClick={() => setShowHardwareSelector(!showHardwareSelector)}
              variant="outline"
              size="lg"
              className="mb-4 gap-2"
            >
              <Plus className="h-5 w-5" />
              {showHardwareSelector ? "Hide Hardware Selection" : "Add Hardware Items"}
            </Button>
            
            {showHardwareSelector && (
              currentCuttingListId ? (
                <HardwareSelector 
                  cuttingListId={currentCuttingListId}
                  onHardwareChange={() => {
                    toast({
                      title: "Hardware updated",
                      description: "Your hardware selection has been saved"
                    });
                  }}
                />
              ) : (
                <Card className="p-8 text-center glass-effect">
                  <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Save Cutting List First</h3>
                      <p className="text-muted-foreground">
                        Please save your cutting list to the database before adding hardware items
                      </p>
                    </div>
                  </div>
                </Card>
              )
            )}
          </div>
        )}

        {/* Sheet Optimization Section */}
        {items.length > 0 && (
          <div className="mt-10">
            <SheetOptimization cuttingItems={items} cuttingListId={currentCuttingListId} />
          </div>
        )}

        {/* Footer Credit */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Assistance{" "}
            <a 
              href="tel:+263786133259" 
              className="text-accent hover:text-accent-glow transition-colors underline"
            >
              +263 786133259
            </a>
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <a href="/terms" className="hover:text-accent transition-colors underline">
              Terms of Service
            </a>
            <span>|</span>
            <a href="/privacy" className="hover:text-accent transition-colors underline">
              Privacy Policy
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            © DATAPLEX PROPERTIES
          </p>
        </div>
      </div>

      {/* Calculator Toggle Button */}
      {!showCalculator && (
        <Button
          onClick={() => setShowCalculator(true)}
          className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
          size="icon"
        >
          <CalcIcon className="h-5 w-5" />
        </Button>
      )}

      {/* Calculator Component */}
      <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>;
};
export default Index;
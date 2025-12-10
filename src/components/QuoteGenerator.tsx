import { useState, useEffect } from "react";
import { FileText, Download, Printer, Calculator, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

interface HardwareEntry {
  id: string;
  hardware_item_id?: string;
  quantity: number;
  custom_name?: string;
  hardware_items?: {
    id: string;
    name: string;
    price?: number;
  };
}

interface MaterialPrice {
  material_name: string;
  price_per_sheet: number;
  sheet_length: number;
  sheet_width: number;
}

interface EdgingPrice {
  edging_name: string;
  price_per_meter: number;
}

interface QuoteLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  category: 'material' | 'edging' | 'hardware' | 'other';
}

interface QuoteGeneratorProps {
  items: CuttingItem[];
  cuttingListId?: string | null;
}

export function QuoteGenerator({ items, cuttingListId }: QuoteGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [edgingPrices, setEdgingPrices] = useState<EdgingPrice[]>([]);
  const [hardwareEntries, setHardwareEntries] = useState<HardwareEntry[]>([]);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPricingData();
    }
  }, [isOpen, cuttingListId]);

  const loadPricingData = async () => {
    try {
      const [materialRes, edgingRes] = await Promise.all([
        supabase.from('material_prices').select('*'),
        supabase.from('edging_prices').select('*')
      ]);

      if (materialRes.data) setMaterialPrices(materialRes.data);
      if (edgingRes.data) setEdgingPrices(edgingRes.data);

      if (cuttingListId) {
        const { data: hwData } = await supabase
          .from('hardware_entries')
          .select(`
            *,
            hardware_items (id, name, price)
          `)
          .eq('cutting_list_id', cuttingListId);
        
        if (hwData) setHardwareEntries(hwData);
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
    }
  };

  const calculateEdgingMeters = (item: CuttingItem): number => {
    const lengthM = item.length / 1000;
    const widthM = item.width / 1000;
    let meters = 0;

    switch (item.edging) {
      case 'None':
        return 0;
      case '1 Long':
        meters = lengthM;
        break;
      case '2 Long':
        meters = lengthM * 2;
        break;
      case '1 Short':
        meters = widthM;
        break;
      case '2 Short':
        meters = widthM * 2;
        break;
      case 'All Round':
        meters = (lengthM * 2) + (widthM * 2);
        break;
      case '1 Long 1 Short':
        meters = lengthM + widthM;
        break;
      case '2 Long 1 Short':
        meters = (lengthM * 2) + widthM;
        break;
      case '1 Long 2 Short':
        meters = lengthM + (widthM * 2);
        break;
      default:
        meters = 0;
    }

    return meters * item.quantity;
  };

  const generateQuote = async () => {
    setIsCalculating(true);
    const newLineItems: QuoteLineItem[] = [];

    try {
      // Group items by material to count sheets
      const materialGroups = new Map<string, { items: CuttingItem[], totalArea: number }>();
      
      items.forEach(item => {
        const existing = materialGroups.get(item.material) || { items: [], totalArea: 0 };
        const itemArea = (item.length * item.width * item.quantity) / 1000000; // Convert to m²
        materialGroups.set(item.material, {
          items: [...existing.items, item],
          totalArea: existing.totalArea + itemArea
        });
      });

      // Calculate material costs (per sheet)
      materialGroups.forEach((group, materialName) => {
        const pricing = materialPrices.find(p => 
          p.material_name.toLowerCase() === materialName.toLowerCase()
        );
        
        const sheetArea = pricing 
          ? (pricing.sheet_length * pricing.sheet_width) / 1000000 
          : (2750 * 1830) / 1000000; // Default sheet size
        
        const sheetsNeeded = Math.ceil(group.totalArea / (sheetArea * 0.85)); // 85% efficiency
        const pricePerSheet = pricing?.price_per_sheet || 0;

        if (sheetsNeeded > 0) {
          newLineItems.push({
            description: `${materialName} (${sheetsNeeded} sheet${sheetsNeeded > 1 ? 's' : ''})`,
            quantity: sheetsNeeded,
            unit: 'sheets',
            unit_price: pricePerSheet,
            total: sheetsNeeded * pricePerSheet,
            category: 'material'
          });
        }
      });

      // Group and calculate edging costs
      const edgingGroups = new Map<string, number>();
      
      items.forEach(item => {
        if (item.edging !== 'None' && item.edgingMaterial) {
          const meters = calculateEdgingMeters(item);
          const existing = edgingGroups.get(item.edgingMaterial) || 0;
          edgingGroups.set(item.edgingMaterial, existing + meters);
        }
      });

      edgingGroups.forEach((meters, edgingName) => {
        const pricing = edgingPrices.find(p => 
          p.edging_name.toLowerCase() === edgingName.toLowerCase()
        );
        
        const pricePerMeter = pricing?.price_per_meter || 0;
        const roundedMeters = Math.ceil(meters * 10) / 10; // Round to 1 decimal

        if (roundedMeters > 0) {
          newLineItems.push({
            description: `${edgingName} Edging`,
            quantity: roundedMeters,
            unit: 'meters',
            unit_price: pricePerMeter,
            total: roundedMeters * pricePerMeter,
            category: 'edging'
          });
        }
      });

      // Add hardware items
      hardwareEntries.forEach(entry => {
        const name = entry.hardware_items?.name || entry.custom_name || 'Unknown Hardware';
        const price = entry.hardware_items?.price || 0;
        
        newLineItems.push({
          description: name,
          quantity: entry.quantity,
          unit: 'pcs',
          unit_price: price,
          total: entry.quantity * price,
          category: 'hardware'
        });
      });

      setLineItems(newLineItems);
      setSubtotal(newLineItems.reduce((sum, item) => sum + item.total, 0));

    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Error",
        description: "Failed to generate quote",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const printQuote = () => {
    const printContent = document.getElementById('quote-printable');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to print the quote",
        variant: "destructive"
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quote - ${customerName || 'Customer'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; }
          .header h1 { color: #e74c3c; margin: 0; font-size: 28px; }
          .quote-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .quote-info div { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #e74c3c; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .category-header { background: #f0f0f0; font-weight: bold; }
          .totals { text-align: right; margin-top: 20px; }
          .totals .total { font-size: 24px; color: #e74c3c; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .notes { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QUOTATION</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="quote-info">
          <div>
            <strong>Customer:</strong><br>
            ${customerName || 'N/A'}<br>
            ${customerPhone || ''}
          </div>
          <div style="text-align: right;">
            <strong>Quote #:</strong> QT-${Date.now().toString().slice(-8)}<br>
            <strong>Valid for:</strong> 30 days
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${['material', 'edging', 'hardware'].map(category => {
              const categoryItems = lineItems.filter(i => i.category === category);
              if (categoryItems.length === 0) return '';
              return `
                <tr class="category-header">
                  <td colspan="5">${category.charAt(0).toUpperCase() + category.slice(1)}s</td>
                </tr>
                ${categoryItems.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
          <p class="total"><strong>Total:</strong> ${formatCurrency(subtotal)}</p>
        </div>

        ${quoteNotes ? `<div class="notes"><strong>Notes:</strong><br>${quoteNotes}</div>` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>DATAPLEX PROPERTIES</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const updateLineItemPrice = (index: number, newPrice: number) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      unit_price: newPrice,
      total: updated[index].quantity * newPrice
    };
    setLineItems(updated);
    setSubtotal(updated.reduce((sum, item) => sum + item.total, 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={items.length === 0}>
          <FileText className="h-4 w-4" />
          Generate Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Generator
          </DialogTitle>
          <DialogDescription>
            Generate a detailed quotation with pricing for materials, edging, and hardware
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={generateQuote} disabled={isCalculating} className="gap-2">
            <Calculator className="h-4 w-4" />
            {isCalculating ? "Calculating..." : "Calculate Quote"}
          </Button>
          {lineItems.length > 0 && (
            <Button variant="outline" onClick={printQuote} className="gap-2">
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]" id="quote-printable">
          {lineItems.length > 0 ? (
            <div className="space-y-4">
              {/* Materials Section */}
              {lineItems.filter(i => i.category === 'material').length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Materials</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Qty</TableHead>
                          <TableHead className="w-28">Unit Price</TableHead>
                          <TableHead className="w-24 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.filter(i => i.category === 'material').map((item, idx) => {
                          const realIdx = lineItems.findIndex(i => i === item);
                          return (
                            <TableRow key={idx}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.quantity} {item.unit}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => updateLineItemPrice(realIdx, parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Edging Section */}
              {lineItems.filter(i => i.category === 'edging').length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Edging</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Meters</TableHead>
                          <TableHead className="w-28">Price/m</TableHead>
                          <TableHead className="w-24 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.filter(i => i.category === 'edging').map((item, idx) => {
                          const realIdx = lineItems.findIndex(i => i === item);
                          return (
                            <TableRow key={idx}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.quantity}m</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => updateLineItemPrice(realIdx, parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Hardware Section */}
              {lineItems.filter(i => i.category === 'hardware').length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Hardware</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Qty</TableHead>
                          <TableHead className="w-28">Unit Price</TableHead>
                          <TableHead className="w-24 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.filter(i => i.category === 'hardware').map((item, idx) => {
                          const realIdx = lineItems.findIndex(i => i === item);
                          return (
                            <TableRow key={idx}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => updateLineItemPrice(realIdx, parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div className="flex justify-end">
                <Card className="w-64">
                  <CardContent className="pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(subtotal)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calculator className="h-12 w-12 mb-4 opacity-50" />
              <p>Click "Calculate Quote" to generate pricing</p>
              <p className="text-sm">Based on {items.length} cutting items</p>
            </div>
          )}
        </ScrollArea>

        <div className="space-y-2 mt-4">
          <Label>Notes</Label>
          <Textarea 
            value={quoteNotes}
            onChange={(e) => setQuoteNotes(e.target.value)}
            placeholder="Add any notes or terms for this quote..."
            rows={2}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
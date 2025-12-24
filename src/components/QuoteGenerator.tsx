import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanyPricing } from "@/hooks/useCompanyPricing";
import { Sheet, calculateTotalStats } from "@/lib/sheetOptimizer";
import { supabase } from "@/integrations/supabase/client";

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

interface QuoteGeneratorProps {
  cuttingItems: CuttingItem[];
  optimizedSheets: Sheet[];
  cuttingListId?: string | null;
}

interface QuoteLineItem {
  name: string;
  pricePerUnit: number;
  unitDescription: string;
  units: number;
  linePrice: number;
}

interface HardwareEntry {
  id: string;
  quantity: number;
  custom_name: string | null;
  hardware_items: {
    id: string;
    name: string;
    price: number | null;
  } | null;
}

export const QuoteGenerator = ({ cuttingItems, optimizedSheets, cuttingListId }: QuoteGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerTaxNo, setCustomerTaxNo] = useState("");
  const [representative, setRepresentative] = useState("");
  const [dateRequired, setDateRequired] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [hardwareEntries, setHardwareEntries] = useState<HardwareEntry[]>([]);
  
  const { toast } = useToast();
  const {
    companyInfo,
    getMaterialPrice,
    getEdgingPrice,
    calculateEdgingLength,
    isLoading,
    refreshPricing,
  } = useCompanyPricing();

  useEffect(() => {
    if (isOpen) {
      refreshPricing();
      loadHardwareEntries();
      // Set default date required to today
      if (!dateRequired) {
        const today = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        setDateRequired(today);
      }
    }
  }, [isOpen, refreshPricing]);

  const loadHardwareEntries = async () => {
    if (!cuttingListId) return;
    
    try {
      const { data, error } = await supabase
        .from('hardware_entries')
        .select(`
          id,
          quantity,
          custom_name,
          hardware_items (
            id,
            name,
            price
          )
        `)
        .eq('cutting_list_id', cuttingListId);

      if (error) throw error;
      setHardwareEntries((data as HardwareEntry[]) || []);
    } catch (error) {
      console.error('Error loading hardware entries:', error);
    }
  };

  const calculateQuoteItems = (): QuoteLineItem[] => {
    const lineItems: QuoteLineItem[] = [];
    
    // Group sheets by material (get material from placed parts)
    const sheetsByMaterial = new Map<string, number>();
    optimizedSheets.forEach(sheet => {
      const primaryMaterial = sheet.parts[0]?.material || 'Unknown Material';
      const count = sheetsByMaterial.get(primaryMaterial) || 0;
      sheetsByMaterial.set(primaryMaterial, count + 1);
    });
    
    // Add material costs (sheets)
    sheetsByMaterial.forEach((count, material) => {
      const materialPrice = getMaterialPrice(material);
      const sheetDimensions = materialPrice 
        ? ` (${materialPrice.sheet_length} mm x ${materialPrice.sheet_width} mm)`
        : '';
      
      lineItems.push({
        name: `${material}${sheetDimensions}`,
        pricePerUnit: materialPrice?.price_per_sheet || 0,
        unitDescription: "Per Sheet",
        units: count,
        linePrice: count * (materialPrice?.price_per_sheet || 0),
      });
    });
    
    // Calculate edging by material
    const edgingByMaterial = new Map<string, number>();
    cuttingItems.forEach(item => {
      if (item.edging !== "None" && item.edgingMaterial) {
        const edgingLength = calculateEdgingLength(item.length, item.width, item.edging) * item.quantity;
        const existing = edgingByMaterial.get(item.edgingMaterial) || 0;
        edgingByMaterial.set(item.edgingMaterial, existing + edgingLength);
      }
    });
    
    // Add edging costs
    edgingByMaterial.forEach((totalMeters, edgingMaterial) => {
      const edgingPrice = getEdgingPrice(edgingMaterial);
      const roundedMeters = Math.round(totalMeters * 1000) / 1000;
      
      lineItems.push({
        name: edgingMaterial,
        pricePerUnit: edgingPrice?.price_per_meter || 0,
        unitDescription: "Per Meter",
        units: roundedMeters,
        linePrice: roundedMeters * (edgingPrice?.price_per_meter || 0),
      });
    });

    // Add hardware items
    hardwareEntries.forEach(entry => {
      const itemName = entry.hardware_items?.name || entry.custom_name || 'Unknown Item';
      const price = entry.hardware_items?.price || 0;
      
      lineItems.push({
        name: itemName,
        pricePerUnit: price,
        unitDescription: "Per Unit",
        units: entry.quantity,
        linePrice: entry.quantity * price,
      });
    });
    
    return lineItems;
  };

  const generateQuotePDF = () => {
    if (optimizedSheets.length === 0) {
      toast({
        title: "No optimization data",
        description: "Please run sheet optimization first.",
        variant: "destructive",
      });
      return;
    }

    const lineItems = calculateQuoteItems();
    const subtotal = lineItems.reduce((sum, item) => sum + item.linePrice, 0);
    
    const quoteDate = new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to generate the quote PDF.",
        variant: "destructive",
      });
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Quote - ${customerName || 'Customer'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 30px; 
      color: #333;
      font-size: 12px;
      line-height: 1.4;
    }
    .header { 
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }
    .quote-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .company-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .company-details {
      display: flex;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .company-details span {
      white-space: nowrap;
    }
    .client-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 20px;
    }
    .client-info {
      flex: 1;
    }
    .client-row {
      display: flex;
      margin-bottom: 5px;
    }
    .client-label {
      min-width: 120px;
      font-weight: normal;
    }
    .client-value {
      flex: 1;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th { 
      background: #f0f0f0; 
      padding: 10px 8px; 
      text-align: left;
      font-weight: bold;
      border: 1px solid #ccc;
    }
    th:nth-child(2), th:nth-child(4), th:nth-child(5) { text-align: right; }
    td { 
      padding: 8px; 
      border: 1px solid #ccc;
    }
    td:nth-child(2), td:nth-child(4), td:nth-child(5) { text-align: right; }
    .totals-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    .signature-box {
      width: 250px;
    }
    .signature-row {
      display: flex;
      margin-bottom: 15px;
    }
    .signature-label {
      min-width: 80px;
    }
    .signature-line {
      flex: 1;
      border-bottom: 1px solid #333;
      margin-left: 5px;
    }
    .totals-box {
      width: 250px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    .total-row.grand-total {
      font-weight: bold;
      font-size: 14px;
      border-top: 1px solid #333;
      margin-top: 5px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
    .company-footer {
      font-weight: bold;
      margin-bottom: 5px;
    }
    @media print {
      body { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="quote-title">Quote - ${customerName || 'Customer'}</div>
    <div class="company-name">${companyInfo?.company_name || 'Your Company'}</div>
    <div class="company-details">
      <span>Tel : +263780555268 /+263718456811</span>
      <span>Fax : www.abvzimbabwe.com</span>
    </div>
    <div class="company-details">
      <span>Email : artipelbusinessventures.com</span>
      <span>Client Tax No. : 4536A0352024</span>
    </div>
  </div>

  <div class="client-section">
    <div class="client-info">
      <div class="client-row">
        <span class="client-label">Representative :</span>
        <span class="client-value">${representative || ''}</span>
      </div>
      <div class="client-row">
        <span class="client-label">Client Cell Phone :</span>
        <span class="client-value">${customerPhone || ''}</span>
      </div>
    </div>
    <div class="client-info">
      <div class="client-row">
        <span class="client-label">Tax No. :</span>
        <span class="client-value">TIN : ${customerTaxNo || ''}</span>
      </div>
      <div class="client-row">
        <span class="client-label">Reference :</span>
        <span class="client-value"></span>
      </div>
      <div class="client-row">
        <span class="client-label">Date Required :</span>
        <span class="client-value">${dateRequired || quoteDate}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Price per Unit</th>
        <th>Unit Description</th>
        <th>Units</th>
        <th>Line Price</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>US$${item.pricePerUnit.toFixed(2)}</td>
          <td>${item.unitDescription}</td>
          <td>${item.units}</td>
          <td>US$${item.linePrice.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="signature-box">
      <div class="company-footer">${companyInfo?.company_name || 'Your Company'}</div>
      <div class="signature-row">
        <span class="signature-label">Date:</span>
        <span class="signature-line"></span>
      </div>
      <div class="signature-row">
        <span class="signature-label">Name:</span>
        <span class="signature-line"></span>
      </div>
      <div class="signature-row">
        <span class="signature-label">Signature:</span>
        <span class="signature-line"></span>
      </div>
    </div>
    <div class="totals-box">
      <div class="total-row">
        <span>Sub Total:</span>
        <span>US$${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Grand Total:</span>
        <span>US$${subtotal.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${quoteNotes ? `
    <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333;">
      <strong>Notes:</strong><br>
      ${quoteNotes.replace(/\n/g, '<br>')}
    </div>
  ` : ''}

  <div class="footer">
    <div class="company-footer">${companyInfo?.company_name || 'Your Company'}</div>
    <div>${quoteDate}</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    toast({
      title: "Quote Generated",
      description: "Your quote PDF is ready for download.",
    });
    
    setIsOpen(false);
  };

  const lineItems = optimizedSheets.length > 0 ? calculateQuoteItems() : [];
  const subtotal = lineItems.reduce((sum, item) => sum + item.linePrice, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Generate Quote
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading pricing data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Client Name</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="representative">Representative</Label>
                  <Input
                    id="representative"
                    value={representative}
                    onChange={(e) => setRepresentative(e.target.value)}
                    placeholder="Enter representative name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Cell Phone</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-tax">Tax No. (TIN)</Label>
                  <Input
                    id="customer-tax"
                    value={customerTaxNo}
                    onChange={(e) => setCustomerTaxNo(e.target.value)}
                    placeholder="Enter tax number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-required">Date Required</Label>
                  <Input
                    id="date-required"
                    value={dateRequired}
                    onChange={(e) => setDateRequired(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
            </Card>

            {/* Quote Preview */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Quote Preview</h3>
              
              {optimizedSheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Run sheet optimization first to generate a quote.</p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-right p-3 font-medium">Price per Unit</th>
                          <th className="text-center p-3 font-medium">Unit Description</th>
                          <th className="text-right p-3 font-medium">Units</th>
                          <th className="text-right p-3 font-medium">Line Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.name}</td>
                            <td className="p-3 text-right">US${item.pricePerUnit.toFixed(2)}</td>
                            <td className="p-3 text-center">{item.unitDescription}</td>
                            <td className="p-3 text-right">{item.units}</td>
                            <td className="p-3 text-right font-medium">US${item.linePrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sub Total:</span>
                        <span>US${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span className="text-primary">US${subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Notes */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Notes</h3>
              <Textarea
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Add any notes or terms..."
                rows={3}
              />
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateQuotePDF}
                disabled={optimizedSheets.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

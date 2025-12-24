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
}

interface QuoteLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export const QuoteGenerator = ({ cuttingItems, optimizedSheets }: QuoteGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [taxRate, setTaxRate] = useState(15);
  
  const { toast } = useToast();
  const {
    companyInfo,
    materialPrices,
    edgingPrices,
    getMaterialPrice,
    getEdgingPrice,
    calculateEdgingLength,
    isLoading,
    refreshPricing,
  } = useCompanyPricing();

  useEffect(() => {
    if (isOpen) refreshPricing();
  }, [isOpen, refreshPricing]);

  const calculateQuoteItems = (): QuoteLineItem[] => {
    const lineItems: QuoteLineItem[] = [];
    
    // Group sheets by material (get material from placed parts)
    const sheetsByMaterial = new Map<string, number>();
    optimizedSheets.forEach(sheet => {
      // Get the primary material from the first part on this sheet
      const primaryMaterial = sheet.parts[0]?.material || 'Unknown Material';
      const count = sheetsByMaterial.get(primaryMaterial) || 0;
      sheetsByMaterial.set(primaryMaterial, count + 1);
    });
    
    // Add material costs (sheets)
    sheetsByMaterial.forEach((count, material) => {
      const materialPrice = getMaterialPrice(material);
      if (materialPrice) {
        lineItems.push({
          description: `${material} Sheet (${materialPrice.sheet_length}x${materialPrice.sheet_width}mm)`,
          quantity: count,
          unit: "sheet",
          unitPrice: materialPrice.price_per_sheet,
          total: count * materialPrice.price_per_sheet,
        });
      } else {
        // If no price found, add with zero price
        lineItems.push({
          description: `${material} Sheet`,
          quantity: count,
          unit: "sheet",
          unitPrice: 0,
          total: 0,
        });
      }
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
      if (edgingPrice) {
        lineItems.push({
          description: `${edgingMaterial}`,
          quantity: Math.ceil(totalMeters * 100) / 100,
          unit: "m",
          unitPrice: edgingPrice.price_per_meter,
          total: totalMeters * edgingPrice.price_per_meter,
        });
      } else {
        lineItems.push({
          description: `${edgingMaterial}`,
          quantity: Math.ceil(totalMeters * 100) / 100,
          unit: "m",
          unitPrice: 0,
          total: 0,
        });
      }
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
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const stats = calculateTotalStats(optimizedSheets);
    
    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}`;
    const quoteDate = new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
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
  <title>Quote ${quoteNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px; 
      color: #333;
      line-height: 1.6;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 40px; 
      padding-bottom: 20px;
      border-bottom: 3px solid #e74c3c;
    }
    .company-info { flex: 1; }
    .company-logo { 
      max-width: 180px; 
      max-height: 80px; 
      object-fit: contain;
      margin-bottom: 10px;
    }
    .company-name { 
      font-size: 28px; 
      font-weight: bold; 
      color: #e74c3c;
      margin-bottom: 5px;
    }
    .quote-title-section { text-align: right; }
    .quote-title { 
      font-size: 36px; 
      font-weight: bold; 
      color: #333;
      margin-bottom: 10px;
    }
    .quote-number { 
      font-size: 14px; 
      color: #666;
      background: #f5f5f5;
      padding: 8px 15px;
      border-radius: 4px;
      display: inline-block;
    }
    .meta-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    .meta-box {
      flex: 1;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #e74c3c;
    }
    .meta-box h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .meta-box p {
      font-size: 14px;
      margin: 5px 0;
    }
    .meta-box strong { color: #333; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 30px 0;
    }
    th { 
      background: #e74c3c; 
      color: white; 
      padding: 15px 12px; 
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:last-child, td:last-child { text-align: right; }
    td { 
      padding: 15px 12px; 
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    tr:nth-child(even) { background: #fafafa; }
    tr:hover { background: #fff5f5; }
    .summary-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }
    .project-summary {
      flex: 1;
      background: #f0f7ff;
      padding: 20px;
      border-radius: 8px;
      margin-right: 30px;
    }
    .project-summary h4 {
      color: #2c5282;
      margin-bottom: 15px;
      font-size: 14px;
      text-transform: uppercase;
    }
    .project-summary p {
      font-size: 13px;
      margin: 5px 0;
      color: #4a5568;
    }
    .totals { 
      width: 320px;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }
    .totals-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 10px 0;
      font-size: 14px;
    }
    .totals-row.subtotal { border-bottom: 1px solid #ddd; }
    .totals-row.total { 
      font-size: 20px; 
      font-weight: bold;
      color: #e74c3c;
      border-top: 2px solid #e74c3c;
      margin-top: 10px;
      padding-top: 15px;
    }
    .notes-section {
      margin-top: 40px;
      padding: 20px;
      background: #fffef0;
      border-radius: 8px;
      border-left: 4px solid #f0c36d;
    }
    .notes-section h4 {
      color: #8b6914;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .notes-section p {
      font-size: 13px;
      color: #666;
    }
    .footer { 
      margin-top: 50px; 
      text-align: center; 
      font-size: 12px; 
      color: #888;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .footer p { margin: 5px 0; }
    @media print {
      body { padding: 20px; }
      .header { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${companyInfo?.company_logo_url ? `<img src="${companyInfo.company_logo_url}" alt="Company Logo" class="company-logo" />` : ''}
      <div class="company-name">${companyInfo?.company_name || 'Your Company'}</div>
    </div>
    <div class="quote-title-section">
      <div class="quote-title">QUOTATION</div>
      <div class="quote-number">${quoteNumber}</div>
    </div>
  </div>

  <div class="meta-section">
    <div class="meta-box">
      <h3>Quote To</h3>
      <p><strong>${customerName || 'Customer Name'}</strong></p>
      ${customerPhone ? `<p>Phone: ${customerPhone}</p>` : ''}
      ${customerEmail ? `<p>Email: ${customerEmail}</p>` : ''}
    </div>
    <div class="meta-box">
      <h3>Quote Details</h3>
      <p><strong>Date:</strong> ${quoteDate}</p>
      <p><strong>Valid Until:</strong> ${validUntil}</p>
      <p><strong>Total Items:</strong> ${cuttingItems.length}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%">Description</th>
        <th style="width: 15%">Quantity</th>
        <th style="width: 10%">Unit</th>
        <th style="width: 12%">Unit Price</th>
        <th style="width: 13%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${item.unit}</td>
          <td>$${item.unitPrice.toFixed(2)}</td>
          <td>$${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary-section">
    <div class="project-summary">
      <h4>Project Summary</h4>
      <p><strong>Total Sheets:</strong> ${stats.totalSheets}</p>
      <p><strong>Total Area:</strong> ${(stats.totalArea / 1000000).toFixed(2)} m²</p>
      <p><strong>Material Usage:</strong> ${(100 - stats.averageWastePercentage).toFixed(1)}%</p>
      <p><strong>Waste:</strong> ${stats.averageWastePercentage.toFixed(1)}%</p>
    </div>
    <div class="totals">
      <div class="totals-row subtotal">
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Tax (${taxRate}%)</span>
        <span>$${taxAmount.toFixed(2)}</span>
      </div>
      <div class="totals-row total">
        <span>TOTAL</span>
        <span>$${total.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${quoteNotes ? `
    <div class="notes-section">
      <h4>Notes</h4>
      <p>${quoteNotes.replace(/\n/g, '<br>')}</p>
    </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business</p>
    <p>This quote is valid for 30 days from the date of issue</p>
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
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

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
              <h3 className="font-semibold mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email"
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
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-right p-3 font-medium">Qty</th>
                          <th className="text-center p-3 font-medium">Unit</th>
                          <th className="text-right p-3 font-medium">Unit Price</th>
                          <th className="text-right p-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-center">{item.unit}</td>
                            <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-3 text-right font-medium">${item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center gap-2">
                        <span>Tax:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            className="w-16 h-7 text-right"
                            min={0}
                            max={100}
                          />
                          <span>%</span>
                        </div>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
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

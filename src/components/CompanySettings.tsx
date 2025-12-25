import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Image, DollarSign, Scissors, Save, Plus, Trash2, Settings, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MaterialPrice {
  id?: string;
  material_name: string;
  price_per_sheet: number;
  cost_per_sheet: number;
  sheet_length: number;
  sheet_width: number;
}

interface EdgingPrice {
  id?: string;
  edging_name: string;
  price_per_meter: number;
  cost_per_meter: number;
}

interface CompanyInfo {
  company_name: string;
  company_logo_url: string;
  company_tel: string;
  company_fax: string;
  company_email: string;
  company_tax_no: string;
  company_address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  quote_validity_days: number;
}

export const CompanySettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Company info
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: "",
    company_logo_url: "",
    company_tel: "",
    company_fax: "",
    company_email: "",
    company_tax_no: "",
    company_address: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_branch: "",
    quote_validity_days: 30,
  });

  // Material prices
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [newMaterial, setNewMaterial] = useState<MaterialPrice>({
    material_name: "",
    price_per_sheet: 0,
    cost_per_sheet: 0,
    sheet_length: 2750,
    sheet_width: 1830,
  });

  // Edging prices
  const [edgingPrices, setEdgingPrices] = useState<EdgingPrice[]>([]);
  const [newEdging, setNewEdging] = useState<EdgingPrice>({
    edging_name: "",
    price_per_meter: 0,
    cost_per_meter: 0,
  });

  // Bulk entry state
  const [bulkPrice, setBulkPrice] = useState({ price_per_sheet: 0, cost_per_sheet: 0 });
  
  // Common board colors for bulk entry (excluding white, glass, postform, masonite, granite)
  const bulkColorList = [
    "Beech", "Oak", "Cherry", "Walnut", "Mahogany", "Sapele", "Wenge", "Teak",
    "Ash", "Maple", "Birch", "Pine", "Cedar", "Black", "Grey", "Charcoal",
    "Cream", "Ivory", "Beige", "Sand", "Cappuccino", "Mocca", "Tobacco",
    "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Burgundy",
    "Anthracite", "Graphite", "Silver", "Aluminium", "Bronze"
  ];
  
  // Excluded keywords (case-insensitive matching)
  const excludedKeywords = ["white", "glass", "postform", "masonite", "granite"];

  useEffect(() => {
    if (isOpen) {
      fetchIpAddress();
    }
  }, [isOpen]);

  useEffect(() => {
    if (ipAddress) {
      loadSettings();
    }
  }, [ipAddress]);

  const fetchIpAddress = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setIpAddress(data.ip);
    } catch (err) {
      console.error("Failed to fetch IP:", err);
      toast.error("Failed to fetch IP address");
    }
  };

  const loadSettings = async () => {
    if (!ipAddress) return;
    setIsLoading(true);

    try {
      // Load company info
      const { data: companyData } = await supabase
        .from("ip_company_settings")
        .select("*")
        .eq("ip_address", ipAddress)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyData) {
        setCompanyInfo({
          company_name: companyData.company_name || "",
          company_logo_url: companyData.company_logo_url || "",
          company_tel: companyData.company_tel || "",
          company_fax: companyData.company_fax || "",
          company_email: companyData.company_email || "",
          company_tax_no: companyData.company_tax_no || "",
          company_address: companyData.company_address || "",
          bank_name: companyData.bank_name || "",
          bank_account_name: companyData.bank_account_name || "",
          bank_account_number: companyData.bank_account_number || "",
          bank_branch: companyData.bank_branch || "",
          quote_validity_days: companyData.quote_validity_days ?? 30,
        });
      }

      // Load material prices
      const { data: materialsData } = await supabase
        .from("ip_material_prices")
        .select("*")
        .eq("ip_address", ipAddress);

      if (materialsData) {
        setMaterialPrices(materialsData);
      }

      // Load edging prices
      const { data: edgingData } = await supabase
        .from("ip_edging_prices")
        .select("*")
        .eq("ip_address", ipAddress);

      if (edgingData) {
        setEdgingPrices(edgingData);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCompanyInfo = async () => {
    if (!ipAddress) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("ip_company_settings")
        .upsert({
          ip_address: ipAddress,
          company_name: companyInfo.company_name,
          company_logo_url: companyInfo.company_logo_url,
          company_tel: companyInfo.company_tel,
          company_fax: companyInfo.company_fax,
          company_email: companyInfo.company_email,
          company_tax_no: companyInfo.company_tax_no,
          company_address: companyInfo.company_address,
          bank_name: companyInfo.bank_name,
          bank_account_name: companyInfo.bank_account_name,
          bank_account_number: companyInfo.bank_account_number,
          bank_branch: companyInfo.bank_branch,
          quote_validity_days: companyInfo.quote_validity_days,
        }, { onConflict: "ip_address" });

      if (error) throw error;
      toast.success("Company info saved");
    } catch (err) {
      console.error("Error saving company info:", err);
      toast.error("Failed to save company info");
    } finally {
      setIsSaving(false);
    }
  };

  const addMaterialPrice = async () => {
    if (!ipAddress || !newMaterial.material_name) {
      toast.error("Please enter a material name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ip_material_prices")
        .insert({
          ip_address: ipAddress,
          ...newMaterial,
        })
        .select()
        .single();

      if (error) throw error;

      setMaterialPrices([...materialPrices, data]);
      setNewMaterial({
        material_name: "",
        price_per_sheet: 0,
        cost_per_sheet: 0,
        sheet_length: 2750,
        sheet_width: 1830,
      });
      toast.success("Material price added");
    } catch (err: any) {
      console.error("Error adding material:", err);
      if (err.code === "23505") {
        toast.error("This material already exists");
      } else {
        toast.error("Failed to add material");
      }
    }
  };

  const updateMaterialPrice = async (material: MaterialPrice) => {
    if (!material.id) return;

    try {
      const { error } = await supabase
        .from("ip_material_prices")
        .update({
          price_per_sheet: material.price_per_sheet,
          cost_per_sheet: material.cost_per_sheet,
          sheet_length: material.sheet_length,
          sheet_width: material.sheet_width,
        })
        .eq("id", material.id);

      if (error) throw error;
      toast.success("Material price updated");
    } catch (err) {
      console.error("Error updating material:", err);
      toast.error("Failed to update material");
    }
  };

  const deleteMaterialPrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ip_material_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMaterialPrices(materialPrices.filter((m) => m.id !== id));
      toast.success("Material price deleted");
    } catch (err) {
      console.error("Error deleting material:", err);
      toast.error("Failed to delete material");
    }
  };

  const applyBulkPricing = async () => {
    if (!ipAddress) return;
    if (bulkPrice.price_per_sheet <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      const materialsToAdd = bulkColorList.map(color => ({
        ip_address: ipAddress,
        material_name: color,
        price_per_sheet: bulkPrice.price_per_sheet,
        cost_per_sheet: bulkPrice.cost_per_sheet,
        sheet_length: 2750,
        sheet_width: 1830,
      }));

      const { data, error } = await supabase
        .from("ip_material_prices")
        .upsert(materialsToAdd, { onConflict: "ip_address,material_name" })
        .select();

      if (error) throw error;

      await loadSettings();
      toast.success(`Applied bulk pricing to ${bulkColorList.length} colors`);
    } catch (err) {
      console.error("Error applying bulk pricing:", err);
      toast.error("Failed to apply bulk pricing");
    }
  };

  const isExcludedMaterial = (name: string): boolean => {
    const lowerName = name.toLowerCase();
    return excludedKeywords.some(keyword => lowerName.includes(keyword));
  };

  const addEdgingPrice = async () => {
    if (!ipAddress || !newEdging.edging_name) {
      toast.error("Please enter an edging name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ip_edging_prices")
        .insert({
          ip_address: ipAddress,
          ...newEdging,
        })
        .select()
        .single();

      if (error) throw error;

      setEdgingPrices([...edgingPrices, data]);
      setNewEdging({
        edging_name: "",
        price_per_meter: 0,
        cost_per_meter: 0,
      });
      toast.success("Edging price added");
    } catch (err: any) {
      console.error("Error adding edging:", err);
      if (err.code === "23505") {
        toast.error("This edging already exists");
      } else {
        toast.error("Failed to add edging");
      }
    }
  };

  const updateEdgingPrice = async (edging: EdgingPrice) => {
    if (!edging.id) return;

    try {
      const { error } = await supabase
        .from("ip_edging_prices")
        .update({
          price_per_meter: edging.price_per_meter,
          cost_per_meter: edging.cost_per_meter,
        })
        .eq("id", edging.id);

      if (error) throw error;
      toast.success("Edging price updated");
    } catch (err) {
      console.error("Error updating edging:", err);
      toast.error("Failed to update edging");
    }
  };

  const deleteEdgingPrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ip_edging_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEdgingPrices(edgingPrices.filter((e) => e.id !== id));
      toast.success("Edging price deleted");
    } catch (err) {
      console.error("Error deleting edging:", err);
      toast.error("Failed to delete edging");
    }
  };

  const handleMaterialCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ipAddress) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        // Skip header row if it contains text headers
        const startIndex = lines[0].toLowerCase().includes("material") ? 1 : 0;
        
        const newMaterials: MaterialPrice[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
          if (values.length >= 2) {
            newMaterials.push({
              material_name: values[0],
              price_per_sheet: parseFloat(values[1]) || 0,
              cost_per_sheet: parseFloat(values[2]) || 0,
              sheet_length: parseInt(values[3]) || 2750,
              sheet_width: parseInt(values[4]) || 1830,
            });
          }
        }

        if (newMaterials.length === 0) {
          toast.error("No valid materials found in CSV");
          return;
        }

        // Insert all materials
        const { data, error } = await supabase
          .from("ip_material_prices")
          .upsert(
            newMaterials.map(m => ({ ...m, ip_address: ipAddress })),
            { onConflict: "ip_address,material_name" }
          )
          .select();

        if (error) throw error;

        await loadSettings();
        toast.success(`Imported ${newMaterials.length} materials`);
      } catch (err) {
        console.error("Error importing CSV:", err);
        toast.error("Failed to import CSV");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleEdgingCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ipAddress) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        // Skip header row if it contains text headers
        const startIndex = lines[0].toLowerCase().includes("edging") ? 1 : 0;
        
        const newEdgings: EdgingPrice[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
          if (values.length >= 2) {
            newEdgings.push({
              edging_name: values[0],
              price_per_meter: parseFloat(values[1]) || 0,
              cost_per_meter: parseFloat(values[2]) || 0,
            });
          }
        }

        if (newEdgings.length === 0) {
          toast.error("No valid edging found in CSV");
          return;
        }

        // Insert all edgings
        const { data, error } = await supabase
          .from("ip_edging_prices")
          .upsert(
            newEdgings.map(ed => ({ ...ed, ip_address: ipAddress })),
            { onConflict: "ip_address,edging_name" }
          )
          .select();

        if (error) throw error;

        await loadSettings();
        toast.success(`Imported ${newEdgings.length} edging prices`);
      } catch (err) {
        console.error("Error importing CSV:", err);
        toast.error("Failed to import CSV");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const downloadMaterialTemplate = () => {
    const csv = "material_name,price_per_sheet,cost_per_sheet,sheet_length,sheet_width\nWhite Melamine,50,35,2750,1830\nColorboard TBA,65,45,2750,1830";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "material_prices_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadEdgingTemplate = () => {
    const csv = "edging_name,price_per_meter,cost_per_meter\nWhite,2.5,1.5\nColor,3.0,2.0";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edging_prices_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          My Pricing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings & Pricing
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="materials" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="edging" className="gap-2">
                <Scissors className="h-4 w-4" />
                Edging
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                  <CardDescription>
                    This information will appear on your quotes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={companyInfo.company_name}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, company_name: e.target.value })
                      }
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={companyInfo.company_logo_url}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, company_logo_url: e.target.value })
                      }
                      placeholder="https://example.com/logo.png"
                    />
                    {companyInfo.company_logo_url && (
                      <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                        <Label className="text-sm text-muted-foreground mb-2 block">Preview:</Label>
                        <img
                          src={companyInfo.company_logo_url}
                          alt="Company Logo"
                          className="max-h-20 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telephone</Label>
                      <Input
                        value={companyInfo.company_tel}
                        onChange={(e) =>
                          setCompanyInfo({ ...companyInfo, company_tel: e.target.value })
                        }
                        placeholder="+263 780 555 268"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fax / Website</Label>
                      <Input
                        value={companyInfo.company_fax}
                        onChange={(e) =>
                          setCompanyInfo({ ...companyInfo, company_fax: e.target.value })
                        }
                        placeholder="www.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={companyInfo.company_email}
                        onChange={(e) =>
                          setCompanyInfo({ ...companyInfo, company_email: e.target.value })
                        }
                        placeholder="info@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Number</Label>
                      <Input
                        value={companyInfo.company_tax_no}
                        onChange={(e) =>
                          setCompanyInfo({ ...companyInfo, company_tax_no: e.target.value })
                        }
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Address</Label>
                    <Input
                      value={companyInfo.company_address}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, company_address: e.target.value })
                      }
                      placeholder="123 Main Street, Harare, Zimbabwe"
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Banking Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={companyInfo.bank_name}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, bank_name: e.target.value })
                          }
                          placeholder="First Bank"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input
                          value={companyInfo.bank_account_name}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, bank_account_name: e.target.value })
                          }
                          placeholder="Your Company Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={companyInfo.bank_account_number}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, bank_account_number: e.target.value })
                          }
                          placeholder="1234567890"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input
                          value={companyInfo.bank_branch}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, bank_branch: e.target.value })
                          }
                          placeholder="Main Branch"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Quote Settings</h4>
                    <div className="space-y-2">
                      <Label>Quote Validity (Days)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={companyInfo.quote_validity_days}
                        onChange={(e) =>
                          setCompanyInfo({ ...companyInfo, quote_validity_days: parseInt(e.target.value) || 30 })
                        }
                        placeholder="30"
                      />
                      <p className="text-xs text-muted-foreground">Number of days the quote remains valid</p>
                    </div>
                  </div>
                  
                  <Button onClick={saveCompanyInfo} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Company Info
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Material Prices</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadMaterialTemplate} className="gap-1">
                        <Download className="h-3 w-3" />
                        Template
                      </Button>
                      <label>
                        <Button variant="outline" size="sm" className="gap-1 cursor-pointer" asChild>
                          <span>
                            <Upload className="h-3 w-3" />
                            Import CSV
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleMaterialCSVUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </CardTitle>
                  <CardDescription>Set prices per sheet for each material, or use bulk entry for all colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bulk Entry Section */}
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <h4 className="font-medium mb-2 text-sm">Bulk Entry - All Colors (except White, Glass, Postform, Masonite, Granite)</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Set one price for all standard board colors. You can correct individual prices below after.
                    </p>
                    <div className="flex gap-3 items-end flex-wrap">
                      <div>
                        <Label className="text-xs">Price/Sheet</Label>
                        <Input
                          type="number"
                          value={bulkPrice.price_per_sheet || ""}
                          onChange={(e) =>
                            setBulkPrice({ ...bulkPrice, price_per_sheet: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-28 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cost/Sheet</Label>
                        <Input
                          type="number"
                          value={bulkPrice.cost_per_sheet || ""}
                          onChange={(e) =>
                            setBulkPrice({ ...bulkPrice, cost_per_sheet: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-28 text-sm"
                        />
                      </div>
                      <Button onClick={applyBulkPricing} size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        Apply to All Colors
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Colors: {bulkColorList.slice(0, 8).join(", ")}... and {bulkColorList.length - 8} more
                    </p>
                  </div>

                  {/* Add new material */}
                  <div className="grid grid-cols-6 gap-2 items-end border-b pb-4">
                    <div className="col-span-2">
                      <Label className="text-xs">Material Name</Label>
                      <Input
                        value={newMaterial.material_name}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, material_name: e.target.value })
                        }
                        placeholder="Material name"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price/Sheet</Label>
                      <Input
                        type="number"
                        value={newMaterial.price_per_sheet}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, price_per_sheet: parseFloat(e.target.value) || 0 })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cost/Sheet</Label>
                      <Input
                        type="number"
                        value={newMaterial.cost_per_sheet}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, cost_per_sheet: parseFloat(e.target.value) || 0 })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Size (LxW)</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={newMaterial.sheet_length}
                          onChange={(e) =>
                            setNewMaterial({ ...newMaterial, sheet_length: parseInt(e.target.value) || 2750 })
                          }
                          className="text-sm w-16"
                          placeholder="L"
                        />
                        <Input
                          type="number"
                          value={newMaterial.sheet_width}
                          onChange={(e) =>
                            setNewMaterial({ ...newMaterial, sheet_width: parseInt(e.target.value) || 1830 })
                          }
                          className="text-sm w-16"
                          placeholder="W"
                        />
                      </div>
                    </div>
                    <Button onClick={addMaterialPrice} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {/* Material list */}
                  {materialPrices.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Price/Sheet</TableHead>
                          <TableHead>Cost/Sheet</TableHead>
                          <TableHead>Size (LxW)</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialPrices.map((material) => (
                          <TableRow key={material.id}>
                            <TableCell className="font-medium">{material.material_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={material.price_per_sheet}
                                onChange={(e) => {
                                  const updated = {
                                    ...material,
                                    price_per_sheet: parseFloat(e.target.value) || 0,
                                  };
                                  setMaterialPrices(
                                    materialPrices.map((m) => (m.id === material.id ? updated : m))
                                  );
                                }}
                                onBlur={() => {
                                  const latest = materialPrices.find((m) => m.id === material.id);
                                  if (latest) updateMaterialPrice(latest);
                                }}
                                className="w-24 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={material.cost_per_sheet}
                                onChange={(e) => {
                                  const updated = {
                                    ...material,
                                    cost_per_sheet: parseFloat(e.target.value) || 0,
                                  };
                                  setMaterialPrices(
                                    materialPrices.map((m) => (m.id === material.id ? updated : m))
                                  );
                                }}
                                onBlur={() => {
                                  const latest = materialPrices.find((m) => m.id === material.id);
                                  if (latest) updateMaterialPrice(latest);
                                }}
                                className="w-24 text-sm"
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {material.sheet_length} x {material.sheet_width}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMaterialPrice(material.id!)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No material prices configured yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edging" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Edging Prices</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadEdgingTemplate} className="gap-1">
                        <Download className="h-3 w-3" />
                        Template
                      </Button>
                      <label>
                        <Button variant="outline" size="sm" className="gap-1 cursor-pointer" asChild>
                          <span>
                            <Upload className="h-3 w-3" />
                            Import CSV
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleEdgingCSVUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </CardTitle>
                  <CardDescription>Set prices per meter for each edging type, or import from CSV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add new edging */}
                  <div className="grid grid-cols-4 gap-2 items-end border-b pb-4">
                    <div>
                      <Label className="text-xs">Edging Name</Label>
                      <Input
                        value={newEdging.edging_name}
                        onChange={(e) =>
                          setNewEdging({ ...newEdging, edging_name: e.target.value })
                        }
                        placeholder="Edging name"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price/Meter</Label>
                      <Input
                        type="number"
                        value={newEdging.price_per_meter}
                        onChange={(e) =>
                          setNewEdging({ ...newEdging, price_per_meter: parseFloat(e.target.value) || 0 })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cost/Meter</Label>
                      <Input
                        type="number"
                        value={newEdging.cost_per_meter}
                        onChange={(e) =>
                          setNewEdging({ ...newEdging, cost_per_meter: parseFloat(e.target.value) || 0 })
                        }
                        className="text-sm"
                      />
                    </div>
                    <Button onClick={addEdgingPrice} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {/* Edging list */}
                  {edgingPrices.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Edging</TableHead>
                          <TableHead>Price/Meter</TableHead>
                          <TableHead>Cost/Meter</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {edgingPrices.map((edging) => (
                          <TableRow key={edging.id}>
                            <TableCell className="font-medium">{edging.edging_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={edging.price_per_meter}
                                onChange={(e) => {
                                  const updated = {
                                    ...edging,
                                    price_per_meter: parseFloat(e.target.value) || 0,
                                  };
                                  setEdgingPrices(
                                    edgingPrices.map((ed) => (ed.id === edging.id ? updated : ed))
                                  );
                                }}
                                onBlur={() => {
                                  const latest = edgingPrices.find((ed) => ed.id === edging.id);
                                  if (latest) updateEdgingPrice(latest);
                                }}
                                className="w-24 text-sm"
                              />
...
                              <Input
                                type="number"
                                value={edging.cost_per_meter}
                                onChange={(e) => {
                                  const updated = {
                                    ...edging,
                                    cost_per_meter: parseFloat(e.target.value) || 0,
                                  };
                                  setEdgingPrices(
                                    edgingPrices.map((ed) => (ed.id === edging.id ? updated : ed))
                                  );
                                }}
                                onBlur={() => {
                                  const latest = edgingPrices.find((ed) => ed.id === edging.id);
                                  if (latest) updateEdgingPrice(latest);
                                }}
                                className="w-24 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteEdgingPrice(edging.id!)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No edging prices configured yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

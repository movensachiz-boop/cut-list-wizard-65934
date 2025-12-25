import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MaterialPrice {
  material_name: string;
  price_per_sheet: number;
  cost_per_sheet: number;
  sheet_length: number;
  sheet_width: number;
}

interface EdgingPrice {
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

export const useCompanyPricing = () => {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [edgingPrices, setEdgingPrices] = useState<EdgingPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIpAddress();
  }, []);

  useEffect(() => {
    if (ipAddress) {
      loadPricing();
    }
  }, [ipAddress]);

  const fetchIpAddress = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setIpAddress(data.ip);
    } catch (err) {
      console.error("Failed to fetch IP:", err);
      setIsLoading(false);
    }
  };

  const loadPricing = useCallback(async () => {
    if (!ipAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Load company info (if it exists)
      const { data: companyData, error: companyError } = await supabase
        .from("ip_company_settings")
        .select("*")
        .eq("ip_address", ipAddress)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyError) {
        console.error("Error loading company settings:", companyError);
      }

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
      } else {
        setCompanyInfo(null);
      }

      // Load material + edging prices (even if company settings is missing)
      const [materialsRes, edgingRes] = await Promise.all([
        supabase.from("ip_material_prices").select("*").eq("ip_address", ipAddress),
        supabase.from("ip_edging_prices").select("*").eq("ip_address", ipAddress),
      ]);

      if (materialsRes.error) {
        console.error("Error loading material prices:", materialsRes.error);
        setMaterialPrices([]);
      } else {
        setMaterialPrices(materialsRes.data ?? []);
      }

      if (edgingRes.error) {
        console.error("Error loading edging prices:", edgingRes.error);
        setEdgingPrices([]);
      } else {
        setEdgingPrices(edgingRes.data ?? []);
      }
    } catch (err) {
      console.error("Error loading pricing:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ipAddress]);

  const getMaterialPrice = (materialName: string): MaterialPrice | null => {
    const searchName = materialName.toLowerCase().trim();
    
    // Try exact match first
    let match = materialPrices.find(
      (m) => m.material_name.toLowerCase().trim() === searchName
    );
    
    // Try partial match (material name contains search or search contains material name)
    if (!match) {
      match = materialPrices.find(
        (m) => m.material_name.toLowerCase().includes(searchName) || 
               searchName.includes(m.material_name.toLowerCase())
      );
    }
    
    // Try word-by-word match (e.g., "Beige Melamine" should match "Beige")
    if (!match) {
      const searchWords = searchName.split(/\s+/);
      match = materialPrices.find((m) => {
        const priceName = m.material_name.toLowerCase().trim();
        return searchWords.some(word => word === priceName || priceName.includes(word));
      });
    }
    
    return match || null;
  };

  const getEdgingPrice = (edgingName: string): EdgingPrice | null => {
    const searchName = edgingName.toLowerCase().trim();
    
    // Try exact match first
    let match = edgingPrices.find(
      (e) => e.edging_name.toLowerCase().trim() === searchName
    );
    
    // Try partial match
    if (!match) {
      match = edgingPrices.find(
        (e) => e.edging_name.toLowerCase().includes(searchName) || 
               searchName.includes(e.edging_name.toLowerCase())
      );
    }
    
    return match || null;
  };

  const calculateEdgingLength = (
    length: number,
    width: number,
    edgingType: string
  ): number => {
    // Convert mm to meters
    const lengthM = length / 1000;
    const widthM = width / 1000;

    switch (edgingType) {
      case "None":
        return 0;
      case "1 Long":
        return lengthM;
      case "2 Long":
        return lengthM * 2;
      case "1 Short":
        return widthM;
      case "2 Short":
        return widthM * 2;
      case "All Round":
        return (lengthM * 2) + (widthM * 2);
      case "1 Long 1 Short":
        return lengthM + widthM;
      case "2 Long 1 Short":
        return (lengthM * 2) + widthM;
      case "1 Long 2 Short":
        return lengthM + (widthM * 2);
      default:
        return 0;
    }
  };

  return {
    ipAddress,
    companyInfo,
    materialPrices,
    edgingPrices,
    isLoading,
    getMaterialPrice,
    getEdgingPrice,
    calculateEdgingLength,
    refreshPricing: loadPricing,
  };
};

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
    if (!ipAddress) return;

    try {
      // Load company info
      const { data: companyData } = await supabase
        .from("ip_company_settings")
        .select("*")
        .eq("ip_address", ipAddress)
        .single();

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

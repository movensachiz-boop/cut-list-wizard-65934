import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LicenseGateProps {
  children: React.ReactNode;
}

export const LicenseGate = ({ children }: LicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<{
    company_name: string;
    expiry_date: string;
  } | null>(null);

  useEffect(() => {
    checkStoredLicense();
  }, []);

  const checkStoredLicense = async () => {
    const stored = localStorage.getItem("app_license");
    if (!stored) {
      setIsValidating(false);
      return;
    }

    try {
      const data = JSON.parse(stored);
      const isValid = await validateLicense(data.license_key);
      if (!isValid) {
        localStorage.removeItem("app_license");
      }
    } catch {
      localStorage.removeItem("app_license");
    }
    setIsValidating(false);
  };

  const validateLicense = async (key: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'validate', license_key: key }
      });

      if (error) throw error;

      if (data.valid) {
        setIsLicenseValid(true);
        setLicenseInfo({
          company_name: data.company_name,
          expiry_date: data.expiry_date
        });
        localStorage.setItem("app_license", JSON.stringify({
          license_key: key,
          company_name: data.company_name,
          expiry_date: data.expiry_date,
          validated_at: new Date().toISOString()
        }));
        return true;
      } else {
        toast.error(data.error || "Invalid license");
        return false;
      }
    } catch (err) {
      console.error('License validation error:', err);
      toast.error("Failed to validate license");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    setIsValidating(true);
    await validateLicense(licenseKey.trim());
    setIsValidating(false);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Validating License...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isLicenseValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">License Activation Required</CardTitle>
            <CardDescription>Enter your license key to access the application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="SRL-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="text-center font-mono"
                  autoFocus
                  maxLength={18}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Contact your administrator for a license key
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isValidating}>
                {isValidating ? "Validating..." : "Activate License"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {licenseInfo && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center">
          <p className="text-sm text-foreground">
            Licensed to: <span className="font-semibold">{licenseInfo.company_name}</span> | 
            Expires: <span className="font-semibold">{new Date(licenseInfo.expiry_date).toLocaleDateString()}</span>
          </p>
        </div>
      )}
      {children}
    </>
  );
};
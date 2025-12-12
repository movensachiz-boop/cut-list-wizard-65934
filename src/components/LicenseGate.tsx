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
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    checkStoredLicense();
    
    // Re-validate license every 1 second to catch blocks immediately
    const interval = setInterval(() => {
      if (isLicenseValid) {
        checkStoredLicense();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLicenseValid]);

  // Handle logout countdown
  useEffect(() => {
    if (logoutCountdown === null) return;
    
    if (logoutCountdown <= 0) {
      // Force logout
      setIsLicenseValid(false);
      setLicenseInfo(null);
      localStorage.removeItem("app_license");
      setLogoutCountdown(null);
      return;
    }
    
    const timer = setTimeout(() => {
      setLogoutCountdown(logoutCountdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [logoutCountdown]);

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
        // Clear any logout countdown if license becomes valid
        setLogoutCountdown(null);
        return true;
      } else {
        // Check if IP is blocked - IMMEDIATE redirect, no countdown
        if (data.blocked) {
          localStorage.removeItem("app_license");
          setLicenseInfo(null);
          setIsLicenseValid(false);
          setLogoutCountdown(null);
          setIsBlocked(true);
          toast.error("Your IP has been blocked");
          return false;
        }
        
        // Check if in grace period (5-second countdown before block)
        if (data.grace_period) {
          if (logoutCountdown === null) {
            toast.error(data.reason ? `Access revoked: ${data.reason}` : "Your access is being revoked");
          }
          setLogoutCountdown(data.seconds_remaining || 5);
          return false;
        }
        
        // License is invalid/suspended - start 5-second countdown
        if (isLicenseValid) {
          // Only show countdown if we were previously valid (to avoid showing on initial load)
          toast.error(data.error || "License is no longer valid - logging out in 5 seconds");
          setLogoutCountdown(5);
        } else {
          // First time validation failed
          setIsLicenseValid(false);
          setLicenseInfo(null);
          localStorage.removeItem("app_license");
          toast.error(data.error || "Invalid license");
        }
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

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
            <CardDescription>Your access has been blocked. Please contact your administrator.</CardDescription>
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
                  className="text-center font-mono text-lg tracking-wider px-4"
                  autoFocus
                  maxLength={19}
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

  const getDaysRemaining = () => {
    if (!licenseInfo) return 0;
    const now = new Date();
    const expiry = new Date(licenseInfo.expiry_date);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  // Debug logging
  console.log('License Gate - isLicenseValid:', isLicenseValid);
  console.log('License Gate - licenseInfo:', licenseInfo);
  console.log('License Gate - daysRemaining:', daysRemaining);

  return (
    <>
      {/* Warning banner during logout countdown */}
      {logoutCountdown !== null && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive border-b border-destructive py-3 px-4 text-center animate-pulse">
          <p className="text-sm font-bold text-destructive-foreground">
            ⚠️ LICENSE INVALID - Logging out in {logoutCountdown} second{logoutCountdown !== 1 ? 's' : ''}...
          </p>
        </div>
      )}
      
      {/* Regular license info banner */}
      {licenseInfo && logoutCountdown === null && (
        <div 
          className={`fixed top-0 left-0 right-0 z-50 border-b py-3 px-4 text-center ${
            isExpired ? 'bg-destructive/20 border-destructive' : 
            isExpiringSoon ? 'bg-orange-500/20 border-orange-500' : 
            'bg-primary/20 border-primary'
          }`}
          style={{ minHeight: '48px' }}
        >
          <p className="text-sm font-medium">
            Licensed to: <span className="font-bold">{licenseInfo.company_name}</span> | 
            Expires: <span className="font-bold">{new Date(licenseInfo.expiry_date).toLocaleDateString()}</span> | 
            <span className={`font-bold text-lg ${
              isExpired ? 'text-destructive' : 
              isExpiringSoon ? 'text-orange-600' : 
              'text-foreground'
            }`}>
              {isExpired ? '⚠️ EXPIRED' : `⏱️ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
            </span>
          </p>
        </div>
      )}
      
      <div style={{ paddingTop: (licenseInfo || logoutCountdown !== null) ? '48px' : '0' }}>
        {children}
      </div>
    </>
  );
};
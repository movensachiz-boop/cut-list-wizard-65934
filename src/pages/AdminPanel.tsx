import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Plus, Ban, Trash2, Key, Calendar, Building, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface License {
  id: string;
  company_name: string;
  license_key: string;
  api_key: string;
  status: 'active' | 'suspended' | 'expired' | 'trial';
  created_at: string;
  expiry_date: string;
  notes: string | null;
  suspended_reason: string | null;
}

interface Stats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  expired: number;
}

const AdminPanel = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, trial: 0, suspended: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState<'active' | 'trial'>('trial');
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login first");
        return;
      }

      // Check if user is admin
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!userRole) {
        toast.error("Access denied - Admin only");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await loadLicenses();
      await loadStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error("Failed to verify admin access");
    } finally {
      setLoading(false);
    }
  };

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setLicenses(data.licenses);
    } catch (error) {
      console.error('Error loading licenses:', error);
      toast.error("Failed to load licenses");
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'stats' }
      });

      if (error) throw error;
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateLicense = async () => {
    if (!companyName || !expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: {
          action: 'create',
          company_name: companyName,
          expiry_date: expiryDate,
          status,
          notes: notes || null,
        }
      });

      if (error) throw error;

      toast.success("License created successfully");
      setShowAddDialog(false);
      setCompanyName("");
      setExpiryDate("");
      setStatus('trial');
      setNotes("");
      await loadLicenses();
      await loadStats();
    } catch (error) {
      console.error('Error creating license:', error);
      toast.error("Failed to create license");
    }
  };

  const handleSuspendLicense = async (id: string) => {
    try {
      const reason = prompt("Enter suspension reason:");
      if (!reason) return;

      const { error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'suspend', id, reason }
      });

      if (error) throw error;

      toast.success("License suspended");
      await loadLicenses();
      await loadStats();
    } catch (error) {
      console.error('Error suspending license:', error);
      toast.error("Failed to suspend license");
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this license? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'delete', id }
      });

      if (error) throw error;

      toast.success("License deleted");
      await loadLicenses();
      await loadStats();
    } catch (error) {
      console.error('Error deleting license:', error);
      toast.error("Failed to delete license");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      expired: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              License Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage licenses and monitor usage</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New License</DialogTitle>
                <DialogDescription>
                  Generate a new license with trial period and API key
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date *</Label>
                  <Input
                    id="expiry"
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Initial Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'trial')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateLicense} className="w-full">
                  Create License
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Licenses</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {stats.total}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trial</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{stats.trial}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Suspended</CardDescription>
              <CardTitle className="text-2xl text-orange-600">{stats.suspended}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expired</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.expired}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Licenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Licenses</CardTitle>
            <CardDescription>View and manage all active and inactive licenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>License Key</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {license.company_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <code className="text-xs bg-muted px-2 py-1 rounded">{license.license_key}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{license.api_key.substring(0, 20)}...</code>
                    </TableCell>
                    <TableCell>{getStatusBadge(license.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(license.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(license.expiry_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {license.status !== 'suspended' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspendLicense(license.id)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLicense(license.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Shield, Plus, Ban, Trash2, Key, Calendar, Building, Activity, Globe, ShieldBan, CheckCircle, LogOut, Megaphone, RefreshCw, DollarSign, Save, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface IPLog {
  id: string;
  ip_address: string;
  license_key: string | null;
  user_agent: string | null;
  action: string;
  created_at: string;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  is_active: boolean;
  priority: number;
  created_at: string;
  expires_at: string | null;
}

interface MaterialPrice {
  id: string;
  material_name: string;
  cost_per_sheet: number;
  price_per_sheet: number;
  sheet_length: number;
  sheet_width: number;
}

interface EdgingPrice {
  id: string;
  edging_name: string;
  cost_per_meter: number;
  price_per_meter: number;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, trial: 0, suspended: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success' | 'promo'>('info');
  const [announcementPriority, setAnnouncementPriority] = useState(0);
  
  // IP tracking state
  const [ipLogs, setIPLogs] = useState<IPLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [blockIPAddress, setBlockIPAddress] = useState("");
  const [blockReason, setBlockReason] = useState("");
  
  // Pricing state
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [edgingPrices, setEdgingPrices] = useState<EdgingPrice[]>([]);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialPrice, setNewMaterialPrice] = useState("");
  const [newEdgingName, setNewEdgingName] = useState("");
  const [newEdgingPrice, setNewEdgingPrice] = useState("");
  
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState<'active' | 'trial'>('trial');
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    toast.success("Logged out successfully");
    navigate('/admin-login');
  };

  const checkAdminAndLoadData = async () => {
    try {
      // Check for simple session-based admin auth
      const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
      
      if (!isAuthenticated) {
        navigate('/admin-login');
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadLicenses(), loadStats(), loadIPLogs(), loadBlockedIPs(), loadAnnouncements(), loadPricing()]);
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error("Failed to verify admin access");
    } finally {
      setLoading(false);
    }
  };

  const ADMIN_SECRET = 'ADMIN_XY_W_SECRET_2024';

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'list', admin_secret: ADMIN_SECRET }
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
        body: { action: 'stats', admin_secret: ADMIN_SECRET }
      });

      if (error) throw error;
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadIPLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'list_ip_logs', admin_secret: ADMIN_SECRET }
      });

      if (error) throw error;
      setIPLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading IP logs:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      const typedData = (data || []).map(item => ({
        ...item,
        type: item.type as 'info' | 'warning' | 'success' | 'promo'
      }));
      setAnnouncements(typedData);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const loadPricing = async () => {
    try {
      const [materialRes, edgingRes] = await Promise.all([
        supabase.from('material_prices').select('*').order('material_name'),
        supabase.from('edging_prices').select('*').order('edging_name')
      ]);
      
      if (materialRes.data) setMaterialPrices(materialRes.data);
      if (edgingRes.data) setEdgingPrices(edgingRes.data);
    } catch (error) {
      console.error('Error loading pricing:', error);
    }
  };

  const handleAddMaterialPrice = async () => {
    if (!newMaterialName || !newMaterialPrice) {
      toast.error("Please enter material name and price");
      return;
    }
    
    try {
      const { error } = await supabase.from('material_prices').insert({
        material_name: newMaterialName,
        price_per_sheet: parseFloat(newMaterialPrice),
        cost_per_sheet: 0
      });
      
      if (error) throw error;
      toast.success("Material price added");
      setNewMaterialName("");
      setNewMaterialPrice("");
      await loadPricing();
    } catch (error) {
      console.error('Error adding material price:', error);
      toast.error("Failed to add material price");
    }
  };

  const handleAddEdgingPrice = async () => {
    if (!newEdgingName || !newEdgingPrice) {
      toast.error("Please enter edging name and price");
      return;
    }
    
    try {
      const { error } = await supabase.from('edging_prices').insert({
        edging_name: newEdgingName,
        price_per_meter: parseFloat(newEdgingPrice),
        cost_per_meter: 0
      });
      
      if (error) throw error;
      toast.success("Edging price added");
      setNewEdgingName("");
      setNewEdgingPrice("");
      await loadPricing();
    } catch (error) {
      console.error('Error adding edging price:', error);
      toast.error("Failed to add edging price");
    }
  };

  const handleUpdateMaterialPrice = async (id: string, price: number) => {
    try {
      const { error } = await supabase
        .from('material_prices')
        .update({ price_per_sheet: price })
        .eq('id', id);
      
      if (error) throw error;
      await loadPricing();
    } catch (error) {
      console.error('Error updating material price:', error);
    }
  };

  const handleUpdateEdgingPrice = async (id: string, price: number) => {
    try {
      const { error } = await supabase
        .from('edging_prices')
        .update({ price_per_meter: price })
        .eq('id', id);
      
      if (error) throw error;
      await loadPricing();
    } catch (error) {
      console.error('Error updating edging price:', error);
    }
  };

  const handleDeleteMaterialPrice = async (id: string) => {
    try {
      const { error } = await supabase.from('material_prices').delete().eq('id', id);
      if (error) throw error;
      toast.success("Material price deleted");
      await loadPricing();
    } catch (error) {
      console.error('Error deleting material price:', error);
    }
  };

  const handleDeleteEdgingPrice = async (id: string) => {
    try {
      const { error } = await supabase.from('edging_prices').delete().eq('id', id);
      if (error) throw error;
      toast.success("Edging price deleted");
      await loadPricing();
    } catch (error) {
      console.error('Error deleting edging price:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle,
        content: announcementContent,
        type: announcementType,
        priority: announcementPriority,
        is_active: true
      });

      if (error) throw error;

      toast.success("Announcement created");
      setShowAnnouncementDialog(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementType("info");
      setAnnouncementPriority(0);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error("Failed to create announcement");
    }
  };

  const handleToggleAnnouncement = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentActive ? "Announcement hidden" : "Announcement shown");
      await loadAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error("Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      toast.success("Announcement deleted");
      await loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error("Failed to delete announcement");
    }
  };

  const loadBlockedIPs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'list_blocked_ips', admin_secret: ADMIN_SECRET }
      });

      if (error) throw error;
      setBlockedIPs(data.blocked || []);
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
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
          admin_secret: ADMIN_SECRET,
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
        body: { action: 'suspend', admin_secret: ADMIN_SECRET, id, reason }
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
        body: { action: 'delete', admin_secret: ADMIN_SECRET, id }
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

  const handleRegenerateLicenseKey = async (id: string, companyName: string) => {
    if (!confirm(`Regenerate license key for ${companyName}? This will immediately log out ALL devices using the current key.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'regenerate_key', admin_secret: ADMIN_SECRET, id }
      });

      if (error) throw error;

      toast.success(`License key regenerated for ${companyName}. All devices logged out.`);
      await loadLicenses();
    } catch (error) {
      console.error('Error regenerating license key:', error);
      toast.error("Failed to regenerate license key");
    }
  };

  const handleBlockIP = async () => {
    if (!blockIPAddress) {
      toast.error("Please enter an IP address");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'block_ip', admin_secret: ADMIN_SECRET, ip_address: blockIPAddress, reason: blockReason || null }
      });

      if (error) throw error;

      toast.success("IP address blocked");
      setShowBlockDialog(false);
      setBlockIPAddress("");
      setBlockReason("");
      await loadBlockedIPs();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast.error("Failed to block IP");
    }
  };

  const handleUnblockIP = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'unblock_ip', admin_secret: ADMIN_SECRET, id }
      });

      if (error) throw error;

      toast.success("IP address unblocked");
      await loadBlockedIPs();
    } catch (error) {
      console.error('Error unblocking IP:', error);
      toast.error("Failed to unblock IP");
    }
  };

  const handleQuickBlockIP = async (ip: string) => {
    const reason = prompt("Enter block reason (optional):");
    try {
      const { error } = await supabase.functions.invoke('manage-licenses', {
        body: { action: 'block_ip', admin_secret: ADMIN_SECRET, ip_address: ip, reason: reason || 'Blocked from logs' }
      });

      if (error) throw error;

      toast.success("IP address blocked");
      await loadBlockedIPs();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast.error("Failed to block IP");
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

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      valid_access: 'bg-green-100 text-green-800',
      invalid_license: 'bg-red-100 text-red-800',
      blocked_attempt: 'bg-red-200 text-red-900',
      expired_license: 'bg-orange-100 text-orange-800',
      suspended_license: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colorMap[action] || 'bg-gray-100 text-gray-800'}`}>
        {action.replace('_', ' ').toUpperCase()}
      </span>
    );
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
            <p className="text-muted-foreground mt-1">Manage licenses, monitor usage, and control IP access</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Blocked IPs</CardDescription>
              <CardTitle className="text-2xl text-destructive">{blockedIPs.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="licenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
            <TabsTrigger value="announcements">Announcements ({announcements.length})</TabsTrigger>
            <TabsTrigger value="ip-logs">IP Logs ({ipLogs.length})</TabsTrigger>
            <TabsTrigger value="blocked-ips">Blocked IPs ({blockedIPs.length})</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="licenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Licenses</CardTitle>
                  <CardDescription>View and manage all active and inactive licenses</CardDescription>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(license.license_key);
                                toast.success("License key copied");
                              }}
                              title="Copy license key"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
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
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRegenerateLicenseKey(license.id, license.company_name)}
                              title="Regenerate key & logout all devices"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
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
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    App Announcements
                  </CardTitle>
                  <CardDescription>Create and manage news and announcements shown to users</CardDescription>
                </div>
                <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                      <DialogDescription>
                        Create a new announcement to display in the app
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="ann-title">Title *</Label>
                        <Input
                          id="ann-title"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          placeholder="Announcement title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ann-content">Content *</Label>
                        <Textarea
                          id="ann-content"
                          value={announcementContent}
                          onChange={(e) => setAnnouncementContent(e.target.value)}
                          placeholder="Announcement content..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ann-type">Type</Label>
                        <Select value={announcementType} onValueChange={(v) => setAnnouncementType(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="promo">Promo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ann-priority">Priority (higher = top)</Label>
                        <Input
                          id="ann-priority"
                          type="number"
                          value={announcementPriority}
                          onChange={(e) => setAnnouncementPriority(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Button onClick={handleCreateAnnouncement} className="w-full">
                        Create Announcement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No announcements yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      announcements.map((ann) => (
                        <TableRow key={ann.id}>
                          <TableCell className="font-medium">{ann.title}</TableCell>
                          <TableCell>
                            <Badge variant={ann.type === 'warning' ? 'destructive' : ann.type === 'success' ? 'secondary' : 'default'}>
                              {ann.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{ann.priority}</TableCell>
                          <TableCell>
                            <Badge variant={ann.is_active ? 'default' : 'secondary'}>
                              {ann.is_active ? 'Active' : 'Hidden'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(ann.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAnnouncement(ann.id, ann.is_active)}
                              >
                                {ann.is_active ? 'Hide' : 'Show'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ip-logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  IP Access Logs
                </CardTitle>
                <CardDescription>Monitor all access attempts with IP addresses and locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>License Key</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>ISP</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Block</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                          <TableCell className="text-sm">
                            {log.city || log.country ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{log.city || '-'}</span>
                                <span className="text-xs text-muted-foreground">{log.region ? `${log.region}, ` : ''}{log.country || '-'}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.license_key ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">{log.license_key}</code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {log.isp || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {!blockedIPs.some(b => b.ip_address === log.ip_address) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickBlockIP(log.ip_address)}
                              >
                                <ShieldBan className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked-ips">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldBan className="h-5 w-5" />
                    Blocked IP Addresses
                  </CardTitle>
                  <CardDescription>Manage blocked IP addresses</CardDescription>
                </div>
                <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Plus className="h-4 w-4 mr-2" />
                      Block IP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block IP Address</DialogTitle>
                      <DialogDescription>
                        Block an IP address from accessing the application
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="ip">IP Address *</Label>
                        <Input
                          id="ip"
                          value={blockIPAddress}
                          onChange={(e) => setBlockIPAddress(e.target.value)}
                          placeholder="e.g., 192.168.1.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                          id="reason"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Reason for blocking..."
                          rows={2}
                        />
                      </div>
                      <Button onClick={handleBlockIP} variant="destructive" className="w-full">
                        Block IP Address
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No blocked IP addresses
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockedIPs.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-mono">{ip.ip_address}</TableCell>
                          <TableCell>{ip.reason || '-'}</TableCell>
                          <TableCell>{new Date(ip.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnblockIP(ip.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Material Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Material Prices (per sheet)
                  </CardTitle>
                  <CardDescription>Set prices for each material type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input 
                      placeholder="Material name" 
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                    />
                    <Input 
                      type="number" 
                      placeholder="Price" 
                      className="w-32"
                      value={newMaterialPrice}
                      onChange={(e) => setNewMaterialPrice(e.target.value)}
                    />
                    <Button onClick={handleAddMaterialPrice}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Price/Sheet</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialPrices.map((mp) => (
                        <TableRow key={mp.id}>
                          <TableCell>{mp.material_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={mp.price_per_sheet}
                              onChange={(e) => handleUpdateMaterialPrice(mp.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteMaterialPrice(mp.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {materialPrices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No material prices configured
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Edging Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Edging Prices (per meter)
                  </CardTitle>
                  <CardDescription>Set prices for each edging type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input 
                      placeholder="Edging name" 
                      value={newEdgingName}
                      onChange={(e) => setNewEdgingName(e.target.value)}
                    />
                    <Input 
                      type="number" 
                      placeholder="Price/m" 
                      className="w-32"
                      value={newEdgingPrice}
                      onChange={(e) => setNewEdgingPrice(e.target.value)}
                    />
                    <Button onClick={handleAddEdgingPrice}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Edging Type</TableHead>
                        <TableHead>Price/Meter</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {edgingPrices.map((ep) => (
                        <TableRow key={ep.id}>
                          <TableCell>{ep.edging_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={ep.price_per_meter}
                              onChange={(e) => handleUpdateEdgingPrice(ep.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteEdgingPrice(ep.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {edgingPrices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No edging prices configured
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;

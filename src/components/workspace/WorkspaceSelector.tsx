import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Workspace {
  id: string;
  name: string;
  description: string;
}

interface WorkspaceSelectorProps {
  onWorkspaceSelect: (workspaceId: string) => void;
  selectedWorkspaceId?: string;
}

export const WorkspaceSelector = ({ onWorkspaceSelect, selectedWorkspaceId }: WorkspaceSelectorProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading workspaces", variant: "destructive" });
      return;
    }

    setWorkspaces(data || []);
    
    // Auto-select first workspace if none selected
    if (!selectedWorkspaceId && data && data.length > 0) {
      onWorkspaceSelect(data[0].id);
    }
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({ name, description, owner_id: user.id })
      .select()
      .single();

    if (workspaceError) {
      toast({ title: "Error creating workspace", variant: "destructive" });
      return;
    }

    // Add user as owner member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    toast({ title: "Workspace created!" });
    setOpen(false);
    setName("");
    setDescription("");
    loadWorkspaces();
    onWorkspaceSelect(workspace.id);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedWorkspaceId} onValueChange={onWorkspaceSelect}>
        <SelectTrigger className="w-[200px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={createWorkspace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
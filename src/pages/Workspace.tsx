import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { WorkspaceSelector } from "@/components/workspace/WorkspaceSelector";
import { ProjectList } from "@/components/workspace/ProjectList";
import { ProjectComments } from "@/components/workspace/ProjectComments";
import { ApprovalWorkflow } from "@/components/workspace/ApprovalWorkflow";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Workspace() {
  const [user, setUser] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (workspaceId && user) {
      loadUserRole();
    }
  }, [workspaceId, user]);

  const loadUserRole = async () => {
    const { data } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedProjectId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProjectId("")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-2xl font-bold">Team Collaboration</h1>
          </div>
          <div className="flex items-center gap-4">
            {!selectedProjectId && (
              <WorkspaceSelector
                onWorkspaceSelect={setWorkspaceId}
                selectedWorkspaceId={workspaceId}
              />
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {!workspaceId ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Create or select a workspace to get started
            </p>
          </div>
        ) : selectedProjectId ? (
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectComments projectId={selectedProjectId} />
            <ApprovalWorkflow projectId={selectedProjectId} userRole={userRole} />
          </div>
        ) : (
          <ProjectList
            workspaceId={workspaceId}
            onSelectProject={setSelectedProjectId}
          />
        )}
      </main>
    </div>
  );
}
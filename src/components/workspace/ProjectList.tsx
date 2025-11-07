import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  created_by: string;
  profiles: {
    full_name: string;
  };
}

interface ProjectListProps {
  workspaceId: string;
  onSelectProject: (projectId: string) => void;
}

export const ProjectList = ({ workspaceId, onSelectProject }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    loadProjects();
  }, [workspaceId]);

  const loadProjects = async () => {
    const { data: projectsData, error } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error || !projectsData) return;

    // Fetch creator profiles separately
    const creatorIds = projectsData.map(p => p.created_by);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", creatorIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    
    const projectsWithProfiles = projectsData.map(project => ({
      ...project,
      profiles: profilesMap.get(project.created_by) || { full_name: "Unknown" }
    }));

    setProjects(projectsWithProfiles);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending_approval":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelectProject(project.id)}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              {getStatusIcon(project.status)}
            </div>
            <CardDescription>{project.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{project.status.replace("_", " ")}</Badge>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="text-muted-foreground">
                Created by {project.profiles?.full_name || "Unknown"}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
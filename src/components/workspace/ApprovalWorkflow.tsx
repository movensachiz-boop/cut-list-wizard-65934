import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";

interface Approval {
  id: string;
  status: string;
  notes: string;
  created_at: string;
  reviewed_at: string;
  requested_by: string;
  reviewed_by: string;
  profiles_requested: {
    full_name: string;
  };
  profiles_reviewed?: {
    full_name: string;
  };
}

interface ApprovalWorkflowProps {
  projectId: string;
  userRole: string;
}

export const ApprovalWorkflow = ({ projectId, userRole }: ApprovalWorkflowProps) => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [notes, setNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadApprovals();
  }, [projectId]);

  const loadApprovals = async () => {
    const { data: approvalsData, error } = await supabase
      .from("project_approvals")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error || !approvalsData) return;

    // Fetch profiles for requested_by and reviewed_by
    const userIds = [
      ...approvalsData.map(a => a.requested_by),
      ...approvalsData.filter(a => a.reviewed_by).map(a => a.reviewed_by!)
    ];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    
    const approvalsWithProfiles = approvalsData.map(approval => ({
      ...approval,
      profiles_requested: profilesMap.get(approval.requested_by) || { full_name: "Unknown" },
      profiles_reviewed: approval.reviewed_by ? profilesMap.get(approval.reviewed_by) : undefined
    }));

    setApprovals(approvalsWithProfiles);
  };

  const requestApproval = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("project_approvals")
      .insert({
        project_id: projectId,
        requested_by: user.id,
        notes,
        status: "pending",
      });

    if (error) {
      toast({ title: "Error requesting approval", variant: "destructive" });
      return;
    }

    // Update project status
    await supabase
      .from("projects")
      .update({ status: "pending_approval" })
      .eq("id", projectId);

    setNotes("");
    loadApprovals();
    toast({ title: "Approval requested" });
  };

  const reviewApproval = async (approvalId: string, approved: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("project_approvals")
      .update({
        status: approved ? "approved" : "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: reviewNotes || null,
      })
      .eq("id", approvalId);

    if (error) {
      toast({ title: "Error reviewing approval", variant: "destructive" });
      return;
    }

    // Update project status
    await supabase
      .from("projects")
      .update({ status: approved ? "approved" : "rejected" })
      .eq("id", projectId);

    setReviewNotes("");
    loadApprovals();
    toast({ title: approved ? "Approved" : "Rejected" });
  };

  const canReview = userRole === "owner" || userRole === "admin";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request Approval */}
        <div className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for approval request..."
          />
          <Button onClick={requestApproval} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Request Approval
          </Button>
        </div>

        {/* Approvals List */}
        <div className="space-y-3 pt-4 border-t">
          {approvals.map((approval) => (
            <div key={approval.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {approval.profiles_requested?.full_name || "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={
                  approval.status === "approved" ? "default" :
                  approval.status === "rejected" ? "destructive" :
                  "secondary"
                }>
                  {approval.status === "approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                  {approval.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                  {approval.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                  {approval.status}
                </Badge>
              </div>

              {approval.notes && (
                <p className="text-sm">{approval.notes}</p>
              )}

              {approval.status === "pending" && canReview && (
                <div className="space-y-2 pt-2 border-t">
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes..."
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => reviewApproval(approval.id, true)}
                      className="flex-1"
                      variant="default"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => reviewApproval(approval.id, false)}
                      className="flex-1"
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {approval.reviewed_by && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  Reviewed by {approval.profiles_reviewed?.full_name || "Unknown"}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
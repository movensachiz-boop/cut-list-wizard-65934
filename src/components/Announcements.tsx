import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Info, AlertTriangle, CheckCircle, Megaphone, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "promo";
  priority: number;
  created_at: string;
}

const typeConfig = {
  info: {
    icon: Info,
    bgClass: "bg-primary/10 border-primary/30",
    badgeVariant: "default" as const,
    iconClass: "text-primary"
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-orange-500/10 border-orange-500/30",
    badgeVariant: "destructive" as const,
    iconClass: "text-orange-500"
  },
  success: {
    icon: CheckCircle,
    bgClass: "bg-green-500/10 border-green-500/30",
    badgeVariant: "secondary" as const,
    iconClass: "text-green-500"
  },
  promo: {
    icon: Megaphone,
    bgClass: "bg-accent/10 border-accent/30",
    badgeVariant: "outline" as const,
    iconClass: "text-accent"
  }
};

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .or("expires_at.is.null,expires_at.gt.now()")
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        // Cast type field to proper union type
        const typedData = (data || []).map(item => ({
          ...item,
          type: item.type as "info" | "warning" | "success" | "promo"
        }));
        setAnnouncements(typedData);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem("dismissedAnnouncements");
    if (dismissed) {
      setDismissedIds(new Set(JSON.parse(dismissed)));
    }
  }, []);

  const dismissAnnouncement = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissedAnnouncements", JSON.stringify([...newDismissed]));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Bell className="h-5 w-5 text-primary" />
        <span>News & Updates</span>
      </div>
      
      <div className="grid gap-4">
        {visibleAnnouncements.map((announcement) => {
          const config = typeConfig[announcement.type];
          const Icon = config.icon;

          return (
            <Card
              key={announcement.id}
              className={`p-4 border-2 ${config.bgClass} relative transition-all duration-300 hover:shadow-lg`}
            >
              <button
                onClick={() => dismissAnnouncement(announcement.id)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-background/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-3 pr-8">
                <div className={`p-2 rounded-full ${config.bgClass}`}>
                  <Icon className={`h-5 w-5 ${config.iconClass}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

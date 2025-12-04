import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Info, AlertTriangle, CheckCircle, Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [visibleAnnouncements.length]);

  // Reset index if it exceeds available announcements
  useEffect(() => {
    if (currentIndex >= visibleAnnouncements.length && visibleAnnouncements.length > 0) {
      setCurrentIndex(0);
    }
  }, [visibleAnnouncements.length, currentIndex]);

  const dismissAnnouncement = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissedAnnouncements", JSON.stringify([...newDismissed]));
    
    // Adjust index if needed
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
  };

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = visibleAnnouncements[currentIndex];
  if (!currentAnnouncement) return null;

  const config = typeConfig[currentAnnouncement.type];
  const Icon = config.icon;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Bell className="h-5 w-5 text-primary" />
          <span>Tips & Updates</span>
        </div>
        {visibleAnnouncements.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {visibleAnnouncements.length}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <Card className={`p-4 border-2 ${config.bgClass} relative transition-all duration-500`}>
        <button
          onClick={() => dismissAnnouncement(currentAnnouncement.id)}
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
              <h3 className="font-semibold text-foreground">{currentAnnouncement.title}</h3>
              <Badge variant={config.badgeVariant} className="text-xs">
                {currentAnnouncement.type.charAt(0).toUpperCase() + currentAnnouncement.type.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{currentAnnouncement.content}</p>
          </div>
        </div>

        {/* Dot indicators */}
        {visibleAnnouncements.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {visibleAnnouncements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? "w-4 bg-primary" 
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

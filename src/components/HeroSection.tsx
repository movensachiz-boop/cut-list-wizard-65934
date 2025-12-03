import { Link } from "react-router-dom";
import fastCutLogo from "@/assets/fast-cut-logo.png";
import { Zap, Gauge, CheckCircle, Shield } from "lucide-react";

export const HeroSection = () => {
  
  return (
    <div className="mb-16 flex flex-col items-center gap-8 text-center relative py-12">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative animate-bounce-in">
        <div className="absolute inset-0 blur-2xl opacity-50 bg-primary/30 rounded-full"></div>
        <img 
          src={fastCutLogo} 
          alt="FAST CUT Logo" 
          className="w-64 h-auto drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500" 
        />
      </div>
      
      <div className="space-y-4 animate-fade-in-up max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Professional Cutting Solutions
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span>Smart optimization</span>
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            <span>Lightning fast entry</span>
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Professional results</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground/70 font-semibold tracking-wide">
          DATAPLEX PROPERTIES
        </p>
        
        <Link 
          to="/admin-login" 
          className="inline-flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-primary transition-colors mt-4"
        >
          <Shield className="h-3 w-3" />
          Admin
        </Link>
      </div>
    </div>
  );
};

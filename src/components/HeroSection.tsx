import fastCutLogo from "@/assets/fast-cut-logo.png";

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
        <img src={fastCutLogo} alt="FAST CUT Logo" className="w-64 h-auto drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500" />
      </div>
      
      <div className="space-y-4 animate-fade-in-up max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
          Professional Cutting Solutions
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          ⚡ AI-powered optimization • 🚀 Lightning fast entry • ✨ Professional results
        </p>
        <p className="text-sm text-muted-foreground/70 italic">
          Designed by Envoy Harry
        </p>
      </div>
    </div>
  );
};

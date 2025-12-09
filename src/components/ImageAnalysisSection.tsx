// Image Analysis Section with automated dimension extraction
import { Camera, ImageIcon, ScanLine, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageAnalysisSectionProps {
  isAnalyzing: boolean;
  analysisProgress: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCameraCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageAnalysisSection = ({
  isAnalyzing,
  analysisProgress,
  fileInputRef,
  cameraInputRef,
  handleFileUpload,
  handleCameraCapture
}: ImageAnalysisSectionProps) => {
  return (
    <Card className="p-8 mb-10 border-2 border-primary/20 glass-effect relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10 group-hover:bg-accent/30 transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/15 rounded-full blur-3xl -z-10 group-hover:bg-primary/25 transition-all duration-700"></div>
      
      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="inline-block">
            <div className="p-4 bg-primary/10 rounded-full mb-2 animate-bounce-in">
              <Camera className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Image Analysis
          </h2>
          <p className="text-muted-foreground text-lg max-w-md">
            Take a photo or upload an image of your cutting list and hardware
          </p>
        </div>

        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-6 py-12 animate-fade-in">
            <div className="relative">
              {/* Outer spinning ring with gradient */}
              <div className="w-32 h-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin shadow-lg glow-primary"></div>
              {/* Middle spinning ring - opposite direction */}
              <div className="absolute inset-2 w-28 h-28 rounded-full border-4 border-accent/10 border-b-accent animate-spin shadow-md glow-accent" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full gradient-primary opacity-20 animate-pulse"></div>
              </div>
              {/* Center percentage with gradient */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {Math.round(analysisProgress)}%
                </span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground animate-pulse">Analyzing Image...</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center">
                <Sparkles className="h-4 w-4" />
                Extracting dimensions and hardware
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-5 flex-wrap justify-center animate-fade-in">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />

            <Button onClick={() => cameraInputRef.current?.click()} disabled={isAnalyzing} size="lg" variant="default" className="gap-2 min-w-[160px]">
              <Camera className="h-5 w-5" />
              Take Photo
            </Button>

            <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} size="lg" variant="accent" className="gap-2 min-w-[160px]">
              <ImageIcon className="h-5 w-5" />
              Upload Image
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ScanLine className="h-4 w-4" />
            Instant extraction
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            High accuracy
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Auto-formatted
          </span>
        </div>
      </div>
    </Card>
  );
};

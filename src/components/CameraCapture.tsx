import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, X, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

/**
 * High-resolution camera capture with optical+digital zoom for reading
 * fine details on cutting lists.
 */
export const CameraCapture = ({ open, onClose, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(5);
  const [zoomStep, setZoomStep] = useState(0.1);
  const [supportsNativeZoom, setSupportsNativeZoom] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setIsReady(false);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      // @ts-expect-error - non-standard but widely supported on mobile
      const caps = track.getCapabilities?.() ?? {};
      if (caps.zoom) {
        setSupportsNativeZoom(true);
        setMinZoom(caps.zoom.min ?? 1);
        setMaxZoom(caps.zoom.max ?? 5);
        setZoomStep(caps.zoom.step ?? 0.1);
        setZoom(caps.zoom.min ?? 1);
      } else {
        setSupportsNativeZoom(false);
        setMinZoom(1);
        setMaxZoom(5);
        setZoomStep(0.1);
        setZoom(1);
      }

      // Try to enable continuous autofocus for sharper text
      try {
        await track.applyConstraints({
          // @ts-expect-error - non-standard
          advanced: [{ focusMode: "continuous" }],
        });
      } catch {
        // ignore - not supported
      }

      setIsReady(true);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please grant permission and try again.");
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopStream();
      setIsReady(false);
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  // Apply zoom to track when supported
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !supportsNativeZoom) return;
    try {
      track.applyConstraints({
        // @ts-expect-error - non-standard
        advanced: [{ zoom }],
      });
    } catch {
      // ignore
    }
  }, [zoom, supportsNativeZoom]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      toast.error("Camera not ready yet");
      return;
    }

    const canvas = document.createElement("canvas");

    // If we don't have native zoom, crop the center to simulate digital zoom
    const digitalZoom = supportsNativeZoom ? 1 : zoom;
    const cropW = vw / digitalZoom;
    const cropH = vh / digitalZoom;
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High quality smoothing for upscale clarity
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Failed to capture image");
          return;
        }
        const file = new File([blob], `cutlist-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.95,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Capture Cutlist
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full max-h-[60vh] object-contain bg-black"
            style={{
              transform: supportsNativeZoom ? undefined : `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Starting camera...
            </div>
          )}
        </div>

        <div className="px-4 py-3 space-y-3 bg-background">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              min={minZoom}
              max={maxZoom}
              step={zoomStep}
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono w-12 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {supportsNativeZoom
              ? "Using camera optical/digital zoom for best detail"
              : "Digital zoom — get close & hold steady for sharp text"}
          </p>

          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFacingMode((f) => (f === "environment" ? "user" : "environment"))
              }
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Flip
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleCapture}
              disabled={!isReady}
              className="flex-1 mx-2"
            >
              <Camera className="h-5 w-5 mr-2" /> Capture
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Download, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import noticeAsset from "@/assets/abv-zimbabwe-subscription-notice.png.asset.json";
import { ABV_NOTICE_ID, canAcknowledgeAbvNotice, isAbvNoticeRecipient } from "@/lib/abvNotice";

export function AbvImportantNotice({ companyName }: { companyName: string }) {
  const [acknowledged, setAcknowledged] = useState(() => {
    try { return localStorage.getItem(ABV_NOTICE_ID) === "acknowledged"; }
    catch { return false; }
  });
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const response = await fetch(noticeAsset.url);
      if (!response.ok) throw new Error("Download unavailable");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Invalid notice file");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ABV-Zimbabwe-Subscription-Notice.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setDownloadStarted(true);
    } catch {
      toast.error("The notice could not be downloaded. Please try again.");
    } finally { setDownloading(false); }
  };

  const acknowledge = () => {
    if (!canAcknowledgeAbvNotice(downloadStarted)) return;
    try { localStorage.setItem(ABV_NOTICE_ID, "acknowledged"); } catch { /* Acknowledge for this visit. */ }
    setAcknowledged(true);
  };

  return (
    <AlertDialog open={isAbvNoticeRecipient(companyName) && !acknowledged}>
      <AlertDialogContent className="max-h-[94dvh] w-[calc(100%-2rem)] max-w-2xl gap-3 overflow-y-auto rounded-lg p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 shrink-0 text-primary" />Important notice for ABV Zimbabwe</AlertDialogTitle>
          <AlertDialogDescription>A personal message from Envoy Harry. Your subscription payment is due on 12 November 2026.</AlertDialogDescription>
        </AlertDialogHeader>
        <img src={noticeAsset.url} alt="Subscription extension notice from Envoy Harry to ABV Zimbabwe, with his circular portrait" className="mx-auto max-h-[60dvh] w-full object-contain" />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button onClick={download} disabled={downloading}><Download className="mr-2 h-4 w-4" />{downloading ? "Downloading…" : "Download notice"}</Button>
          <Button variant="outline" onClick={acknowledge} disabled={!canAcknowledgeAbvNotice(downloadStarted)}>I have saved the notice — continue</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
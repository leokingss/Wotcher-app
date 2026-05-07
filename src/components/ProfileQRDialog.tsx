import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Share2, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

const ProfileQRDialog = ({ open, onOpenChange, username, displayName, avatarUrl }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const url = `${window.location.origin}/profile/${username}`;
    setProfileUrl(url);
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 1,
      color: { dark: "#1B1C1E", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).catch(() => {});
  }, [open, username]);

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${username}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `@${username}`, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied");
      }
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <QrCode className="w-5 h-5 text-primary" /> Scan to follow
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative neo-card p-5 rounded-3xl bg-white">
            <canvas ref={canvasRef} className="rounded-xl" />
            {avatarUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="neo-card p-1 rounded-full bg-white">
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="font-bold text-lg">{displayName ?? username}</p>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={download} className="flex-1 neo-button-icon py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4 text-primary" /> Save
            </button>
            <button onClick={share} className="flex-1 neo-button-icon py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <Share2 className="w-4 h-4 text-primary" /> Share
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileQRDialog;

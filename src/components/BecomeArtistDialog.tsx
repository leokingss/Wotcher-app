import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Mic2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENRES = ["Pop", "Hip-Hop", "R&B", "Electronic", "Rock", "Indie", "Jazz", "Afro", "Latin", "Country"];

const BecomeArtistDialog = ({ open, onOpenChange }: Props) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 3 ? [...prev, g] : prev));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!artistName.trim()) return toast.error("Artist name is required");
    setSubmitting(true);
    try {
      const verified = !!externalLink.trim();
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ account_type: "artist" })
        .eq("id", user.id);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("artist_profiles").upsert({
        user_id: user.id,
        artist_name: artistName.trim(),
        genres,
        external_link: externalLink.trim() || null,
        bio: bio.trim() || null,
        verified,
      });
      if (insErr) throw insErr;

      await refreshProfile();
      toast.success(verified ? "You're verified! 🎵" : "Welcome, artist! 🎵");
      onOpenChange(false);
      setStep(1);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to upgrade");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border/50 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="neo-button-icon p-2 text-primary"><Mic2 className="w-5 h-5" /></div>
            <div>
              <DialogTitle>Become an Artist</DialogTitle>
              <DialogDescription className="text-xs">Step {step} of 2</DialogDescription>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="neo-button-icon p-2"><X className="w-4 h-4" /></button>
        </DialogHeader>

        <div className="p-5 space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Artist Name</label>
                <div className="neo-card-inset rounded-xl px-4 py-3">
                  <input
                    autoFocus
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your stage name"
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Bio</label>
                <div className="neo-card-inset rounded-xl px-4 py-3">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell fans about your sound…"
                    rows={3}
                    className="w-full bg-transparent outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Genres (up to 3)</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => {
                    const active = genres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all ${active ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground"}`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!artistName.trim()}
                className="action-button action-button-primary w-full disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" /> Get Verified (optional)
                </label>
                <div className="neo-card-inset rounded-xl px-4 py-3">
                  <input
                    autoFocus
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="Spotify, SoundCloud or Instagram URL"
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drop a link to an existing music profile and you'll get a verified badge so fans know it's really you.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="action-button flex-1">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="action-button action-button-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Activate Artist
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BecomeArtistDialog;

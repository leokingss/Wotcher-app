import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { upsertAddress, useDefaultShippingAddress } from "@/hooks/useShippingAddress";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

const schema = z.object({
  full_name: z.string().trim().min(1).max(100),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional().or(z.literal("")),
  postal_code: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

const ShippingAddressDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const { user } = useAuth();
  const { address, refresh } = useDefaultShippingAddress(user?.id);
  const [form, setForm] = useState({
    full_name: "", line1: "", line2: "", city: "", region: "", postal_code: "", country: "", phone: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (address) {
      setForm({
        full_name: address.full_name,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        region: address.region ?? "",
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone ?? "",
      });
    }
  }, [address, open]);

  const handleSave = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid address");
      return;
    }
    setBusy(true);
    const { error } = await upsertAddress(user.id, {
      ...parsed.data,
      line2: parsed.data.line2 || null,
      region: parsed.data.region || null,
      phone: parsed.data.phone || null,
    } as any);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Address saved");
    refresh();
    onSaved?.();
    onOpenChange(false);
  };

  const field = (label: string, key: keyof typeof form, placeholder?: string) => (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="neo-card-inset rounded-xl px-3 py-2 w-full text-sm bg-transparent outline-none mt-1"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Shipping address
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto pr-1">
          {field("Full name", "full_name", "Jane Doe")}
          {field("Address line 1", "line1", "123 Main St")}
          {field("Address line 2", "line2", "Apt 4B (optional)")}
          <div className="grid grid-cols-2 gap-3">
            {field("City", "city")}
            {field("State / Region", "region")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Postal code", "postal_code")}
            {field("Country", "country", "US")}
          </div>
          {field("Phone", "phone", "Optional")}
        </div>
        <button
          onClick={handleSave}
          disabled={busy}
          className="action-button action-button-primary w-full mt-2"
        >
          Save address
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingAddressDialog;

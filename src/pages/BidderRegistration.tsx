import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBidderRegistration } from "@/hooks/useBidderRegistration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Upload, ArrowLeft } from "lucide-react";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1">
    <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
    {children}
  </label>
);

const input = "neo-card-inset rounded-xl px-3 py-2 w-full text-sm bg-transparent outline-none";

const uploadFile = async (userId: string, slot: string, file: File) => {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${slot}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("bidder-proofs").upload(path, file, {
    upsert: true, contentType: file.type,
  });
  if (error) throw error;
  return path;
};

const BidderRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { registration, refresh, isApproved } = useBidderRegistration(user?.id);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    declared_cap: "1000",
    legal_name: "",
    date_of_birth: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "",
    phone: "",
    bank_reference: "",
  });
  const [files, setFiles] = useState<{ id?: File; idBack?: File; address?: File; funds?: File }>({});

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!files.id || !files.address || !files.funds) {
      toast.error("Please upload your ID, proof of address and proof of funds");
      return;
    }
    const cap = parseFloat(form.declared_cap);
    if (!cap || cap <= 0) { toast.error("Enter a valid bidding cap"); return; }

    setBusy(true);
    try {
      const [idPath, idBackPath, addrPath, fundsPath] = await Promise.all([
        uploadFile(user.id, "id-front", files.id),
        files.idBack ? uploadFile(user.id, "id-back", files.idBack) : Promise.resolve(null),
        uploadFile(user.id, "address", files.address),
        uploadFile(user.id, "funds", files.funds),
      ]);

      const { data, error } = await supabase.rpc("submit_bidder_registration", {
        _declared_cap: cap,
        _legal_name: form.legal_name.trim(),
        _date_of_birth: form.date_of_birth,
        _address_line1: form.address_line1.trim(),
        _address_line2: form.address_line2.trim() || null,
        _city: form.city.trim(),
        _region: form.region.trim() || null,
        _postal_code: form.postal_code.trim(),
        _country: form.country.trim(),
        _phone: form.phone.trim(),
        _id_document_path: idPath,
        _id_document_back_path: idBackPath,
        _proof_of_address_path: addrPath,
        _proof_of_funds_path: fundsPath,
        _bank_reference: form.bank_reference.trim() || null,
      });
      if (error) throw error;
      const status = (data as any)?.status;
      if (status === "approved") {
        toast.success(`Approved! You can bid up to $${cap.toLocaleString()}.`);
      } else {
        toast.success("Submitted — pending admin review.");
      }
      await refresh();
      navigate(-1);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Sign in to register as a bidder.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 pb-24 space-y-4">
      <button onClick={() => navigate(-1)} className="neo-button-icon p-2 rounded-full">
        <ArrowLeft className="w-4 h-4" />
      </button>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Register to bid
        </h1>
        <p className="text-sm text-muted-foreground">
          Auction-house verification. Bidders with a cap of $5,000 or less are auto-approved.
          Higher caps require manual review.
        </p>
      </header>

      {registration && (
        <div className="neo-card-inset rounded-2xl p-3 text-sm">
          <div className="flex justify-between"><span>Status</span>
            <span className="font-semibold capitalize">{registration.status}</span>
          </div>
          {registration.approved_cap && (
            <div className="flex justify-between"><span>Approved cap</span>
              <span className="font-semibold">${Number(registration.approved_cap).toLocaleString()}</span>
            </div>
          )}
          {registration.reviewer_notes && (
            <p className="text-xs text-muted-foreground mt-2">{registration.reviewer_notes}</p>
          )}
          {isApproved && (
            <p className="text-xs text-green-600 mt-2">You're cleared to bid on any active auction.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Declared bidding cap (USD)">
          <input className={input} type="number" min="1" step="1" required
            value={form.declared_cap} onChange={update("declared_cap")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Legal name">
            <input className={input} required value={form.legal_name} onChange={update("legal_name")} />
          </Field>
          <Field label="Date of birth">
            <input className={input} type="date" required value={form.date_of_birth} onChange={update("date_of_birth")} />
          </Field>
        </div>

        <Field label="Address line 1">
          <input className={input} required value={form.address_line1} onChange={update("address_line1")} />
        </Field>
        <Field label="Address line 2 (optional)">
          <input className={input} value={form.address_line2} onChange={update("address_line2")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input className={input} required value={form.city} onChange={update("city")} />
          </Field>
          <Field label="Region / State">
            <input className={input} value={form.region} onChange={update("region")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Postal code">
            <input className={input} required value={form.postal_code} onChange={update("postal_code")} />
          </Field>
          <Field label="Country">
            <input className={input} required value={form.country} onChange={update("country")} />
          </Field>
        </div>
        <Field label="Phone">
          <input className={input} type="tel" required value={form.phone} onChange={update("phone")} />
        </Field>
        <Field label="Bank / wire reference (optional)">
          <input className={input} value={form.bank_reference} onChange={update("bank_reference")} />
        </Field>

        <FileSlot label="Government-issued ID (front)" required
          file={files.id} onChange={(f) => setFiles((s) => ({ ...s, id: f }))} />
        <FileSlot label="Government-issued ID (back)"
          file={files.idBack} onChange={(f) => setFiles((s) => ({ ...s, idBack: f }))} />
        <FileSlot label="Proof of address (utility bill or bank statement, <3 months)" required
          file={files.address} onChange={(f) => setFiles((s) => ({ ...s, address: f }))} />
        <FileSlot label="Proof of funds (bank or brokerage statement)" required
          file={files.funds} onChange={(f) => setFiles((s) => ({ ...s, funds: f }))} />

        <p className="text-[11px] text-muted-foreground">
          By submitting, you agree to the bidder terms: bids are binding, you authorise us to
          verify the documents you provide, and Wotchers retains 12% of the final sale price.
        </p>

        <button type="submit" disabled={busy}
          className="action-button action-button-primary w-full">
          {busy ? "Submitting…" : "Submit for verification"}
        </button>
      </form>
    </div>
  );
};

const FileSlot = ({ label, required, file, onChange }: {
  label: string; required?: boolean; file?: File; onChange: (f: File) => void;
}) => (
  <label className="block neo-card-inset rounded-2xl p-3 cursor-pointer">
    <div className="flex items-center gap-2">
      <Upload className="w-4 h-4 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          {label}{required && " *"}
        </p>
        <p className="text-sm truncate">{file ? file.name : "Tap to upload"}</p>
      </div>
    </div>
    <input
      type="file"
      accept="image/*,application/pdf"
      className="hidden"
      onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
    />
  </label>
);

export default BidderRegistration;

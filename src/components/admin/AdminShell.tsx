import { NavLink, useNavigate } from "react-router-dom";
import { useIsStaff } from "@/hooks/useIsStaff";
import { Loader2, ShieldAlert, Flag, AlertOctagon, Wallet, Users, Mail, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: Home, end: true },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/disputes", label: "Disputes", icon: AlertOctagon },
  { to: "/admin/orders", label: "Orders & Payouts", icon: Wallet },
  { to: "/admin/sellers", label: "Sellers", icon: Users },
  { to: "/admin/emails", label: "Emails", icon: Mail },
];

export const AdminShell = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const { isStaff, loading } = useIsStaff();
  const navigate = useNavigate();

  if (loading) return <div className="p-10 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading…</div>;
  if (!isStaff) {
    return (
      <div className="p-10 max-w-md mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 mx-auto text-destructive" />
        <h1 className="text-xl font-bold">Restricted area</h1>
        <p className="text-muted-foreground">You need admin or moderator access.</p>
        <button onClick={() => navigate("/")} className="text-primary underline">Return home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 backdrop-blur bg-background/80 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> Trust & Safety · {title}
          </h1>
        </div>
        <nav className="max-w-7xl mx-auto px-2 flex gap-1 overflow-x-auto pb-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
                isActive ? "neo-button-icon-active text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              <n.icon className="w-3.5 h-3.5" /> {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default AdminShell;

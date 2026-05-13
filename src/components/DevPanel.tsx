import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Route,
  RefreshCw,
  Database,
  Bell,
  Settings,
  Activity,
  Server,
  CheckCircle,
  XCircle,
  Keyboard,
  Eye,
  EyeOff,
  Copy,
  Heart,
  User,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { queryClient } from "@/App";

interface ToastSettings {
  toast_likes: boolean;
  toast_comments: boolean;
  toast_follows: boolean;
  toast_dms: boolean;
  toast_auctions: boolean;
  toast_volume: number;
}

interface SupabaseStatus {
  connected: boolean;
  latency: number | null;
  lastCheck: Date | null;
}

const DevPanel = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [toastSettings, setToastSettings] = useState<ToastSettings | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>({
    connected: false,
    latency: null,
    lastCheck: null,
  });
  const [activeSection, setActiveSection] = useState<"routes" | "supabase" | "toast">("routes");
  const [isFetching, setIsFetching] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + Shift + D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const checkSupabaseHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true });
      const latency = Math.round(performance.now() - start);
      setSupabaseStatus({
        connected: !error,
        latency,
        lastCheck: new Date(),
      });
    } catch {
      setSupabaseStatus({
        connected: false,
        latency: null,
        lastCheck: new Date(),
      });
    }
  }, []);

  const fetchToastSettings = useCallback(async () => {
    if (!user) {
      setToastSettings(null);
      return;
    }
    const { data, error } = await supabase
      .from("notification_settings")
      .select("toast_likes, toast_comments, toast_follows, toast_dms, toast_auctions, toast_volume")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load toast settings");
      return;
    }
    if (data) setToastSettings(data as ToastSettings);
  }, [user]);

  useEffect(() => {
    if (open) {
      checkSupabaseHealth();
      fetchToastSettings();
    }
  }, [open, checkSupabaseHealth, fetchToastSettings]);

  const reloadRoute = () => {
    navigate(location.pathname, { replace: true });
    toast.success("Route reloaded");
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries();
    toast.success("All queries invalidated — data will re-fetch");
  };

  const refetchSupabaseTables = async () => {
    setIsFetching(true);
    try {
      // Re-fetch common tables
      const tables = ["profiles", "posts", "notifications", "conversations", "messages"];
      const results = await Promise.allSettled(
        tables.map((table) =>
          (supabase.from as any)(table).select("count", { count: "exact", head: true })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      toast.success(`Re-fetched ${succeeded}/${tables.length} tables`);
    } catch {
      toast.error("Failed to re-fetch tables");
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const SectionButton = ({
    section,
    icon: Icon,
    label,
  }: {
    section: typeof activeSection;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        activeSection === section
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 neo-button-icon w-10 h-10 flex items-center justify-center"
        title="Developer Panel (Cmd/Ctrl+Shift+D)"
        aria-label="Open developer panel"
      >
        <Settings className="w-4 h-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[70vh] p-0 bg-background border-t border-border/50 rounded-t-2xl"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/40">
            <SheetTitle className="text-left text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Developer Panel
            </SheetTitle>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              Press Cmd/Ctrl + Shift + D to toggle
            </p>
          </SheetHeader>

          {/* Section tabs */}
          <div className="flex gap-1 px-4 py-2 border-b border-border/40 overflow-x-auto">
            <SectionButton section="routes" icon={Route} label="Routes" />
            <SectionButton section="supabase" icon={Database} label="Supabase" />
            <SectionButton section="toast" icon={Bell} label="Toast Settings" />
          </div>

          <div className="p-4 overflow-y-auto h-[calc(70vh-120px)]">
            {/* Routes Section */}
            {activeSection === "routes" && (
              <div className="space-y-4">
                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    Current Route
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Path</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{location.pathname}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Search</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{location.search || "—"}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Hash</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{location.hash || "—"}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Key</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{location.key || "—"}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(location.pathname + location.search + location.hash)}
                    className="mt-3 w-full flex items-center justify-center gap-2 neo-button py-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy full URL
                  </button>
                </div>

                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    Route Actions
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={reloadRoute}
                      className="flex-1 flex items-center justify-center gap-2 neo-button py-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reload Route
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 flex items-center justify-center gap-2 neo-button py-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Full Reload
                    </button>
                  </div>
                </div>

                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Navigation
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["/", "/profile", "/search", "/activity", "/messages", "/create"].map((path) => (
                      <button
                        key={path}
                        onClick={() => {
                          navigate(path);
                          setOpen(false);
                        }}
                        className={`neo-button py-2 text-sm ${
                          location.pathname === path ? "bg-primary/10 text-primary" : ""
                        }`}
                      >
                        {path === "/" ? "Home" : path.replace("/", "").replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Supabase Section */}
            {activeSection === "supabase" && (
              <div className="space-y-4">
                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Connection Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span className="flex items-center gap-1 text-xs font-medium">
                        {supabaseStatus.connected ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-destructive" />
                            <span className="text-destructive">Disconnected</span>
                          </>
                        )}
                      </span>
                    </div>
                    {supabaseStatus.latency !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Latency</span>
                        <span className="text-xs font-mono">{supabaseStatus.latency}ms</span>
                      </div>
                    )}
                    {supabaseStatus.lastCheck && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Last check</span>
                        <span className="text-xs text-muted-foreground">
                          {supabaseStatus.lastCheck.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={checkSupabaseHealth}
                    className="mt-3 w-full flex items-center justify-center gap-2 neo-button py-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Check Health
                  </button>
                </div>

                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    Data Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={invalidateQueries}
                      className="w-full flex items-center justify-center gap-2 neo-button py-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Invalidate All Queries
                    </button>
                    <button
                      onClick={refetchSupabaseTables}
                      disabled={isFetching}
                      className="w-full flex items-center justify-center gap-2 neo-button py-2 text-sm disabled:opacity-50"
                    >
                      <Database className="w-4 h-4" />
                      {isFetching ? "Re-fetching..." : "Re-fetch All Tables"}
                    </button>
                  </div>
                </div>

                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Auth Info
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Logged in</span>
                      <span className="text-xs font-medium">{user ? "Yes" : "No"}</span>
                    </div>
                    {user && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">User ID</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[200px]">
                            {user.id.slice(0, 8)}...
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Email</span>
                          <span className="text-xs">{user.email || "—"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Toast Settings Section */}
            {activeSection === "toast" && (
              <div className="space-y-4">
                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Notification Settings
                  </h3>
                  {!user ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sign in to view toast settings
                    </p>
                  ) : !toastSettings ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Loading settings...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { key: "toast_likes", label: "Likes", icon: Heart },
                        { key: "toast_comments", label: "Comments", icon: Bell },
                        { key: "toast_follows", label: "Follows", icon: User },
                        { key: "toast_dms", label: "Direct Messages", icon: Bell },
                        { key: "toast_auctions", label: "Auctions", icon: Bell },
                      ].map(({ key, label, icon: Icon }) => {
                        const value = toastSettings[key as keyof ToastSettings];
                        const isBool = typeof value === "boolean";
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              {label}
                            </span>
                            {isBool ? (
                              value ? (
                                <span className="flex items-center gap-1 text-xs text-green-500">
                                  <Eye className="w-3 h-3" />
                                  Enabled
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <EyeOff className="w-3 h-3" />
                                  Disabled
                                </span>
                              )
                            ) : (
                              <span className="text-xs font-mono">{value}</span>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-sm">Volume</span>
                        <span className="text-xs font-mono">{toastSettings.toast_volume}%</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={fetchToastSettings}
                    className="mt-3 w-full flex items-center justify-center gap-2 neo-button py-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Settings
                  </button>
                </div>

                <div className="neo-card p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Test Toasts
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toast.success("Success toast test")}
                      className="neo-button py-2 text-sm"
                    >
                      Success
                    </button>
                    <button
                      onClick={() => toast.error("Error toast test")}
                      className="neo-button py-2 text-sm"
                    >
                      Error
                    </button>
                    <button
                      onClick={() => toast.info("Info toast test")}
                      className="neo-button py-2 text-sm"
                    >
                      Info
                    </button>
                    <button
                      onClick={() => toast.warning("Warning toast test")}
                      className="neo-button py-2 text-sm"
                    >
                      Warning
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default DevPanel;

import { useAuth } from "@/hooks/useAuth";
import Landing from "./Landing";
import Index from "./Index";

const Root = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  return user ? <Index /> : <Landing />;
};

export default Root;

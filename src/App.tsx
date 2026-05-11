import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import PageTransition from "@/components/PageTransition";
import MiniPlayer from "@/components/MiniPlayer";
import { PlayerProvider } from "@/hooks/usePlayer";
import { FavoritesProvider } from "@/hooks/useFavorites";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Activity from "./pages/Activity";
import Create from "./pages/Create";
import Auth from "./pages/Auth";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import AdminEmails from "./pages/AdminEmails";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
        <Route path="/profile/:username" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/activity" element={<PageTransition><ProtectedRoute><Activity /></ProtectedRoute></PageTransition>} />
        <Route path="/create" element={<PageTransition><ProtectedRoute><Create /></ProtectedRoute></PageTransition>} />
        <Route path="/messages" element={<PageTransition><ProtectedRoute><Messages /></ProtectedRoute></PageTransition>} />
        <Route path="/messages/:conversationId" element={<PageTransition><ProtectedRoute><Conversation /></ProtectedRoute></PageTransition>} />
        <Route path="/unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />
        <Route path="/admin/emails" element={<PageTransition><ProtectedRoute><AdminEmails /></ProtectedRoute></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PlayerProvider>
            <FavoritesProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AnimatedRoutes />
                <MiniPlayer />
              </TooltipProvider>
            </FavoritesProvider>
          </PlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

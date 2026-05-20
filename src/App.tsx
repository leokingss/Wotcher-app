import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import PageTransition from "@/components/PageTransition";
import MiniPlayer from "@/components/MiniPlayer";
import { PlayerProvider } from "@/hooks/usePlayer";
import { SavedListsProvider } from "@/hooks/useSavedLists";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import Root from "./pages/Root";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Activity from "./pages/Activity";
import Create from "./pages/Create";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import AdminEmails from "./pages/AdminEmails";
import AdminSellers from "./pages/AdminSellers";
import ListDetail from "./pages/ListDetail";
import Logos from "./pages/Logos";
import Labs from "./pages/Labs";
import BidderRegistration from "./pages/BidderRegistration";
import SellerPayouts from "./pages/SellerPayouts";
import Orders from "./pages/Orders";
import AdminHome from "./pages/AdminHome";
import AdminReports from "./pages/AdminReports";
import AdminDisputes from "./pages/AdminDisputes";
import AdminOrders from "./pages/AdminOrders";
import InviteFriends from "./pages/InviteFriends";
import AdminInvites from "./pages/AdminInvites";
import { useNotificationToasts } from "@/hooks/useNotificationToasts";
import ErrorBanner from "@/components/ErrorBanner";
import DevPanel from "@/components/DevPanel";

export const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideNav = !user || location.pathname === "/auth" || location.pathname === "/reset-password";
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Root /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
        <Route path="/profile/:username" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/activity" element={<PageTransition><ProtectedRoute><Activity /></ProtectedRoute></PageTransition>} />
        <Route path="/create" element={<PageTransition><ProtectedRoute><Create /></ProtectedRoute></PageTransition>} />
        <Route path="/messages" element={<PageTransition><ProtectedRoute><Messages /></ProtectedRoute></PageTransition>} />
        <Route path="/messages/:conversationId" element={<PageTransition><ProtectedRoute><Conversation /></ProtectedRoute></PageTransition>} />
        <Route path="/unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />
        <Route path="/admin/emails" element={<PageTransition><ProtectedRoute><AdminEmails /></ProtectedRoute></PageTransition>} />
        <Route path="/admin/sellers" element={<PageTransition><ProtectedRoute><AdminSellers /></ProtectedRoute></PageTransition>} />
        <Route path="/list/:id" element={<PageTransition><ListDetail /></PageTransition>} />
        <Route path="/logos" element={<PageTransition><Logos /></PageTransition>} />
        <Route path="/labs" element={<PageTransition><Labs /></PageTransition>} />
        <Route path="/bidder-registration" element={<PageTransition><ProtectedRoute><BidderRegistration /></ProtectedRoute></PageTransition>} />
        <Route path="/payouts" element={<PageTransition><ProtectedRoute><SellerPayouts /></ProtectedRoute></PageTransition>} />
        <Route path="/orders" element={<PageTransition><ProtectedRoute><Orders /></ProtectedRoute></PageTransition>} />
        <Route path="/admin" element={<PageTransition><ProtectedRoute><AdminHome /></ProtectedRoute></PageTransition>} />
        <Route path="/admin/reports" element={<PageTransition><ProtectedRoute><AdminReports /></ProtectedRoute></PageTransition>} />
        <Route path="/admin/disputes" element={<PageTransition><ProtectedRoute><AdminDisputes /></ProtectedRoute></PageTransition>} />
        <Route path="/admin/orders" element={<PageTransition><ProtectedRoute><AdminOrders /></ProtectedRoute></PageTransition>} />
        <Route path="/admin/invites" element={<PageTransition><ProtectedRoute><AdminInvites /></ProtectedRoute></PageTransition>} />
        <Route path="/invite" element={<PageTransition><ProtectedRoute><InviteFriends /></ProtectedRoute></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
      {!hideNav && <BottomNav />}
    </AnimatePresence>
  );
};

const NotificationToastManager = () => {
  const { fetchError, retrySettings } = useNotificationToasts();

  if (!fetchError) return null;

  return (
    <ErrorBanner
      message={fetchError}
      onReload={retrySettings}
      onDismiss={retrySettings}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PlayerProvider>
            <SavedListsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <NotificationToastManager />
                <AnimatedRoutes />
                <DevPanel />
                <MiniPlayer />
              </TooltipProvider>
            </SavedListsProvider>
          </PlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

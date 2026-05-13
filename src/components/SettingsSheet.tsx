import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bookmark,
  Archive,
  MessageCircle,
  Grid3X3,
  Bell,
  Lock,
  Shield,
  User,
  Eye,
  Heart,
  Tag,
  AtSign,
  Languages,
  Moon,
  Sun,
  HelpCircle,
  FileText,
  Info,
  LogOut,
  ChevronRight,
  Search,
  Music,
  Users,
  Ban,
  Clock,
  Smartphone,
  Download,
  Activity,
  CreditCard,
  Megaphone,
  Star,
  ChevronLeft,
  Volume2,
  Wifi,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SavedPostsView from "@/components/SavedPostsView";
import ArchiveView from "@/components/ArchiveView";
import ActivityView from "@/components/ActivityView";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsPage =
  | "main"
  | "notifications"
  | "privacy"
  | "account"
  | "saved"
  | "archive"
  | "activity"
  | "comments"
  | "posts"
  | "blocked"
  | "close-friends"
  | "language"
  | "data"
  | "help"
  | "about";

interface SettingsItem {
  icon: any;
  label: string;
  sublabel?: string;
  action?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  destructive?: boolean;
  badge?: string;
}

interface SettingsGroup {
  title?: string;
  items: SettingsItem[];
}

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut, profile } = useAuth();
  const [page, setPage] = useState<SettingsPage>("main");
  const [search, setSearch] = useState("");

  // Mock toggle states
  const [notifPosts, setNotifPosts] = useState(true);
  const [notifStories, setNotifStories] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifLikes, setNotifLikes] = useState(false);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifPause, setNotifPause] = useState(false);

  const [privatePofile, setPrivateProfile] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [storyResharing, setStoryResharing] = useState(true);
  const [hideStoryFromOthers, setHideStoryFromOthers] = useState(false);
  const [tagApproval, setTagApproval] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [allowMentions, setAllowMentions] = useState(true);

  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [hdMedia, setHdMedia] = useState(true);

  const [allowComments, setAllowComments] = useState(true);
  const [hideOffensive, setHideOffensive] = useState(true);
  const [manualFilter, setManualFilter] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setPage("main"), 250);
  };

  const handleLogout = async () => {
    handleClose();
    await signOut();
    toast.success("Signed out");
  };

  const goTo = (p: SettingsPage) => setPage(p);
  const back = () => setPage("main");

  // Build group structure for each page
  const mainGroups: SettingsGroup[] = [
    {
      title: "Your activity",
      items: [
        { icon: Bookmark, label: "Saved", sublabel: "Posts, songs and lists you saved", action: () => goTo("saved") },
        { icon: Archive, label: "Archive", sublabel: "Stories and posts archived", action: () => goTo("archive") },
        { icon: Activity, label: "Your activity", sublabel: "Posts, comments, videos and stories you've shared", action: () => goTo("activity") },
      ],
    },
    {
      title: "How others can interact with you",
      items: [
        { icon: Lock, label: "Privacy", sublabel: "Account privacy, story controls", action: () => goTo("privacy") },
        { icon: MessageCircle, label: "Comments", sublabel: "Filters, blocked words, allow list", action: () => goTo("comments") },
        { icon: Grid3X3, label: "Posts", sublabel: "Tagging, mentions, sharing", action: () => goTo("posts") },
        { icon: AtSign, label: "Tags & mentions", sublabel: "Who can tag or mention you", toggle: { value: tagApproval, onChange: setTagApproval } },
        { icon: Ban, label: "Blocked accounts", sublabel: "Manage blocked users", action: () => goTo("blocked") },
        { icon: Star, label: "Close friends", sublabel: "Curate your inner circle", action: () => goTo("close-friends") },
        { icon: Users, label: "Restricted accounts", sublabel: "Limit visibility without blocking" },
      ],
    },
    {
      title: "What you see",
      items: [
        { icon: Bell, label: "Notifications", sublabel: "Posts, comments, messages, sounds", action: () => goTo("notifications") },
        { icon: Eye, label: "Content preferences", sublabel: "Sensitive content, suggested posts" },
        { icon: Heart, label: "Like & share counts", sublabel: "Hide counts on others' posts", toggle: { value: false, onChange: () => {} } },
        { icon: Music, label: "Audio autoplay", sublabel: "Auto-play music in feed", toggle: { value: autoplay, onChange: setAutoplay } },
      ],
    },
    {
      title: "Your app and media",
      items: [
        { icon: theme === "dark" ? Moon : Sun, label: "Theme", sublabel: theme === "dark" ? "Dark mode" : "Light mode", toggle: { value: theme === "dark", onChange: toggleTheme } },
        { icon: Languages, label: "Language", sublabel: "English", action: () => goTo("language") },
        { icon: Wifi, label: "Data usage and media quality", sublabel: "Data saver, HD uploads", action: () => goTo("data") },
        { icon: Volume2, label: "Sound effects", sublabel: "In-app sounds and haptics", toggle: { value: true, onChange: () => {} } },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Account", sublabel: profile?.username ? `@${profile.username}` : "Personal info, password", action: () => goTo("account") },
        { icon: Shield, label: "Security", sublabel: "Password, two-factor, sessions" },
        { icon: Smartphone, label: "Devices", sublabel: "Where you're signed in" },
        { icon: Download, label: "Download your data", sublabel: "Export posts, songs, and lists" },
        { icon: CreditCard, label: "Subscriptions", sublabel: "Manage active plans" },
        { icon: Megaphone, label: "Ads", sublabel: "Ad preferences and topics" },
      ],
    },
    {
      title: "More info and support",
      items: [
        { icon: HelpCircle, label: "Help", sublabel: "Help center, report a problem", action: () => goTo("help") },
        { icon: FileText, label: "Terms & policies" },
        { icon: Info, label: "About Watcher", action: () => goTo("about") },
      ],
    },
    {
      title: "Login",
      items: [
        { icon: User, label: "Add account", sublabel: "Manage multiple profiles" },
        { icon: LogOut, label: "Log out", destructive: true, action: handleLogout },
        { icon: Trash2, label: "Delete account", destructive: true },
      ],
    },
  ];

  const notificationGroups: SettingsGroup[] = [
    {
      title: "Pause all",
      items: [
        { icon: Clock, label: "Pause notifications", sublabel: notifPause ? "On for 1 hour" : "Off", toggle: { value: notifPause, onChange: setNotifPause } },
      ],
    },
    {
      title: "Posts, stories and comments",
      items: [
        { icon: Heart, label: "Likes", toggle: { value: notifLikes, onChange: setNotifLikes } },
        { icon: MessageCircle, label: "Comments", toggle: { value: notifComments, onChange: setNotifComments } },
        { icon: Grid3X3, label: "Posts from people you follow", toggle: { value: notifPosts, onChange: setNotifPosts } },
        { icon: Activity, label: "Story replies & reactions", toggle: { value: notifStories, onChange: setNotifStories } },
      ],
    },
    {
      title: "Following and followers",
      items: [
        { icon: Users, label: "New followers", toggle: { value: notifFollows, onChange: setNotifFollows } },
        { icon: Star, label: "Close friends activity", toggle: { value: true, onChange: () => {} } },
      ],
    },
    {
      title: "Messages and calls",
      items: [
        { icon: MessageCircle, label: "Direct messages", toggle: { value: notifMessages, onChange: setNotifMessages } },
        { icon: Bell, label: "Group activity", toggle: { value: true, onChange: () => {} } },
      ],
    },
    {
      title: "Music & artists",
      items: [
        { icon: Music, label: "New track from followed artists", toggle: { value: true, onChange: () => {} } },
        { icon: Star, label: "Top 10 chart updates", toggle: { value: true, onChange: () => {} } },
      ],
    },
    {
      title: "Email notifications",
      items: [
        { icon: Bell, label: "Reminders & feedback", toggle: { value: false, onChange: () => {} } },
        { icon: Megaphone, label: "Product news", toggle: { value: false, onChange: () => {} } },
      ],
    },
  ];

  const privacyGroups: SettingsGroup[] = [
    {
      title: "Account privacy",
      items: [
        { icon: Lock, label: "Private account", sublabel: "Only approved followers see your posts", toggle: { value: privatePofile, onChange: setPrivateProfile } },
      ],
    },
    {
      title: "Interactions",
      items: [
        { icon: Activity, label: "Activity status", sublabel: "Show when you're active", toggle: { value: activityStatus, onChange: setActivityStatus } },
        { icon: Eye, label: "Read receipts", sublabel: "Show when you've read messages", toggle: { value: readReceipts, onChange: setReadReceipts } },
        { icon: AtSign, label: "Allow @mentions", toggle: { value: allowMentions, onChange: setAllowMentions } },
      ],
    },
    {
      title: "Story",
      items: [
        { icon: Eye, label: "Hide story from selected people", toggle: { value: hideStoryFromOthers, onChange: setHideStoryFromOthers } },
        { icon: Heart, label: "Allow story sharing", toggle: { value: storyResharing, onChange: setStoryResharing } },
        { icon: Star, label: "Close friends only", sublabel: "Restrict default audience" },
      ],
    },
    {
      title: "Connections",
      items: [
        { icon: Ban, label: "Blocked", sublabel: "0 accounts", action: () => goTo("blocked") },
        { icon: Users, label: "Restricted", sublabel: "0 accounts" },
        { icon: Shield, label: "Muted accounts", sublabel: "Posts and stories" },
      ],
    },
  ];

  const commentsGroups: SettingsGroup[] = [
    {
      title: "Allow comments",
      items: [
        { icon: MessageCircle, label: "Allow comments on your posts", toggle: { value: allowComments, onChange: setAllowComments } },
      ],
    },
    {
      title: "Filter",
      items: [
        { icon: Shield, label: "Hide offensive comments", sublabel: "Auto-detect with AI", toggle: { value: hideOffensive, onChange: setHideOffensive } },
        { icon: Ban, label: "Manual filter", sublabel: "Hide comments containing your words", toggle: { value: manualFilter, onChange: setManualFilter } },
        { icon: Tag, label: "Custom blocked words", sublabel: "Manage your filter list" },
      ],
    },
    {
      title: "Audience",
      items: [
        { icon: Users, label: "Allow comments from", sublabel: "Everyone" },
        { icon: Star, label: "Pin a comment", sublabel: "Highlight up to 3 comments" },
      ],
    },
  ];

  const postsGroups: SettingsGroup[] = [
    {
      title: "Tagging",
      items: [
        { icon: AtSign, label: "Allow tags from", sublabel: "Everyone" },
        { icon: Eye, label: "Manually approve tags", toggle: { value: tagApproval, onChange: setTagApproval } },
      ],
    },
    {
      title: "Mentions",
      items: [
        { icon: AtSign, label: "Allow mentions from", sublabel: "People you follow" },
      ],
    },
    {
      title: "Sharing",
      items: [
        { icon: Heart, label: "Allow resharing to stories", toggle: { value: storyResharing, onChange: setStoryResharing } },
        { icon: MessageCircle, label: "Allow sharing in messages", toggle: { value: true, onChange: () => {} } },
      ],
    },
    {
      title: "Original audio",
      items: [
        { icon: Music, label: "Let others use your audio", toggle: { value: true, onChange: () => {} } },
      ],
    },
  ];

  const accountGroups: SettingsGroup[] = [
    {
      title: "Personal information",
      items: [
        { icon: User, label: "Edit profile", sublabel: "Name, username, bio" },
        { icon: AtSign, label: "Email and phone" },
        { icon: Shield, label: "Change password" },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: Smartphone, label: "Two-factor authentication", sublabel: "Off" },
        { icon: Activity, label: "Login activity" },
        { icon: Smartphone, label: "Active sessions" },
      ],
    },
    {
      title: "Account type",
      items: [
        { icon: Star, label: "Switch to artist account", sublabel: profile?.account_type === "artist" ? "Currently artist" : "Currently fan" },
      ],
    },
    {
      title: "Danger zone",
      items: [
        { icon: Archive, label: "Deactivate account", destructive: true },
        { icon: Trash2, label: "Delete account", destructive: true },
      ],
    },
  ];

  const dataGroups: SettingsGroup[] = [
    {
      title: "Quality",
      items: [
        { icon: Wifi, label: "Data saver", sublabel: "Reduce mobile data usage", toggle: { value: dataSaver, onChange: setDataSaver } },
        { icon: Download, label: "Upload at highest quality", toggle: { value: hdMedia, onChange: setHdMedia } },
        { icon: Music, label: "Streaming quality", sublabel: "Auto" },
      ],
    },
    {
      title: "Storage",
      items: [
        { icon: Trash2, label: "Clear cache", sublabel: "124 MB" },
        { icon: Download, label: "Download original media", toggle: { value: false, onChange: () => {} } },
      ],
    },
  ];

  const simpleListPages: Record<string, { title: string; description: string }> = {
    blocked: { title: "Blocked accounts", description: "You haven't blocked anyone. Blocked users can't see your posts or message you." },
    "close-friends": { title: "Close friends", description: "Add people to your close friends list. Share stories and posts with only this group." },
    language: { title: "Language", description: "Choose your app language. Currently set to English." },
    help: { title: "Help center", description: "Browse common topics, contact support, or report a problem with the app." },
    about: { title: "About Watcher", description: "Version 1.0.0\nWatcher — a neumorphic social platform for music lovers, artists and fans." },
  };

  const renderItem = (item: SettingsItem, idx: number) => {
    const Icon = item.icon;
    const colorClass = item.destructive ? "text-destructive" : "text-foreground";
    return (
      <button
        key={idx}
        onClick={item.action}
        disabled={!item.action && !item.toggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors disabled:cursor-default text-left"
      >
        <div className="neo-button-icon w-9 h-9 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${colorClass}`}>{item.label}</p>
          {item.sublabel && (
            <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
          )}
        </div>
        {item.badge && (
          <span className="text-[10px] font-semibold text-primary neo-card-inset px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        {item.toggle ? (
          <Switch
            checked={item.toggle.value}
            onCheckedChange={item.toggle.onChange}
            onClick={(e) => e.stopPropagation()}
          />
        ) : item.action ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : null}
      </button>
    );
  };

  const renderGroups = (groups: SettingsGroup[]) => (
    <div className="space-y-5 pb-8">
      {groups.map((group, gi) => {
        const filtered = search
          ? group.items.filter((i) =>
              (i.label + " " + (i.sublabel ?? "")).toLowerCase().includes(search.toLowerCase())
            )
          : group.items;
        if (filtered.length === 0) return null;
        return (
          <div key={gi}>
            {group.title && (
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 mb-2">
                {group.title}
              </h3>
            )}
            <div className="neo-card-inset rounded-2xl overflow-hidden divide-y divide-border/40">
              {filtered.map(renderItem)}
            </div>
          </div>
        );
      })}
    </div>
  );

  const titleMap: Record<SettingsPage, string> = {
    main: "Settings and activity",
    notifications: "Notifications",
    privacy: "Privacy",
    account: "Account center",
    saved: "Saved",
    archive: "Archive",
    activity: "Your activity",
    comments: "Comments",
    posts: "Posts",
    blocked: "Blocked accounts",
    "close-friends": "Close friends",
    language: "Language",
    data: "Data and media",
    help: "Help",
    about: "About",
  };

  let body: React.ReactNode;
  if (page === "main") body = renderGroups(mainGroups);
  else if (page === "notifications") body = renderGroups(notificationGroups);
  else if (page === "privacy") body = renderGroups(privacyGroups);
  else if (page === "comments") body = renderGroups(commentsGroups);
  else if (page === "posts") body = renderGroups(postsGroups);
  else if (page === "account") body = renderGroups(accountGroups);
  else if (page === "data") body = renderGroups(dataGroups);
  else if (page === "saved") body = <SavedPostsView />;
  else if (page === "archive") body = <ArchiveView />;
  else if (page === "activity") body = <ActivityView />;
  else {
    const info = simpleListPages[page];
    body = (
      <div className="px-4 pb-8">
        <div className="neo-card-inset rounded-2xl p-5">
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {info?.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-background border-l border-border/50 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            {page !== "main" && (
              <button
                onClick={back}
                className="neo-button-icon w-9 h-9 flex items-center justify-center flex-shrink-0"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <SheetTitle className="flex-1 text-left text-lg font-bold">
              {titleMap[page]}
            </SheetTitle>
          </div>
          {page === "main" && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search settings"
                className="neo-input pl-9 h-10 border-0"
              />
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pt-4">{body}</div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;

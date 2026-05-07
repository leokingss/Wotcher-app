import { TrendingUp, Sparkles } from "lucide-react";
import { trendingTags as trending, suggestedUsers as suggested } from "@/data/mockSocial";
import FriendCircleMenu from "./FriendCircleMenu";


const Sidebar = () => (
  <aside className="hidden lg:block w-72 shrink-0 sticky top-20 self-start space-y-4">
    <section className="neo-card p-4 rounded-2xl">
      <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
        <TrendingUp className="w-4 h-4 text-primary" /> Trending
      </h3>
      <ul className="space-y-2">
        {trending.map((t) => (
          <li key={t.tag} className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.tag}</span>
            <span className="text-[11px] text-muted-foreground">{t.posts}</span>
          </li>
        ))}
      </ul>
    </section>

    <section className="neo-card p-4 rounded-2xl">
      <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
        <Sparkles className="w-4 h-4 text-primary" /> Suggested
      </h3>
      <ul className="space-y-3">
        {suggested.map((u) => (
          <li key={u.username} className="flex items-center gap-3">
            <img src={u.avatar} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{u.username}</p>
              <p className="text-[11px] text-muted-foreground truncate">{u.name}</p>
            </div>
            <button
              aria-label={`Follow ${u.username}`}
              className="neo-button-icon w-8 h-8 flex items-center justify-center rounded-full text-primary"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  </aside>
);

export default Sidebar;

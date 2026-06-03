import { useNavigate } from "react-router-dom";
import { TrendingUp, Sparkles } from "lucide-react";
import { trendingTags as trending, suggestedUsers as suggested } from "@/data/mockSocial";
import FriendCircleMenu from "./FriendCircleMenu";

const Sidebar = () => {
  const navigate = useNavigate();
  return (
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
                <button onClick={() => navigate(`/profile/${u.username}`)} className="text-sm font-semibold truncate block text-left hover:underline">
                  {u.username}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">{u.name}</p>
              </div>
              <FriendCircleMenu username={u.username} />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
};

export default Sidebar;

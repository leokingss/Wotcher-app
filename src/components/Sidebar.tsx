import { TrendingUp, Sparkles, UserPlus } from "lucide-react";

const trending = [
  { tag: "#designsystem", posts: "12.4k posts" },
  { tag: "#neumorphism", posts: "8.1k posts" },
  { tag: "#fullstack", posts: "24k posts" },
  { tag: "#ambient", posts: "3.2k posts" },
];

const suggested = [
  { username: "alex.codes", name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" },
  { username: "lina_b", name: "Lina B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" },
  { username: "mr.synth", name: "Synth Master", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop" },
];

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

import { Globe2, Lock, Heart, Users, UsersRound, Check } from "lucide-react";
import type { FriendCircleEnum } from "@/hooks/useFriendCircles";
import { useFriendCircles } from "@/hooks/useFriendCircles";
import { CIRCLE_THEMES } from "@/lib/circleTheme";

interface AudiencePickerProps {
  value: FriendCircleEnum | null;
  onChange: (v: FriendCircleEnum | null) => void;
}

const ICONS: Record<FriendCircleEnum, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  private: Lock,
  family: Heart,
  friends: Users,
  groups: UsersRound,
};

const ORDER: FriendCircleEnum[] = ["private", "family", "friends", "groups"];

const AudiencePicker = ({ value, onChange }: AudiencePickerProps) => {
  const { counts } = useFriendCircles();
  const totalCircled = counts.private + counts.family + counts.friends + counts.groups;

  return (
    <div className="neo-card-inset rounded-xl p-2.5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
        Who can see this
      </p>

      {/* Public — full-width hero card */}
      <button
        onClick={() => onChange(null)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
          value === null ? "neo-card-inset" : "neo-button"
        }`}
      >
        <div className="w-9 h-9 rounded-full neo-button-icon flex items-center justify-center flex-shrink-0">
          <Globe2 className="w-4 h-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Public</div>
          <div className="text-[11px] text-muted-foreground">Anyone on Watcher</div>
        </div>
        {value === null && <Check className="w-4 h-4 text-foreground" />}
      </button>

      {/* Circle grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {ORDER.map((key) => {
          const theme = CIRCLE_THEMES[key];
          const Icon = ICONS[key];
          const active = value === key;
          const count = counts[key];
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`relative flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all text-left ${
                active ? "neo-card-inset" : "neo-button"
              }`}
              style={
                active
                  ? {
                      boxShadow: `inset 0 0 0 1.5px hsl(${theme.hsl}), inset 4px 4px 8px hsl(0 0% 0% / 0.35), inset -4px -4px 8px hsl(0 0% 100% / 0.04)`,
                    }
                  : undefined
              }
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundImage: theme.ring,
                  boxShadow: active ? `0 0 12px ${theme.glow}` : undefined,
                }}
              >
                <div className="w-[26px] h-[26px] rounded-full bg-background flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${theme.hsl})` }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: active ? `hsl(${theme.hsl})` : undefined }}>
                  {theme.label}
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {count} {count === 1 ? "member" : "members"}
                </div>
              </div>
              {active && (
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: `hsl(${theme.hsl})` }} />
              )}
            </button>
          );
        })}
      </div>

      {value && (
        <p className="px-1 pt-0.5 text-[10px] text-muted-foreground">
          Only people in your{" "}
          <span className="font-semibold" style={{ color: `hsl(${CIRCLE_THEMES[value].hsl})` }}>
            {CIRCLE_THEMES[value].label.toLowerCase()}
          </span>{" "}
          circle will see this story.
        </p>
      )}
      {value === null && totalCircled === 0 && (
        <p className="px-1 pt-0.5 text-[10px] text-muted-foreground">
          Tip: organize followers into circles by tapping their follow button.
        </p>
      )}
    </div>
  );
};

export default AudiencePicker;

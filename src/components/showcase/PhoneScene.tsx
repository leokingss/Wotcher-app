import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  RoundedBox,
  ContactShadows,
  useTexture,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { CHAPTERS, Chapter } from "./chapters";

const W = 2.0;
const H = (W * 1398) / 645;
const ACCENT = "#ffd400";

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const ALGOS = [
  {
    label: "Latest",
    icon: "◷",
    callout: "Pure chronological — the newest post always wins",
    order: [3, 0, 2, 1],
  },
  {
    label: "Popular",
    icon: "✷",
    callout: "Re-ranked by likes, bids and buzz in the last hour",
    order: [1, 2, 3, 0],
  },
  {
    label: "For You",
    icon: "✦",
    callout: "Shaped by what you play, save and bid on",
    order: [2, 3, 0, 1],
  },
];

/** Four stand-in feed rows that physically re-order as the mode changes. */
const ROWS = [
  { title: "lina_velvet · photo", meta: "2m ago", stat: "128", color: "#8fd3ff" },
  { title: "Live auction · vinyl", meta: "1h ago", stat: "4.2k", color: ACCENT },
  { title: "novaa · new single", meta: "22m ago", stat: "1.1k", color: "#ff9ad5" },
  { title: "kai_moves · clip", meta: "5m ago", stat: "312", color: "#9affc8" },
];

const ROW_H = 44;

/** The feed tab expanding into the three algorithm choices, drawn over the screen. */
function AlgoSheet({ open, active }: { open: number; active: number }) {
  if (open <= 0) return null;
  const algo = ALGOS[active];
  const statLabel = active === 0 ? "posted" : active === 1 ? "likes" : "match";

  return (
    <Html
      transform
      position={[0, H * 0.1, 0.13]}
      distanceFactor={2.6}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          width: 320,
          transform: `scale(${0.82 + open * 0.18})`,
          opacity: open,
          transformOrigin: "top center",
          borderRadius: 24,
          padding: 14,
          background: "linear-gradient(160deg,#232427,#161719)",
          border: "1px solid rgba(255,212,0,0.28)",
          boxShadow: "0 18px 50px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06)",
          fontFamily: "Manrope, Avenir, system-ui, sans-serif",
          color: "#fff",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#8b8d92",
            margin: "2px 0 10px 4px",
          }}
        >
          Choose your algorithm
        </p>

        {/* tab bar with a sliding neumorphic pill */}
        <div
          style={{
            position: "relative",
            display: "flex",
            padding: 4,
            borderRadius: 16,
            background: "#1a1b1d",
            boxShadow: "inset 3px 3px 8px rgba(0,0,0,.6), inset -2px -2px 6px rgba(255,255,255,.035)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              width: "calc(33.333% - 2.7px)",
              height: "calc(100% - 8px)",
              borderRadius: 12,
              background: "linear-gradient(135deg,rgba(255,212,0,.28),rgba(255,212,0,.1))",
              border: "1px solid rgba(255,212,0,.55)",
              transform: `translateX(${active * 100}%)`,
              transition: "transform .42s cubic-bezier(.22,1,.36,1)",
            }}
          />
          {ALGOS.map((a, i) => (
            <span
              key={a.label}
              style={{
                position: "relative",
                flex: 1,
                textAlign: "center",
                padding: "8px 0",
                fontSize: 13,
                fontWeight: 700,
                color: i === active ? ACCENT : "#8b8d92",
                transition: "color .3s ease",
              }}
            >
              <span style={{ marginRight: 5 }}>{a.icon}</span>
              {a.label}
            </span>
          ))}
        </div>

        {/* callout bubble */}
        <div
          key={algo.label}
          style={{
            position: "relative",
            margin: "14px 2px 12px",
            padding: "9px 12px",
            borderRadius: 14,
            fontSize: 12,
            lineHeight: 1.35,
            color: "#e8e8ea",
            background: "linear-gradient(135deg,rgba(255,212,0,.14),rgba(255,212,0,.04))",
            border: "1px solid rgba(255,212,0,.35)",
            animation: "showcase-callout .45s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -5,
              left: `calc(${16 + active * 33.3}% )`,
              width: 9,
              height: 9,
              transform: "rotate(45deg)",
              background: "rgba(58,52,20,1)",
              borderLeft: "1px solid rgba(255,212,0,.35)",
              borderTop: "1px solid rgba(255,212,0,.35)",
              transition: "left .42s cubic-bezier(.22,1,.36,1)",
            }}
          />
          {algo.callout}
        </div>

        {/* mini feed that re-orders per mode */}
        <div style={{ position: "relative", height: ROW_H * ROWS.length, margin: "0 2px" }}>
          {ROWS.map((r, i) => {
            const slot = algo.order.indexOf(i);
            const top = slot === 0;
            return (
              <div
                key={r.title}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: ROW_H - 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 10px",
                  borderRadius: 13,
                  background: top ? "rgba(255,212,0,.10)" : "#1d1e21",
                  border: top ? "1px solid rgba(255,212,0,.45)" : "1px solid rgba(255,255,255,.05)",
                  boxShadow: "4px 4px 10px rgba(0,0,0,.45), -3px -3px 8px rgba(255,255,255,.025)",
                  transform: `translateY(${slot * ROW_H}px)`,
                  transition: "transform .55s cubic-bezier(.22,1,.36,1), background .4s ease, border-color .4s ease",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: r.color,
                    opacity: top ? 1 : 0.55,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: top ? ACCENT : "#f2f2f3",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.title}
                  </span>
                  <span style={{ display: "block", fontSize: 10, color: "#8b8d92" }}>{r.meta}</span>
                </span>
                <span style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#d7d8da" }}>
                    {active === 0 ? r.meta.replace(" ago", "") : r.stat}
                  </span>
                  <span style={{ display: "block", fontSize: 9, color: "#75777c" }}>{statLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Html>
  );
}



function Finger({ chapter, t }: { chapter: Chapter; t: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  const grp = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!grp.current || !ring.current || !dot.current) return;
    const active = chapter.taps.find((tap) => t >= tap.at - 0.35 && t <= tap.at + 0.85);
    if (!active) {
      grp.current.visible = false;
      return;
    }
    grp.current.visible = true;
    const local = t - active.at;
    const drift = local < 0 ? 1 + Math.abs(local) * 0.6 : 1;
    const swipe = active.kind === "swipe" ? Math.max(0, Math.min(1, local / 0.7)) : 0;
    grp.current.position.set(
      (active.x * W) / 2,
      (active.y * H) / 2 + swipe * H * 0.28,
      0.14
    );
    const press = local < 0 ? 0 : Math.max(0, 1 - local / 0.85);
    const s = 0.075 * drift * (1 + (1 - press) * 1.9);
    ring.current.scale.setScalar(s);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = press * 0.55;
    dot.current.scale.setScalar(0.035 * (0.9 + press * 0.35));
    (dot.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + press * 0.5;
  });

  return (
    <group ref={grp}>
      <mesh ref={ring}>
        <ringGeometry args={[0.72, 1, 48]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.5} />
      </mesh>
      <mesh ref={dot}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Phone({
  index,
  prevIndex,
  t,
  turn,
  entry,
  exit,
}: {
  index: number;
  prevIndex: number;
  t: number;
  turn: number;
  entry: number;
  exit: number;
}) {
  const group = useRef<THREE.Group>(null);
  const textures = useTexture(CHAPTERS.map((c) => c.img));
  const list = useMemo(() => {
    const arr = Array.isArray(textures) ? textures : [textures];
    arr.forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    });
    return arr as THREE.Texture[];
  }, [textures]);

  const spin = Math.min(1, turn / 0.95);
  const showing = spin < 0.5 ? prevIndex : index;
  const chapter = CHAPTERS[showing];

  // Feed chapter: the algorithm tab expands over the feed between 1.0s and 4.6s
  const sheetOpen =
    showing === 0
      ? Math.max(
          0,
          Math.min(1, (t - 1.0) / 0.5) - Math.max(0, (t - 4.5) / 0.45)
        )
      : 0;
  const activeAlgo = t > 3.5 ? 2 : t > 2.3 ? 1 : 0;


  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    const eIn = ease(Math.max(0, Math.min(1, entry)));
    const eOut = ease(Math.max(0, Math.min(1, exit)));
    const flip = ease(spin) * Math.PI * 2;
    group.current.rotation.y =
      flip + Math.sin(time * 0.45) * 0.22 + (1 - eIn) * Math.PI * 1.2 + eOut * Math.PI * 1.4;
    group.current.rotation.x = Math.sin(time * 0.33) * 0.06;
    group.current.rotation.z = Math.sin(time * 0.27) * 0.03 + (1 - eIn) * 0.35 - eOut * 0.3;
    group.current.position.y = Math.sin(time * 0.6) * 0.07 - (1 - eIn) * 1.2 + eOut * 0.8;
    group.current.position.z = -(1 - eIn) * 6 - eOut * 7;
    const pop = 1 + Math.sin(ease(spin) * Math.PI) * 0.06;
    group.current.scale.setScalar(pop * (0.65 + eIn * 0.35) * (1 - eOut * 0.35));
  });


  return (
    <group ref={group}>
      {/* body */}
      <RoundedBox args={[W + 0.16, H + 0.16, 0.2]} radius={0.16} smoothness={6}>
        <meshStandardMaterial color="#171819" metalness={0.85} roughness={0.28} />
      </RoundedBox>
      {/* accent rim */}
      <RoundedBox args={[W + 0.19, H + 0.19, 0.14]} radius={0.17} smoothness={6}>
        <meshStandardMaterial
          color={ACCENT}
          metalness={0.9}
          roughness={0.35}
          emissive={ACCENT}
          emissiveIntensity={0.18}
        />
      </RoundedBox>
      {/* screen */}
      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={list[showing]} toneMapped={false} />
      </mesh>
      {/* glass sheen */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.04} />
      </mesh>
      <AlgoSheet open={sheetOpen} active={activeAlgo} />
      <Finger chapter={chapter} t={showing === index ? t : t + 99} />

    </group>
  );
}

function Orbiters() {
  const grp = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (grp.current) grp.current.rotation.y = s.clock.elapsedTime * 0.18;
  });
  const items = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => ({
        a: (i / 14) * Math.PI * 2,
        r: 3.1 + (i % 3) * 0.45,
        y: -2.2 + (i * 0.36) % 4.6,
        s: 0.03 + (i % 4) * 0.012,
      })),
    []
  );
  return (
    <group ref={grp}>
      {items.map((it, i) => (
        <mesh
          key={i}
          position={[Math.cos(it.a) * it.r, it.y, Math.sin(it.a) * it.r]}
        >
          <sphereGeometry args={[it.s, 12, 12]} />
          <meshBasicMaterial color={i % 3 === 0 ? ACCENT : "#8fd3ff"} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

interface Props {
  index: number;
  prevIndex: number;
  t: number;
  turn: number;
  entry?: number;
  exit?: number;
}

const PhoneScene = ({ index, prevIndex, t, turn, entry = 1, exit = 0 }: Props) => (
  <Canvas
    dpr={[1, 2]}
    camera={{ position: [0, 0, 11], fov: 28 }}
    gl={{ antialias: true, alpha: true }}
  >
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 6, 6]} intensity={1.5} />
    <directionalLight position={[-5, -2, 3]} intensity={0.7} color="#7fc8ff" />
    <pointLight position={[0, 0, 3]} intensity={12} color={ACCENT} distance={9} />
    <Suspense fallback={null}>
      <Phone
        index={index}
        prevIndex={prevIndex}
        t={t}
        turn={turn}
        entry={entry}
        exit={exit}
      />
      <Orbiters />

      <ContactShadows
        position={[0, -2.6, 0]}
        opacity={0.5}
        scale={11}
        blur={3}
        far={5}
      />
      <Environment preset="city" />
    </Suspense>
  </Canvas>
);

export default PhoneScene;

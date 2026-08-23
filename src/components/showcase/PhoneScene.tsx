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
  { label: "Latest", tag: "Newest first — pure chronological", icon: "◷" },
  { label: "Popular", tag: "Ranked by likes and buzz", icon: "✷" },
  { label: "For You", tag: "Shaped by what you play & save", icon: "✦" },
];

/** The feed tab expanding into the three algorithm choices, drawn over the screen. */
function AlgoSheet({ open, active }: { open: number; active: number }) {
  if (open <= 0) return null;
  return (
    <Html
      transform
      position={[0, H * 0.14, 0.13]}
      distanceFactor={2.6}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          width: 300,
          transform: `scale(${0.82 + open * 0.18})`,
          opacity: open,
          transformOrigin: "top center",
          borderRadius: 22,
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
        {ALGOS.map((a, i) => {
          const on = i === active;
          return (
            <div
              key={a.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                marginBottom: 8,
                borderRadius: 16,
                background: on
                  ? "linear-gradient(135deg,rgba(255,212,0,.18),rgba(255,212,0,.06))"
                  : "#1d1e21",
                border: on ? "1px solid rgba(255,212,0,.55)" : "1px solid rgba(255,255,255,.05)",
                boxShadow: on
                  ? "inset 2px 2px 6px rgba(0,0,0,.5)"
                  : "4px 4px 10px rgba(0,0,0,.45), -3px -3px 8px rgba(255,255,255,.03)",
                opacity: Math.min(1, Math.max(0, open * 3 - i * 0.6)),
              }}
            >
              <span style={{ fontSize: 18, color: on ? ACCENT : "#9a9ca1" }}>{a.icon}</span>
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 15,
                    fontWeight: 700,
                    color: on ? ACCENT : "#f2f2f3",
                  }}
                >
                  {a.label}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "#8b8d92" }}>{a.tag}</span>
              </span>
            </div>
          );
        })}
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

  // Feed chapter: the algorithm tab expands over the feed between 1.2s and 4.4s
  const sheetOpen =
    showing === 0
      ? Math.max(
          0,
          Math.min(1, (t - 1.2) / 0.55) - Math.max(0, (t - 4.4) / 0.5)
        )
      : 0;
  const activeAlgo = t > 3.3 ? 2 : t > 2.4 ? 1 : 0;

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
}

const PhoneScene = ({ index, prevIndex, t, turn }: Props) => (
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
      <Phone index={index} prevIndex={prevIndex} t={t} turn={turn} />
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

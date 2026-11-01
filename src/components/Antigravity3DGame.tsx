import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  ArrowLeft,
  CloudUpload,
  CheckCircle2,
} from 'lucide-react';
import {
  CyberArenaState,
  CyberEnemyEntity,
  CyberInputFrame,
  createInitialCyberArenaState,
  startCyberGameSession,
  toggleCyberGamePause,
  stepCyberArenaSimulation,
  ARENA_RADIUS,
} from '../utils/cyberGameEngine';
import { useLanguage } from '../context/LanguageContext';
import { auth, syncArchitectProgressToCloud, loadArchitectProgressFromCloud } from '../lib/firebase';

// Procedural Web Audio API Sound Effects (Zero external audio files)
class CyberAudioSynth {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'sawtooth', gainVal = 0.08) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio errors on restricted autoplay
    }
  }

  playLaser() {
    this.playTone(720, 180, 0.09, 'sawtooth', 0.05);
  }

  playEnemyHit() {
    this.playTone(320, 110, 0.07, 'square', 0.05);
  }

  playEnemyKilled() {
    this.playTone(480, 65, 0.22, 'sawtooth', 0.09);
  }

  playPlayerHit() {
    this.playTone(150, 45, 0.28, 'sawtooth', 0.12);
  }

  playDash() {
    this.playTone(260, 880, 0.14, 'sine', 0.07);
  }

  playPulseBlast() {
    this.playTone(540, 90, 0.38, 'triangle', 0.12);
  }

  playArtifactPickup() {
    this.playTone(520, 1040, 0.18, 'sine', 0.08);
  }
}

// Procedural CanvasTextures for Arena Floor & Contact Shadows (Zero external 404 URLs)
function createCyberGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#080e1e';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.26)';
    ctx.lineWidth = 2;
    const step = 64;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Subtle sub-grid and corner tech nodes
    ctx.fillStyle = 'rgba(96, 165, 250, 0.45)';
    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

// Composite 7-Part Articulated Player Agent Drone Mesh (Grounded at y = 0)
function buildPlayerDroneGroup(shadowTex: THREE.Texture): {
  root: THREE.Group;
  haloRing: THREE.Mesh;
  coreVisor: THREE.Mesh;
} {
  const root = new THREE.Group();

  // 1. Grounded Contact Shadow Disc
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  // 2. Main Armored Octagonal Chassis
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.28,
  });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, 0.55, 8), hullMat);
  hull.position.y = 0.65;
  root.add(hull);

  // 3. Glowing Cyan Sensor Visor Dome
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.6,
    metalness: 0.2,
    roughness: 0.15,
  });
  const coreVisor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), visorMat);
  coreVisor.scale.set(1, 0.65, 1.15);
  coreVisor.position.set(0, 0.88, 0.18);
  root.add(coreVisor);

  // 4 & 5. Dual Tilted Thruster Nacelles (Left & Right)
  const nacelleGeo = new THREE.BoxGeometry(0.28, 0.32, 0.95);
  const nacelleMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.32,
  });
  const leftNacelle = new THREE.Mesh(nacelleGeo, nacelleMat);
  leftNacelle.position.set(-0.78, 0.68, -0.08);
  root.add(leftNacelle);

  const rightNacelle = new THREE.Mesh(nacelleGeo, nacelleMat);
  rightNacelle.position.set(0.78, 0.68, -0.08);
  root.add(rightNacelle);

  // 6 & 7. Twin Forward Pulse Cannon Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.75, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.2,
    metalness: 0.5,
    roughness: 0.2,
  });
  const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  leftBarrel.position.set(-0.42, 0.68, 0.72);
  root.add(leftBarrel);

  const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  rightBarrel.position.set(0.42, 0.68, 0.72);
  root.add(rightBarrel);

  // 8. Orbiting Holographic Halo Ring
  const haloGeo = new THREE.TorusGeometry(0.98, 0.045, 8, 28);
  haloGeo.rotateX(Math.PI / 2);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    emissive: 0x3b82f6,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.3,
  });
  const haloRing = new THREE.Mesh(haloGeo, haloMat);
  haloRing.position.y = 0.35;
  root.add(haloRing);

  return { root, haloRing, coreVisor };
}

// Composite Multi-Part Enemy Archetype Builder (Swarmer, Ranged, Charger)
function buildEnemyGroup(
  archetype: CyberEnemyEntity['archetype'],
  shadowTex: THREE.Texture
): {
  root: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  coreMat: THREE.MeshStandardMaterial;
  spinner: THREE.Object3D;
  telegraphRing: THREE.Mesh;
} {
  const root = new THREE.Group();

  // Contact shadow disc at y = 0.02
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowScale = archetype === 'charger' ? 3.0 : archetype === 'ranged' ? 2.5 : 2.1;
  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(shadowScale, shadowScale),
    shadowMat
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Telegraph Ground Ring (visible windup indicator before attack)
  const teleGeo = new THREE.RingGeometry(0.85, 1.25, 24);
  teleGeo.rotateX(-Math.PI / 2);
  const teleMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
  });
  const telegraphRing = new THREE.Mesh(teleGeo, teleMat);
  telegraphRing.position.y = 0.05;
  root.add(telegraphRing);

  const spinner = new THREE.Group();
  root.add(spinner);

  if (archetype === 'swarmer') {
    // Crimson Context-Rot Bug: Jagged octahedron core + 3 spike fins
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      metalness: 0.65,
      roughness: 0.32,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), coreMat);
    core.position.y = 0.72;
    root.add(core);

    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 4), bodyMat);
      const a = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 0.65, 0.72, Math.sin(a) * 0.65);
      fin.rotation.z = Math.PI / 3;
      fin.rotation.y = -a;
      spinner.add(fin);
    }

    return { root, bodyMat, coreMat, spinner, telegraphRing };
  }

  if (archetype === 'ranged') {
    // Violet Hallucination Turret: Floating prism + counter-rotating gimbal rings
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4c1d95,
      metalness: 0.78,
      roughness: 0.25,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 1.5,
      roughness: 0.18,
    });

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.15, 6), bodyMat);
    column.position.y = 0.75;
    root.add(column);

    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), coreMat);
    eye.position.y = 1.38;
    root.add(eye);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.06, 8, 20), coreMat);
    ring.position.y = 1.05;
    spinner.add(ring);

    return { root, bodyMat, coreMat, spinner, telegraphRing };
  }

  // Charger: Heavy Amber-Gold Infinite-Loop Goliath
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    metalness: 0.82,
    roughness: 0.28,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 1.5,
    roughness: 0.22,
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.1, 1.35), bodyMat);
  torso.position.y = 0.78;
  root.add(torso);

  const reactor = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), coreMat);
  reactor.position.set(0, 0.85, 0.52);
  root.add(reactor);

  const leftPylon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.35, 0.75), coreMat);
  leftPylon.position.set(-0.88, 0.95, 0);
  spinner.add(leftPylon);

  const rightPylon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.35, 0.75), coreMat);
  rightPylon.position.set(0.88, 0.95, 0);
  spinner.add(rightPylon);

  return { root, bodyMat, coreMat, spinner, telegraphRing };
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

export const Antigravity3DGame: React.FC<{
  onExitToAcademy: () => void;
}> = ({ onExitToAcademy }) => {
  const { language } = useLanguage();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const synthRef = useRef<CyberAudioSynth | null>(null);

  const [hudState, setHudState] = useState<CyberArenaState>(() => {
    const autostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';
    return createInitialCyberArenaState(autostart ? 'playing' : 'title');
  });
  const [muted, setMuted] = useState<boolean>(false);
  const [cloudSaved, setCloudSaved] = useState<boolean>(false);
  const [cloudSaving, setCloudSaving] = useState<boolean>(false);

  const simStateRef = useRef<CyberArenaState>(hudState);
  const keysHeldRef = useRef<Set<string>>(new Set());
  const pointerDownRef = useRef<boolean>(false);
  const dashQueuedRef = useRef<boolean>(false);
  const pulseQueuedRef = useRef<boolean>(false);
  const aimWorldRef = useRef<{ x?: number; z?: number }>({});

  // Mirror lifecycle state to document.body.dataset.state as required by game_title_and_hud.md
  useEffect(() => {
    document.body.dataset.state = hudState.status;
    return () => {
      delete document.body.dataset.state;
    };
  }, [hudState.status]);

  const handleStartMission = useCallback(() => {
    const next = startCyberGameSession(simStateRef.current);
    simStateRef.current = next;
    setHudState(next);
    setCloudSaved(false);
    document.body.dataset.state = 'playing';
    synthRef.current?.playArtifactPickup();
  }, []);

  const handleTogglePause = useCallback(() => {
    const next = toggleCyberGamePause(simStateRef.current);
    simStateRef.current = next;
    setHudState(next);
    document.body.dataset.state = next.status;
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (synthRef.current) {
        synthRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const handleSaveScoreToFirestore = async () => {
    const user = auth.currentUser;
    if (!user || cloudSaving) return;
    setCloudSaving(true);
    try {
      const existing = await loadArchitectProgressFromCloud(user.uid);
      const bonusXp = Math.max(100, Math.round(hudState.score / 5));
      await syncArchitectProgressToCloud(user.uid, {
        architectName: existing?.architectName || user.displayName || 'Principal Cyber Architect',
        roleTitle: existing?.roleTitle || 'Staff Agentic Engineer',
        organization: existing?.organization || 'Google Antigravity Studio',
        completedModules: existing?.completedModules || ['module-1', 'module-2'],
        completedScenarioIds: existing?.completedScenarioIds || [],
        dailyTargetMinutes: existing?.dailyTargetMinutes || 45,
        totalMinutesStudied: (existing?.totalMinutesStudied || 60) + 15,
        totalCombinedXp: (existing?.totalCombinedXp || 1000) + bonusXp,
        currentLevel: Math.min(7, Math.max(1, existing?.currentLevel || 2)),
      });
      setCloudSaved(true);
    } catch {
      // Ignore if offline
    } finally {
      setCloudSaving(false);
    }
  };

  // Global keyboard shortcuts (Enter/Space on title, WASD, Shift Dash, E/Space fire/pulse, P/Esc Pause, M Mute, R Restart)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (simStateRef.current.status === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          handleStartMission();
          return;
        }
      }

      if (simStateRef.current.status === 'gameover') {
        if (code === 'Enter') {
          e.preventDefault();
          handleStartMission();
          return;
        }
      }

      if (key === 'p' || code === 'Escape') {
        if (
          simStateRef.current.status === 'playing' ||
          simStateRef.current.status === 'paused'
        ) {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      if (key === 'm') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (key === 'r' && simStateRef.current.status !== 'title') {
        e.preventDefault();
        handleStartMission();
        return;
      }

      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        dashQueuedRef.current = true;
      }

      if (key === 'e') {
        pulseQueuedRef.current = true;
      }

      keysHeldRef.current.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleStartMission, handleTogglePause, handleToggleMute]);

  // Main Three.js Scene Setup, Composite Entities, Pooled InstancedMesh & Software WebGL Guard Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    if (!synthRef.current) {
      synthRef.current = new CyberAudioSynth();
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    scene.fog = new THREE.FogExp2(0x060a14, 0.0155);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 140);
    camera.position.set(0, 22, 22);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    // Detect Software WebGL (SwiftShader / llvmpipe) per games_3d.md
    const gl = renderer.getContext();
    const debugBasic = gl.getParameter(gl.RENDERER) || '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const debugUnmasked = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '' : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(
      `${debugBasic} ${debugUnmasked}`
    );

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio IBL Environment via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Three-Point / Hemisphere Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 0.95);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff4d6, 2.5);
    dirLight.position.set(18, 32, 16);
    scene.add(dirLight);

    const playerPointLight = new THREE.PointLight(0x38bdf8, 3.2, 14);
    playerPointLight.position.set(0, 2.2, 0);
    scene.add(playerPointLight);

    // Procedural Textures
    const gridTex = createCyberGridTexture();
    const shadowTex = createContactShadowTexture();

    // Cybernetic Circular Arena Floor & Perimeter Energy Wall
    const floorGeo = new THREE.CircleGeometry(ARENA_RADIUS, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.62,
      metalness: 0.28,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floorMesh);

    const borderRingGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.22, 12, 72);
    borderRingGeo.rotateX(Math.PI / 2);
    const borderRingMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x2563eb,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const borderRing = new THREE.Mesh(borderRingGeo, borderRingMat);
    borderRing.position.y = 0.22;
    scene.add(borderRing);

    // 6 Perimeter Cyber Data Pylons around the Arena Rim
    const pylonGroup = new THREE.Group();
    const pylonGeo = new THREE.CylinderGeometry(0.45, 0.65, 4.2, 6);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const pylonCapGeo = new THREE.OctahedronGeometry(0.55, 0);
    const pylonCapMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * (ARENA_RADIUS + 1.2);
      const pz = Math.sin(a) * (ARENA_RADIUS + 1.2);
      const pNode = new THREE.Group();
      const base = new THREE.Mesh(pylonGeo, pylonMat);
      base.position.y = 2.1;
      const cap = new THREE.Mesh(pylonCapGeo, pylonCapMat);
      cap.position.y = 4.8;
      pNode.add(base, cap);
      pNode.position.set(px, 0, pz);
      pylonGroup.add(pNode);
    }
    scene.add(pylonGroup);

    // Player Agent Drone Composite Mesh
    const playerModel = buildPlayerDroneGroup(shadowTex);
    scene.add(playerModel.root);

    // Dynamic Maps for Enemy, Projectile & Artifact Pickup Meshes
    const enemyMeshes = new Map<
      string,
      ReturnType<typeof buildEnemyGroup>
    >();
    const projectileMeshes = new Map<string, THREE.Mesh>();
    const pickupMeshes = new Map<string, THREE.Group>();

    const sharedProjGeo = new THREE.SphereGeometry(0.32, 10, 10);
    const playerProjMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.0,
    });
    const enemyProjMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 2.0,
    });

    // Pooled InstancedMesh Particle Burst System (120 instances, zero GC churn)
    const MAX_PARTICLES = 120;
    const particleGeo = new THREE.OctahedronGeometry(0.22, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      MAX_PARTICLES
    );
    particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particleInstanced);

    const particles: PooledParticle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: -100,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      scale: 0,
      color: new THREE.Color(0x38bdf8),
    }));
    const dummyObj = new THREE.Object3D();

    const spawnParticles = (x: number, z: number, colorHex: number, count: number) => {
      let spawned = 0;
      for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
        if (!particles[i].active) {
          const p = particles[i];
          p.active = true;
          p.x = x;
          p.y = 0.8;
          p.z = z;
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 9;
          p.vx = Math.cos(angle) * speed;
          p.vy = 2.5 + Math.random() * 5.5;
          p.vz = Math.sin(angle) * speed;
          p.maxLife = 0.32 + Math.random() * 0.25;
          p.life = p.maxLife;
          p.scale = 0.7 + Math.random() * 0.8;
          p.color.setHex(colorHex);
          spawned++;
        }
      }
    };

    // Raycaster for pointer aim on the ground plane
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(groundPlane, intersectPoint)) {
        aimWorldRef.current = { x: intersectPoint.x, z: intersectPoint.z };
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        pointerDownRef.current = true;
      }
    };

    const onPointerUp = () => {
      pointerDownRef.current = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Frame pacing helper for Software WebGL vs Hardware GPU (per games_3d.md)
    let disposed = false;
    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccumulator = 0;

    function afterDraw(cb: (now: number) => void) {
      if (disposed) return;
      if (!isSoftwareGl || !(gl instanceof WebGL2RenderingContext)) {
        rafId = requestAnimationFrame(cb);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const deadline = performance.now() + 80;
      const poll = () => {
        if (disposed) return;
        const st = sync ? gl.clientWaitSync(sync, 0, 0) : gl.ALREADY_SIGNALED;
        if (
          st === gl.ALREADY_SIGNALED ||
          st === gl.CONDITION_SATISFIED ||
          performance.now() > deadline
        ) {
          if (sync) gl.deleteSync(sync);
          setTimeout(() => cb(performance.now()), 0);
        } else {
          setTimeout(poll, 4);
        }
      };
      setTimeout(poll, 0);
    }

    function tick(now: number) {
      if (disposed) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      const keys = keysHeldRef.current;
      let moveX = 0;
      let moveZ = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveZ -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveZ += 1;

      const inputFrame: CyberInputFrame = {
        moveX,
        moveZ,
        aimWorldX: aimWorldRef.current.x,
        aimWorldZ: aimWorldRef.current.z,
        fireHeld: pointerDownRef.current || keys.has('Space'),
        dashPressed: dashQueuedRef.current,
        pulsePressed: pulseQueuedRef.current,
      };
      dashQueuedRef.current = false;
      pulseQueuedRef.current = false;

      const prevBullets = simStateRef.current.projectiles.length;
      const nextState = stepCyberArenaSimulation(simStateRef.current, dt, inputFrame);
      simStateRef.current = nextState;

      if (
        nextState.status === 'playing' &&
        nextState.projectiles.length > prevBullets &&
        inputFrame.fireHeld
      ) {
        synthRef.current?.playLaser();
      }

      // Process Combat & Audio Events
      for (const ev of nextState.events) {
        if (ev.type === 'enemy_hit') {
          spawnParticles(ev.x, ev.z, ev.colorHex, 5);
          synthRef.current?.playEnemyHit();
        } else if (ev.type === 'enemy_killed') {
          spawnParticles(ev.x, ev.z, ev.colorHex, 16);
          synthRef.current?.playEnemyKilled();
        } else if (ev.type === 'player_hit') {
          spawnParticles(ev.x, ev.z, 0xef4444, 14);
          synthRef.current?.playPlayerHit();
        } else if (ev.type === 'dash') {
          spawnParticles(ev.x, ev.z, 0x38bdf8, 8);
          synthRef.current?.playDash();
        } else if (ev.type === 'pulse_blast') {
          spawnParticles(ev.x, ev.z, 0x10b981, 24);
          synthRef.current?.playPulseBlast();
        } else if (ev.type === 'artifact_collected' || ev.type === 'wave_cleared') {
          spawnParticles(ev.x, ev.z, 0x10b981, 14);
          synthRef.current?.playArtifactPickup();
        }
      }

      // Update Player Drone Transform
      playerModel.root.position.set(nextState.player.x, 0, nextState.player.z);
      playerModel.root.rotation.y = nextState.player.aimAngle;
      playerModel.haloRing.rotation.z += dt * 2.6;
      playerPointLight.position.set(nextState.player.x, 2.4, nextState.player.z);

      // Update Enemy Composite Meshes + Telegraph Indicators
      const activeEnemyIds = new Set<string>();
      for (const enemy of nextState.enemies) {
        activeEnemyIds.add(enemy.id);
        let entry = enemyMeshes.get(enemy.id);
        if (!entry) {
          entry = buildEnemyGroup(enemy.archetype, shadowTex);
          enemyMeshes.set(enemy.id, entry);
          scene.add(entry.root);
        }
        entry.root.position.set(enemy.x, 0, enemy.z);
        entry.root.rotation.y = enemy.facingAngle;
        entry.spinner.rotation.y += dt * 3.5;

        // Visible Windup Telegraph Flash & Ground Ring before attack
        if (enemy.phase === 'telegraph') {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.035);
          entry.coreMat.emissiveIntensity = 2.8 + pulse * 1.5;
          (entry.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.75;
          const s = 1.0 + pulse * 0.35;
          entry.telegraphRing.scale.set(s, s, s);
        } else if (enemy.hitFlashTimer > 0) {
          entry.coreMat.emissiveIntensity = 3.5;
          (entry.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.0;
        } else {
          entry.coreMat.emissiveIntensity = 1.4;
          (entry.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.0;
        }
      }

      for (const [id, entry] of enemyMeshes.entries()) {
        if (!activeEnemyIds.has(id)) {
          scene.remove(entry.root);
          enemyMeshes.delete(id);
        }
      }

      // Update Projectiles
      const activeProjIds = new Set<string>();
      for (const proj of nextState.projectiles) {
        activeProjIds.add(proj.id);
        let mesh = projectileMeshes.get(proj.id);
        if (!mesh) {
          mesh = new THREE.Mesh(
            sharedProjGeo,
            proj.owner === 'player' ? playerProjMat : enemyProjMat
          );
          projectileMeshes.set(proj.id, mesh);
          scene.add(mesh);
        }
        mesh.position.set(proj.x, 0.72, proj.z);
      }
      for (const [id, mesh] of projectileMeshes.entries()) {
        if (!activeProjIds.has(id)) {
          scene.remove(mesh);
          projectileMeshes.delete(id);
        }
      }

      // Update Collectible Artifact Pickups
      const activePickupIds = new Set<string>();
      for (const pk of nextState.pickups) {
        activePickupIds.add(pk.id);
        let pGroup = pickupMeshes.get(pk.id);
        if (!pGroup) {
          pGroup = new THREE.Group();
          const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 1.8,
            roughness: 0.15,
          });
          const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), crystalMat);
          crystal.position.y = 0.85;
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.75, 0.04, 8, 20),
            crystalMat
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.35;
          pGroup.add(crystal, ring);
          pickupMeshes.set(pk.id, pGroup);
          scene.add(pGroup);
        }
        pGroup.position.set(pk.x, Math.sin(now * 0.004) * 0.15, pk.z);
        pGroup.rotation.y += dt * 2.2;
      }
      for (const [id, pGroup] of pickupMeshes.entries()) {
        if (!activePickupIds.has(id)) {
          scene.remove(pGroup);
          pickupMeshes.delete(id);
        }
      }

      // Update Pooled InstancedMesh Particles
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.active) {
          p.life -= dt;
          if (p.life <= 0) {
            p.active = false;
            dummyObj.position.set(0, -100, 0);
            dummyObj.scale.setScalar(0);
            dummyObj.updateMatrix();
            particleInstanced.setMatrixAt(i, dummyObj.matrix);
          } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy -= 12.0 * dt;
            p.z += p.vz * dt;
            const ratio = Math.max(0, p.life / p.maxLife);
            dummyObj.position.set(p.x, Math.max(0.08, p.y), p.z);
            dummyObj.scale.setScalar(p.scale * ratio);
            dummyObj.rotation.x += dt * 6;
            dummyObj.rotation.y += dt * 6;
            dummyObj.updateMatrix();
            particleInstanced.setMatrixAt(i, dummyObj.matrix);
            particleInstanced.setColorAt(i, p.color);
          }
        } else {
          dummyObj.position.set(0, -100, 0);
          dummyObj.scale.setScalar(0);
          dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, dummyObj.matrix);
        }
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (particleInstanced.instanceColor) {
        particleInstanced.instanceColor.needsUpdate = true;
      }

      // Camera Controller: Orbital Showcase on Title, Tactical Follow + Trauma Shake when Playing
      if (nextState.status === 'title') {
        const orbitAngle = now * 0.00035;
        camera.position.set(
          Math.cos(orbitAngle) * 23,
          17.5,
          Math.sin(orbitAngle) * 23
        );
        camera.lookAt(0, 0.8, 0);
      } else {
        const shakeAmt = nextState.cameraTrauma * nextState.cameraTrauma * 0.85;
        const shakeX = (Math.random() - 0.5) * 2 * shakeAmt;
        const shakeZ = (Math.random() - 0.5) * 2 * shakeAmt;
        const targetCamX = nextState.player.x * 0.55 + shakeX;
        const targetCamZ = nextState.player.z * 0.55 + 19.5 + shakeZ;
        camera.position.x += (targetCamX - camera.position.x) * Math.min(1, 7 * dt);
        camera.position.y += (21.5 - camera.position.y) * Math.min(1, 7 * dt);
        camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, 7 * dt);
        camera.lookAt(
          nextState.player.x * 0.45,
          0.5,
          nextState.player.z * 0.45
        );
      }

      renderer.render(scene, camera);

      // Sync React HUD state at ~15Hz or immediately on lifecycle transition
      hudSyncAccumulator += dt;
      if (
        hudSyncAccumulator >= 0.065 ||
        nextState.status !== hudState.status
      ) {
        hudSyncAccumulator = 0;
        setHudState({ ...nextState });
      }

      afterDraw(tick);
    }

    afterDraw(tick);

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      envTarget.dispose();
      gridTex.dispose();
      shadowTex.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      borderRingGeo.dispose();
      borderRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  const hpPercent = Math.max(0, Math.min(100, Math.round((hudState.player.hp / hudState.player.maxHp) * 100)));
  const dashReady = hudState.player.dashCooldown <= 0.05;
  const pulseReady = hudState.player.pulseCooldown <= 0.05;

  return (
    <div
      data-testid="antigravity-3d-game-shell"
      dir="ltr"
      className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#060a14] text-slate-100 select-none font-mono"
    >
      {/* Full-Viewport Three.js WebGL Canvas Mount */}
      <div
        ref={mountRef}
        data-testid="threejs-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {/* STATE 1: TITLE SCREEN OVERLAY (30-40% negative space over live 3D arena, bespoke SVG emblem, single [data-start="true"] CTA) */}
      {hudState.status === 'title' && (
        <div
          data-testid="game-title-overlay"
          className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 pointer-events-none"
        >
          {/* Top Bar: Unobtrusive Exit to Academy Workbench & Audio Toggle */}
          <div className="flex items-center justify-between pointer-events-auto">
            <button
              type="button"
              onClick={onExitToAcademy}
              data-testid="exit-3d-game-btn"
              className="px-3.5 py-2 rounded-xl border border-slate-700/90 bg-[#090d16]/90 hover:border-blue-500 text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              <span>
                {language === 'en' ? 'Exit to Academy Workbench' : 'بازگشت به محیط آکادمی'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              aria-label="Toggle Game Audio"
              className="p-2.5 rounded-xl border border-slate-700/90 bg-[#090d16]/90 hover:border-blue-500 text-slate-200 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Center-Bottom Typographic Focal Lockup (Leaving upper/center 3D Arena unobstructed) */}
          <div className="max-w-xl mx-auto w-full text-center space-y-5 pb-4 pointer-events-auto">
            {/* Bespoke Inline SVG Emblem & Title Lockup */}
            <div className="inline-flex flex-col items-center">
              <svg
                viewBox="0 0 360 84"
                className="w-72 sm:w-88 h-auto"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="agTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <polygon
                  points="180,6 212,24 212,58 180,76 148,58 148,24"
                  fill="#090d16"
                  stroke="url(#agTitleGrad)"
                  strokeWidth="2.5"
                />
                <circle cx="180" cy="41" r="12" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
                <line x1="24" y1="41" x2="136" y2="41" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="224" y1="41" x2="336" y2="41" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" />
              </svg>

              <div className="text-[11px] font-bold tracking-[0.28em] text-cyan-400 uppercase">
                GOOGLE ANTIGRAVITY // THREE.JS TACTICAL ARENA
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
                CONTEXT ROT PURGE
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-2">
                {language === 'en'
                  ? 'Pilot the Autonomous Verification Drone. Eliminate Swarmer Bugs, Ranged Hallucination Nodes, and Infinite-Loop Chargers across 3 waves.'
                  : 'فرماندهی پهپاد صحت‌سنجی Antigravity: پاک‌سازی باگ‌های Context Rot و نودهای توهم در ۳ موج نبرد سه‌بعدی.'}
              </p>
            </div>

            {/* Single Primary Start CTA with data-start="true" */}
            <div>
              <button
                type="button"
                data-start="true"
                data-testid="start-3d-game-btn"
                onClick={handleStartMission}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 border border-blue-400/40 cursor-pointer transition-transform active:scale-95"
              >
                LAUNCH MISSION [ENTER]
              </button>
            </div>

            {/* Single Flat Control-Hint Line */}
            <div className="text-[11px] text-slate-300 bg-[#090d16]/90 border border-slate-800 px-4 py-2 rounded-lg inline-block">
              WASD / Arrows Move · Space / Click Fire · E EMP Pulse · Shift Dash · P Pause · M Mute
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: PLAYING PERIMETER HUD (<= 15% viewport footprint, ZERO backdrop-filter over WebGL) */}
      {hudState.status !== 'title' && (
        <div
          data-testid="game-playing-hud"
          className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex flex-wrap items-start justify-between gap-3 pointer-events-none"
        >
          {/* Top-Left Cluster: Custom SVG Hull Integrity Bar + Dash & EMP Pips + Wave */}
          <div className="bg-[#080d1a]/92 border border-slate-700/80 rounded-xl px-3.5 py-2.5 flex items-center gap-4 pointer-events-auto">
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>HULL INTEGRITY</span>
                <span className="tabular-nums text-cyan-400">{hpPercent}%</span>
              </div>
              {/* Custom Inline SVG Segmented Vitality Bar */}
              <svg width="148" height="12" viewBox="0 0 148 12" className="block">
                <rect x="0" y="0" width="148" height="12" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <rect
                  x="2"
                  y="2"
                  width={Math.round((144 * hpPercent) / 100)}
                  height="8"
                  rx="2"
                  fill={hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#ef4444'}
                />
              </svg>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            <div className="flex items-center gap-2.5 text-[10px] font-bold">
              <div
                className={`px-2 py-1 rounded border ${
                  dashReady
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                }`}
              >
                DASH [SHIFT]
              </div>
              <button
                type="button"
                onClick={() => {
                  pulseQueuedRef.current = true;
                }}
                className={`px-2 py-1 rounded border cursor-pointer ${
                  pulseReady
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                }`}
              >
                EMP [E]
              </button>
              <div className="px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-blue-300 tabular-nums">
                WAVE {hudState.wave}/{hudState.maxWaves}
              </div>
            </div>
          </div>

          {/* Top-Right Cluster: Score, Combo, Kills & Compact Utility Controls */}
          <div className="bg-[#080d1a]/92 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center gap-3.5 pointer-events-auto">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold">SCORE / XP</div>
              <div
                data-testid="game-hud-score"
                className="text-sm sm:text-base font-black text-white tabular-nums"
              >
                {hudState.score.toLocaleString()}
              </div>
            </div>

            <div className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tabular-nums">
              x{hudState.combo}
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 font-bold">ENEMIES LEFT</div>
              <div className="text-xs font-bold text-rose-400 tabular-nums">
                {hudState.enemies.length}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label="Mute or Unmute Audio"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Mute [M]"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={handleTogglePause}
                data-testid="game-pause-btn"
                aria-label="Pause or Resume Game"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Pause [P]"
              >
                {hudState.status === 'paused' ? (
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
              <button
                type="button"
                onClick={handleStartMission}
                aria-label="Restart Mission"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Restart [R]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={onExitToAcademy}
                data-testid="hud-exit-to-academy-btn"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: PAUSE MODAL OVERLAY */}
      {hudState.status === 'paused' && (
        <div
          data-testid="game-paused-modal"
          className="absolute inset-0 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#090d16] p-6 text-center space-y-5 shadow-2xl">
            <div className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              MISSION PAUSED
            </div>
            <h2 className="text-2xl font-black text-white">
              TACTICAL TELEMETRY STANDBY
            </h2>
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">SCORE</div>
                <div className="font-black text-white tabular-nums">{hudState.score}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">WAVE</div>
                <div className="font-black text-cyan-400 tabular-nums">
                  {hudState.wave}/{hudState.maxWaves}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PURGED</div>
                <div className="font-black text-emerald-400 tabular-nums">{hudState.kills}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleTogglePause}
                data-testid="resume-game-btn"
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase cursor-pointer"
              >
                Resume Mission [P]
              </button>
              <button
                type="button"
                onClick={handleStartMission}
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Restart [R]
              </button>
              <button
                type="button"
                onClick={onExitToAcademy}
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Academy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: GAME OVER / VICTORY MODAL OVERLAY */}
      {hudState.status === 'gameover' && (
        <div
          data-testid="game-gameover-modal"
          className="absolute inset-0 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#090d16] p-6 text-center space-y-5 shadow-2xl">
            <div
              className={`text-xs font-bold tracking-widest uppercase ${
                hudState.victory ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {hudState.victory
                ? 'ALL 3 WAVES CLEARED // ZERO CONTEXT ROT'
                : 'HULL BREACHED // CONTEXT ROT OVERFLOW'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {hudState.victory ? 'MISSION ACCOMPLISHED' : 'MISSION TERMINATED'}
            </h2>

            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">FINAL SCORE</div>
                <div className="text-base font-black text-white tabular-nums">
                  {hudState.score}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">BUGS PURGED</div>
                <div className="text-base font-black text-emerald-400 tabular-nums">
                  {hudState.kills}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">ARTIFACTS</div>
                <div className="text-base font-black text-cyan-400 tabular-nums">
                  {hudState.artifactsCollected}
                </div>
              </div>
            </div>

            {auth.currentUser && (
              <div>
                <button
                  type="button"
                  disabled={cloudSaved || cloudSaving}
                  onClick={() => void handleSaveScoreToFirestore()}
                  className="w-full py-2 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cloudSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>XP Synced to Cloud Firestore!</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>Sync +{Math.max(100, Math.round(hudState.score / 5))} XP to Firestore</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleStartMission}
                data-testid="play-again-btn"
                className="flex-1 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase cursor-pointer"
              >
                Play Again [Enter]
              </button>
              <button
                type="button"
                onClick={onExitToAcademy}
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Exit to Academy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

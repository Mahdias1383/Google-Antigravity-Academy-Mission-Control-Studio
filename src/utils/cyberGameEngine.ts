export type CyberGameLifecycleState = 'title' | 'playing' | 'paused' | 'gameover';

export type EnemyArchetype = 'swarmer' | 'ranged' | 'charger';

export type EnemyBehaviorPhase = 'pursue' | 'telegraph' | 'attack' | 'cooldown';

export interface Vec2D {
  x: number;
  z: number;
}

export interface CyberPlayerState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  aimAngle: number;
  hp: number;
  maxHp: number;
  dashCooldown: number;
  dashActiveTimer: number;
  fireCooldown: number;
  invulnerableTimer: number;
  pulseCooldown: number;
}

export interface CyberEnemyEntity {
  id: string;
  archetype: EnemyArchetype;
  x: number;
  z: number;
  vx: number;
  vz: number;
  facingAngle: number;
  hp: number;
  maxHp: number;
  radius: number;
  phase: EnemyBehaviorPhase;
  phaseTimer: number;
  chargeDirX: number;
  chargeDirZ: number;
  hitFlashTimer: number;
  scoreValue: number;
}

export interface CyberProjectile {
  id: string;
  owner: 'player' | 'enemy';
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  damage: number;
  ttl: number;
  colorHex: number;
}

export interface CyberArtifactPickup {
  id: string;
  label: 'task.md' | 'implementation_plan.md' | 'walkthrough.md';
  x: number;
  z: number;
  ttl: number;
}

export interface CyberImpactEvent {
  type: 'enemy_hit' | 'enemy_killed' | 'player_hit' | 'pulse_blast' | 'artifact_collected' | 'wave_cleared' | 'dash';
  x: number;
  z: number;
  colorHex: number;
}

export interface CyberArenaState {
  status: CyberGameLifecycleState;
  victory: boolean;
  wave: number;
  maxWaves: number;
  score: number;
  combo: number;
  comboTimer: number;
  kills: number;
  artifactsCollected: number;
  elapsedSeconds: number;
  hitstopTimer: number;
  cameraTrauma: number;
  arenaRadius: number;
  player: CyberPlayerState;
  enemies: CyberEnemyEntity[];
  projectiles: CyberProjectile[];
  pickups: CyberArtifactPickup[];
  events: CyberImpactEvent[];
}

export interface CyberInputFrame {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  aimWorldX?: number;
  aimWorldZ?: number;
  fireHeld: boolean;
  dashPressed: boolean;
  pulsePressed: boolean;
}

export const ARENA_RADIUS = 24;
export const MAX_ARENA_WAVES = 3;

export function clampDeltaTime(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt <= 0) return 0;
  return Math.min(rawDt, 0.05);
}

export function createInitialCyberArenaState(
  initialStatus: CyberGameLifecycleState = 'title'
): CyberArenaState {
  const state: CyberArenaState = {
    status: initialStatus,
    victory: false,
    wave: 1,
    maxWaves: MAX_ARENA_WAVES,
    score: 0,
    combo: 1,
    comboTimer: 0,
    kills: 0,
    artifactsCollected: 0,
    elapsedSeconds: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    arenaRadius: ARENA_RADIUS,
    player: {
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      aimAngle: 0,
      hp: 100,
      maxHp: 100,
      dashCooldown: 0,
      dashActiveTimer: 0,
      fireCooldown: 0,
      invulnerableTimer: 0,
      pulseCooldown: 0,
    },
    enemies: [],
    projectiles: [],
    pickups: [
      {
        id: 'pickup-init-1',
        label: 'task.md',
        x: -7,
        z: -6,
        ttl: 45,
      },
      {
        id: 'pickup-init-2',
        label: 'implementation_plan.md',
        x: 8,
        z: -5,
        ttl: 45,
      },
    ],
    events: [],
  };

  if (initialStatus === 'playing') {
    state.enemies = spawnWaveEnemies(1);
  }

  return state;
}

export function spawnWaveEnemies(wave: number): CyberEnemyEntity[] {
  const safeWave = Math.max(1, Math.min(10, Math.floor(wave)));
  const enemies: CyberEnemyEntity[] = [];

  // Wave composition with all 3 required enemy archetypes:
  // 1. 'swarmer' (Context-Rot Bug)
  // 2. 'ranged' (Hallucination Turret Node)
  // 3. 'charger' (Infinite-Loop Goliath)
  const swarmerCount = 2 + safeWave;
  const rangedCount = 1 + Math.floor(safeWave / 2);
  const chargerCount = Math.max(1, Math.floor((safeWave + 1) / 2));

  const total = swarmerCount + rangedCount + chargerCount;
  let index = 0;

  const pushArchetype = (archetype: EnemyArchetype) => {
    const angle = (index / total) * Math.PI * 2 + safeWave * 0.45;
    const spawnDist = 14 + (index % 3) * 2.5;
    const x = Math.cos(angle) * spawnDist;
    const z = Math.sin(angle) * spawnDist;

    if (archetype === 'swarmer') {
      enemies.push({
        id: `enemy-w${safeWave}-swarmer-${index}`,
        archetype: 'swarmer',
        x,
        z,
        vx: 0,
        vz: 0,
        facingAngle: angle + Math.PI,
        hp: 40 + safeWave * 10,
        maxHp: 40 + safeWave * 10,
        radius: 0.95,
        phase: 'pursue',
        phaseTimer: 0,
        chargeDirX: 0,
        chargeDirZ: 0,
        hitFlashTimer: 0,
        scoreValue: 150,
      });
    } else if (archetype === 'ranged') {
      enemies.push({
        id: `enemy-w${safeWave}-ranged-${index}`,
        archetype: 'ranged',
        x,
        z,
        vx: 0,
        vz: 0,
        facingAngle: angle + Math.PI,
        hp: 60 + safeWave * 15,
        maxHp: 60 + safeWave * 15,
        radius: 1.15,
        phase: 'pursue',
        phaseTimer: 1.2 + (index % 3) * 0.3,
        chargeDirX: 0,
        chargeDirZ: 0,
        hitFlashTimer: 0,
        scoreValue: 250,
      });
    } else {
      enemies.push({
        id: `enemy-w${safeWave}-charger-${index}`,
        archetype: 'charger',
        x,
        z,
        vx: 0,
        vz: 0,
        facingAngle: angle + Math.PI,
        hp: 95 + safeWave * 25,
        maxHp: 95 + safeWave * 25,
        radius: 1.35,
        phase: 'pursue',
        phaseTimer: 1.6 + (index % 2) * 0.4,
        chargeDirX: 0,
        chargeDirZ: 0,
        hitFlashTimer: 0,
        scoreValue: 400,
      });
    }
    index += 1;
  };

  for (let i = 0; i < swarmerCount; i++) pushArchetype('swarmer');
  for (let i = 0; i < rangedCount; i++) pushArchetype('ranged');
  for (let i = 0; i < chargerCount; i++) pushArchetype('charger');

  return enemies;
}

export function startCyberGameSession(state: CyberArenaState): CyberArenaState {
  const next = createInitialCyberArenaState('playing');
  next.arenaRadius = state.arenaRadius;
  return next;
}

export function toggleCyberGamePause(state: CyberArenaState): CyberArenaState {
  if (state.status === 'playing') {
    return { ...state, status: 'paused' };
  }
  if (state.status === 'paused') {
    return { ...state, status: 'playing' };
  }
  return state;
}

function clampToArenaCircle(x: number, z: number, maxRadius: number): Vec2D {
  const distSq = x * x + z * z;
  if (distSq <= maxRadius * maxRadius) {
    return { x, z };
  }
  const dist = Math.sqrt(distSq) || 1;
  return {
    x: (x / dist) * maxRadius,
    z: (z / dist) * maxRadius,
  };
}

export function stepCyberArenaSimulation(
  prevState: CyberArenaState,
  rawDt: number,
  input: CyberInputFrame
): CyberArenaState {
  if (prevState.status !== 'playing') {
    return prevState;
  }

  const dt = clampDeltaTime(rawDt);
  if (dt <= 0) return prevState;

  const events: CyberImpactEvent[] = [];
  let hitstopTimer = Math.max(0, prevState.hitstopTimer - dt);
  let cameraTrauma = Math.max(0, prevState.cameraTrauma - dt * 1.85);

  // During hitstop, freeze simulation physics slightly for impact feel
  if (hitstopTimer > 0) {
    return {
      ...prevState,
      hitstopTimer,
      cameraTrauma,
      events,
    };
  }

  const player: CyberPlayerState = { ...prevState.player };
  let score = prevState.score;
  let combo = prevState.combo;
  let comboTimer = Math.max(0, prevState.comboTimer - dt);
  if (comboTimer <= 0 && combo > 1) {
    combo = 1;
  }
  let kills = prevState.kills;
  let artifactsCollected = prevState.artifactsCollected;
  let wave = prevState.wave;
  let status: CyberGameLifecycleState = prevState.status;
  let victory = prevState.victory;

  // Cooldowns
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashActiveTimer = Math.max(0, player.dashActiveTimer - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
  player.pulseCooldown = Math.max(0, player.pulseCooldown - dt);

  // Normalize movement vector
  let moveX = input.moveX;
  let moveZ = input.moveZ;
  const moveMag = Math.hypot(moveX, moveZ);
  if (moveMag > 1) {
    moveX /= moveMag;
    moveZ /= moveMag;
  }

  // Trigger Quantum Dash
  if (input.dashPressed && player.dashCooldown <= 0) {
    player.dashCooldown = 2.2;
    player.dashActiveTimer = 0.22;
    player.invulnerableTimer = Math.max(player.invulnerableTimer, 0.28);
    const dashDirX = moveMag > 0.05 ? moveX : Math.sin(player.aimAngle);
    const dashDirZ = moveMag > 0.05 ? moveZ : Math.cos(player.aimAngle);
    player.vx = dashDirX * 26;
    player.vz = dashDirZ * 26;
    events.push({
      type: 'dash',
      x: player.x,
      z: player.z,
      colorHex: 0x38bdf8,
    });
  }

  const baseSpeed = player.dashActiveTimer > 0 ? 22 : 9.6;
  const targetVx = moveX * baseSpeed;
  const targetVz = moveZ * baseSpeed;
  const accel = player.dashActiveTimer > 0 ? 18 : 12;
  player.vx += (targetVx - player.vx) * Math.min(1, accel * dt);
  player.vz += (targetVz - player.vz) * Math.min(1, accel * dt);

  const clampedPlayerPos = clampToArenaCircle(
    player.x + player.vx * dt,
    player.z + player.vz * dt,
    prevState.arenaRadius - 1.2
  );
  player.x = clampedPlayerPos.x;
  player.z = clampedPlayerPos.z;

  // Aim orientation
  if (
    typeof input.aimWorldX === 'number' &&
    typeof input.aimWorldZ === 'number' &&
    Number.isFinite(input.aimWorldX) &&
    Number.isFinite(input.aimWorldZ)
  ) {
    const dx = input.aimWorldX - player.x;
    const dz = input.aimWorldZ - player.z;
    if (Math.hypot(dx, dz) > 0.1) {
      player.aimAngle = Math.atan2(dx, dz);
    }
  } else if (moveMag > 0.1) {
    player.aimAngle = Math.atan2(moveX, moveZ);
  } else if (prevState.enemies.length > 0) {
    // Auto-target nearest enemy when keyboard-only and stationary
    let nearest = prevState.enemies[0];
    let nearestDist = Math.hypot(nearest.x - player.x, nearest.z - player.z);
    for (let i = 1; i < prevState.enemies.length; i++) {
      const cand = prevState.enemies[i];
      const d = Math.hypot(cand.x - player.x, cand.z - player.z);
      if (d < nearestDist) {
        nearest = cand;
        nearestDist = d;
      }
    }
    player.aimAngle = Math.atan2(nearest.x - player.x, nearest.z - player.z);
  }

  const projectiles: CyberProjectile[] = prevState.projectiles.map((p) => ({ ...p }));
  const enemies: CyberEnemyEntity[] = prevState.enemies.map((e) => ({ ...e }));
  const pickups: CyberArtifactPickup[] = prevState.pickups
    .map((pk) => ({ ...pk, ttl: pk.ttl - dt }))
    .filter((pk) => pk.ttl > 0);

  // Primary twin pulse cannon fire
  if (input.fireHeld && player.fireCooldown <= 0) {
    player.fireCooldown = 0.16;
    const dirX = Math.sin(player.aimAngle);
    const dirZ = Math.cos(player.aimAngle);
    const speed = 28;
    projectiles.push({
      id: `proj-p-${prevState.elapsedSeconds.toFixed(3)}-${Math.random().toString(36).slice(2, 6)}`,
      owner: 'player',
      x: player.x + dirX * 1.1,
      z: player.z + dirZ * 1.1,
      vx: dirX * speed,
      vz: dirZ * speed,
      radius: 0.45,
      damage: 26,
      ttl: 1.6,
      colorHex: 0x38bdf8,
    });
  }

  // Shockwave Pulse Blast (EMP against nearby Context Rot)
  if (input.pulsePressed && player.pulseCooldown <= 0) {
    player.pulseCooldown = 4.5;
    cameraTrauma = Math.min(1, cameraTrauma + 0.35);
    events.push({
      type: 'pulse_blast',
      x: player.x,
      z: player.z,
      colorHex: 0x10b981,
    });
    const pulseRadius = 7.5;
    for (const enemy of enemies) {
      const dist = Math.hypot(enemy.x - player.x, enemy.z - player.z);
      if (dist <= pulseRadius) {
        enemy.hp -= 48;
        enemy.hitFlashTimer = 0.18;
        const pushAngle = Math.atan2(enemy.x - player.x, enemy.z - player.z);
        enemy.x += Math.sin(pushAngle) * 2.4;
        enemy.z += Math.cos(pushAngle) * 2.4;
      }
    }
  }

  // Update Enemies (3 Distinct AI Archetypes + Visible Windup Telegraphs)
  for (const enemy of enemies) {
    enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
    const dx = player.x - enemy.x;
    const dz = player.z - enemy.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const dirX = dx / dist;
    const dirZ = dz / dist;

    if (enemy.archetype === 'swarmer') {
      // Swarmer AI: pursues player, enters 0.35s telegraph before rapid lunge
      enemy.facingAngle = Math.atan2(dirX, dirZ);
      if (enemy.phase === 'pursue') {
        enemy.vx = dirX * 5.8;
        enemy.vz = dirZ * 5.8;
        if (dist < 3.6) {
          enemy.phase = 'telegraph';
          enemy.phaseTimer = 0.35;
          enemy.chargeDirX = dirX;
          enemy.chargeDirZ = dirZ;
          enemy.vx = 0;
          enemy.vz = 0;
        }
      } else if (enemy.phase === 'telegraph') {
        enemy.phaseTimer -= dt;
        enemy.vx = 0;
        enemy.vz = 0;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'attack';
          enemy.phaseTimer = 0.25;
        }
      } else if (enemy.phase === 'attack') {
        enemy.vx = enemy.chargeDirX * 14.5;
        enemy.vz = enemy.chargeDirZ * 14.5;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'cooldown';
          enemy.phaseTimer = 0.45;
        }
      } else {
        enemy.vx *= 0.85;
        enemy.vz *= 0.85;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'pursue';
        }
      }
    } else if (enemy.archetype === 'ranged') {
      // Ranged AI: maintains 10-13m standoff distance, enters 0.5s telegraph aim, fires plasma bolt
      enemy.facingAngle = Math.atan2(dirX, dirZ);
      if (enemy.phase === 'pursue') {
        const preferredDist = 11.0;
        const radialFactor = dist > preferredDist + 1.5 ? 1 : dist < preferredDist - 1.5 ? -0.8 : 0;
        // Strafe tangentially while keeping distance
        const tangentX = -dirZ;
        const tangentZ = dirX;
        enemy.vx = (dirX * radialFactor + tangentX * 0.7) * 4.2;
        enemy.vz = (dirZ * radialFactor + tangentZ * 0.7) * 4.2;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'telegraph';
          enemy.phaseTimer = 0.5;
          enemy.chargeDirX = dirX;
          enemy.chargeDirZ = dirZ;
        }
      } else if (enemy.phase === 'telegraph') {
        enemy.vx *= 0.7;
        enemy.vz *= 0.7;
        enemy.chargeDirX = dirX;
        enemy.chargeDirZ = dirZ;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'attack';
          enemy.phaseTimer = 0.1;
          projectiles.push({
            id: `proj-e-${enemy.id}-${prevState.elapsedSeconds.toFixed(2)}`,
            owner: 'enemy',
            x: enemy.x + enemy.chargeDirX * 1.2,
            z: enemy.z + enemy.chargeDirZ * 1.2,
            vx: enemy.chargeDirX * 13.5,
            vz: enemy.chargeDirZ * 13.5,
            radius: 0.48,
            damage: 14,
            ttl: 2.8,
            colorHex: 0xa855f7,
          });
        }
      } else {
        enemy.phase = 'pursue';
        enemy.phaseTimer = 1.85;
      }
    } else {
      // Charger AI: stalks slowly, locks bull-rush line during 0.6s telegraph, charges at high speed
      if (enemy.phase === 'pursue') {
        enemy.facingAngle = Math.atan2(dirX, dirZ);
        enemy.vx = dirX * 3.6;
        enemy.vz = dirZ * 3.6;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0 || dist < 9.5) {
          enemy.phase = 'telegraph';
          enemy.phaseTimer = 0.6;
          enemy.chargeDirX = dirX;
          enemy.chargeDirZ = dirZ;
          enemy.facingAngle = Math.atan2(dirX, dirZ);
          enemy.vx = 0;
          enemy.vz = 0;
        }
      } else if (enemy.phase === 'telegraph') {
        enemy.vx = 0;
        enemy.vz = 0;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'attack';
          enemy.phaseTimer = 0.65;
        }
      } else if (enemy.phase === 'attack') {
        enemy.vx = enemy.chargeDirX * 18.0;
        enemy.vz = enemy.chargeDirZ * 18.0;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'cooldown';
          enemy.phaseTimer = 0.85;
        }
      } else {
        enemy.vx *= 0.8;
        enemy.vz *= 0.8;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phase = 'pursue';
          enemy.phaseTimer = 1.9;
        }
      }
    }

    const nextEnemyPos = clampToArenaCircle(
      enemy.x + enemy.vx * dt,
      enemy.z + enemy.vz * dt,
      prevState.arenaRadius - 1.0
    );
    enemy.x = nextEnemyPos.x;
    enemy.z = nextEnemyPos.z;

    // Melee collision check with player
    const distToPlayer = Math.hypot(player.x - enemy.x, player.z - enemy.z);
    if (distToPlayer < enemy.radius + 0.75 && player.invulnerableTimer <= 0) {
      const contactDamage = enemy.archetype === 'charger' ? 22 : 12;
      player.hp = Math.max(0, player.hp - contactDamage);
      player.invulnerableTimer = 0.65;
      hitstopTimer = 0.045;
      cameraTrauma = Math.min(1, cameraTrauma + 0.55);
      combo = 1;
      events.push({
        type: 'player_hit',
        x: player.x,
        z: player.z,
        colorHex: 0xef4444,
      });
    }
  }

  // Update Projectiles & Check Collisions
  const survivingProjectiles: CyberProjectile[] = [];
  for (const proj of projectiles) {
    proj.x += proj.vx * dt;
    proj.z += proj.vz * dt;
    proj.ttl -= dt;

    if (
      proj.ttl <= 0 ||
      Math.hypot(proj.x, proj.z) > prevState.arenaRadius + 2
    ) {
      continue;
    }

    let consumed = false;
    if (proj.owner === 'player') {
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const d = Math.hypot(proj.x - enemy.x, proj.z - enemy.z);
        if (d <= proj.radius + enemy.radius) {
          enemy.hp -= proj.damage;
          enemy.hitFlashTimer = 0.14;
          consumed = true;
          events.push({
            type: 'enemy_hit',
            x: proj.x,
            z: proj.z,
            colorHex: 0x38bdf8,
          });
          break;
        }
      }
    } else {
      const d = Math.hypot(proj.x - player.x, proj.z - player.z);
      if (d <= proj.radius + 0.75) {
        consumed = true;
        if (player.invulnerableTimer <= 0) {
          player.hp = Math.max(0, player.hp - proj.damage);
          player.invulnerableTimer = 0.55;
          hitstopTimer = 0.04;
          cameraTrauma = Math.min(1, cameraTrauma + 0.45);
          combo = 1;
          events.push({
            type: 'player_hit',
            x: player.x,
            z: player.z,
            colorHex: 0xef4444,
          });
        }
      }
    }

    if (!consumed) {
      survivingProjectiles.push(proj);
    }
  }

  // Process Enemy Deaths & Artifact Drops
  const survivingEnemies: CyberEnemyEntity[] = [];
  const artifactLabels: CyberArtifactPickup['label'][] = [
    'task.md',
    'implementation_plan.md',
    'walkthrough.md',
  ];

  for (const enemy of enemies) {
    if (enemy.hp > 0) {
      survivingEnemies.push(enemy);
    } else {
      kills += 1;
      combo = Math.min(8, combo + 1);
      comboTimer = 4.5;
      score += enemy.scoreValue * combo;
      hitstopTimer = Math.max(hitstopTimer, 0.038);
      cameraTrauma = Math.min(1, cameraTrauma + 0.28);
      events.push({
        type: 'enemy_killed',
        x: enemy.x,
        z: enemy.z,
        colorHex:
          enemy.archetype === 'swarmer'
            ? 0xf43f5e
            : enemy.archetype === 'ranged'
            ? 0xa855f7
            : 0xf59e0b,
      });

      // Drop verified Antigravity Artifact crystal pickup on every second kill
      if (kills % 2 === 0) {
        pickups.push({
          id: `pickup-${kills}-${enemy.id}`,
          label: artifactLabels[kills % artifactLabels.length],
          x: enemy.x,
          z: enemy.z,
          ttl: 25,
        });
      }
    }
  }

  // Check Artifact Pickup Collection
  const remainingPickups: CyberArtifactPickup[] = [];
  for (const pk of pickups) {
    const d = Math.hypot(pk.x - player.x, pk.z - player.z);
    if (d <= 1.65) {
      artifactsCollected += 1;
      score += 300 * combo;
      player.hp = Math.min(player.maxHp, player.hp + 15);
      events.push({
        type: 'artifact_collected',
        x: pk.x,
        z: pk.z,
        colorHex: 0x10b981,
      });
    } else {
      remainingPickups.push(pk);
    }
  }

  // Check Defeat or Wave Progression / Victory
  if (player.hp <= 0) {
    status = 'gameover';
    victory = false;
  } else if (survivingEnemies.length === 0) {
    if (wave >= prevState.maxWaves) {
      status = 'gameover';
      victory = true;
      score += 1500;
      events.push({
        type: 'wave_cleared',
        x: player.x,
        z: player.z,
        colorHex: 0x10b981,
      });
    } else {
      wave += 1;
      score += 500 * wave;
      player.hp = Math.min(player.maxHp, player.hp + 25);
      const nextEnemies = spawnWaveEnemies(wave);
      survivingEnemies.push(...nextEnemies);
      events.push({
        type: 'wave_cleared',
        x: player.x,
        z: player.z,
        colorHex: 0x3b82f6,
      });
    }
  }

  return {
    ...prevState,
    status,
    victory,
    wave,
    score,
    combo,
    comboTimer,
    kills,
    artifactsCollected,
    elapsedSeconds: prevState.elapsedSeconds + dt,
    hitstopTimer,
    cameraTrauma,
    player,
    enemies: survivingEnemies,
    projectiles: survivingProjectiles,
    pickups: remainingPickups,
    events,
  };
}

import type { MatchRecord, Profile } from './profileStorage';

/** Conquistas: avaliadas após cada partida a partir do perfil e do resultado. */
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  check: (profile: Profile, record: MatchRecord) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'primeira-vitoria', name: 'Primeira Vitória', emoji: '🎉',
    description: 'Vença sua primeira partida.',
    check: (p) => p.stats.wins >= 1,
  },
  {
    id: 'veterano', name: 'Veterano', emoji: '🎖️',
    description: 'Vença 10 partidas.',
    check: (p) => p.stats.wins >= 10,
  },
  {
    id: 'maratonista', name: 'Maratonista', emoji: '🏃',
    description: 'Jogue 20 partidas.',
    check: (p) => p.stats.matches >= 20,
  },
  {
    id: 'colecionador-de-coroas', name: 'Colecionador de Coroas', emoji: '👑',
    description: 'Acumule 25 coroas.',
    check: (p) => p.stats.crowns >= 25,
  },
  {
    id: 'vitoria-perfeita', name: 'Vitória Perfeita', emoji: '💎',
    description: 'Vença uma partida com 3 coroas.',
    check: (_, r) => r.result === 'win' && r.myCrowns >= 3,
  },
  {
    id: 'muralha', name: 'Muralha', emoji: '🧱',
    description: 'Vença sem perder nenhuma torre.',
    check: (_, r) => r.result === 'win' && r.oppCrowns === 0,
  },
  {
    id: 'domador-de-maquinas', name: 'Domador de Máquinas', emoji: '🤖',
    description: 'Vença o bot no modo Difícil.',
    check: (_, r) => r.result === 'win' && r.vsBot && r.botDifficulty === 'hard',
  },
  {
    id: 'toque-de-mestre', name: 'Toque de Mestre', emoji: '✨',
    description: 'Use a habilidade de um campeão numa partida.',
    check: (_, r) => r.usedAbility === true,
  },
  {
    id: 'ascensao', name: 'Ascensão', emoji: '📈',
    description: 'Alcance 100 troféus.',
    check: (p) => p.trophies >= 100,
  },
  {
    id: 'lenda-da-arena', name: 'Lenda da Arena', emoji: '🌟',
    description: 'Alcance 500 troféus.',
    check: (p) => p.trophies >= 500,
  },
];

/** Retorna as conquistas recém-desbloqueadas e grava as datas no perfil (mutação no objeto novo). */
export function evaluateAchievements(profile: Profile, record: MatchRecord): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (profile.achievements[achievement.id]) continue;
    if (achievement.check(profile, record)) {
      profile.achievements[achievement.id] = new Date().toISOString();
      unlocked.push(achievement);
    }
  }
  return unlocked;
}

/** Caminho dos Troféus: arenas por faixa. */
export interface Arena {
  name: string;
  emoji: string;
  minTrophies: number;
}

export const ARENAS: Arena[] = [
  { name: 'Clareira dos Novatos', emoji: '🌱', minTrophies: 0 },
  { name: 'Ponte de Pedra', emoji: '🌉', minTrophies: 100 },
  { name: 'Dunas Escaldantes', emoji: '🏜️', minTrophies: 200 },
  { name: 'Picos Nevados', emoji: '🏔️', minTrophies: 300 },
  { name: 'Vale Noturno', emoji: '🌙', minTrophies: 450 },
  { name: 'Coliseu Real', emoji: '🏟️', minTrophies: 600 },
];

export function currentArena(trophies: number): Arena {
  return [...ARENAS].reverse().find((arena) => trophies >= arena.minTrophies) ?? ARENAS[0];
}

export function nextArena(trophies: number): Arena | null {
  return ARENAS.find((arena) => arena.minTrophies > trophies) ?? null;
}

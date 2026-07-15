import { applyBalancePatches, type BalanceChange } from './engine/balance';
import { validateAll, type CardDef } from './engine/model';
import { BALANCE_HISTORY } from './balanceHistory';

const MELEE = 0.8;
const AGGRO = 5.5;

/**
 * Catálogo de cartas — composição de componentes (ver engine/model.ts).
 * Nomes, valores e descrições são originais deste projeto.
 */
const RAW_CARDS: Record<string, CardDef> = {
  // ================= COMUNS =================
  flechas: {
    id: 'flechas', name: 'Flechas', rarity: 'comum', type: 'spell', subtype: 'dano-em-area',
    cost: 3, emoji: '🏹', color: '#8d6e63', tags: ['explosiva'],
    description: 'Uma salva de flechas cobre uma área ampla com dano leve.',
    components: { spell: { radius: 2.5, damage: 145 } },
  },
  bombardeiro: {
    id: 'bombardeiro', name: 'Bombardeiro', rarity: 'comum', type: 'troop', subtype: 'dano-em-area',
    cost: 2, emoji: '💣', color: '#607d8b', tags: ['terrestre', 'longo-alcance', 'explosiva'],
    description: 'Arremessa bombas que explodem em área. Não atinge alvos aéreos.',
    components: {
      health: { hp: 190 },
      movement: { speed: 1.6 },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: false },
      attack: { damage: 120, hitSpeed: 1.7, range: 4.5, splashRadius: 1.5 },
    },
  },
  arqueiras: {
    id: 'arqueiras', name: 'Arqueiras', rarity: 'comum', type: 'troop', subtype: 'suporte',
    cost: 3, emoji: '🏹', color: '#e91e8c', tags: ['terrestre', 'longo-alcance'], deployCount: 2,
    description: 'Dupla de atiradoras versáteis que atacam ar e terra.',
    components: {
      health: { hp: 180 },
      movement: { speed: 1.8 },
      targeting: { targets: 'any', aggroRange: 6, targetsAir: true },
      attack: { damage: 60, hitSpeed: 1.2, range: 4.5 },
    },
  },
  cavaleiro: {
    id: 'cavaleiro', name: 'Cavaleiro', rarity: 'comum', type: 'troop', subtype: 'tanque',
    cost: 3, emoji: '🛡️', color: '#e0a13e', tags: ['terrestre', 'corpo-a-corpo'],
    description: 'Guerreiro resistente de custo baixo. A cada 2 usos, o próximo sai EVOLUÍDO (escudo + vida extra).',
    components: {
      health: { hp: 790 },
      movement: { speed: 1.6 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 105, hitSpeed: 1.2, range: MELEE },
      evolution: { cyclesRequired: 2, multipliers: { hp: 1.2 }, bonusShield: 200 },
    },
  },
  lanceiros: {
    id: 'lanceiros', name: 'Lanceiros', rarity: 'comum', type: 'troop', subtype: 'enxame',
    cost: 2, emoji: '🔱', color: '#66bb6a', tags: ['terrestre', 'longo-alcance'], deployCount: 3,
    description: 'Trio frágil que arremessa lanças em alvos aéreos e terrestres.',
    components: {
      health: { hp: 110 },
      movement: { speed: 2.2 },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: true },
      attack: { damage: 35, hitSpeed: 1.7, range: 4 },
    },
  },
  salteadores: {
    id: 'salteadores', name: 'Salteadores', rarity: 'comum', type: 'troop', subtype: 'enxame',
    cost: 2, emoji: '🔪', color: '#4caf50', tags: ['terrestre', 'corpo-a-corpo'], deployCount: 3,
    description: 'Três facínoras rápidos com adagas afiadas.',
    components: {
      health: { hp: 130 },
      movement: { speed: 2.6 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 55, hitSpeed: 1.1, range: MELEE },
    },
  },
  esqueletos: {
    id: 'esqueletos', name: 'Esqueletos', rarity: 'comum', type: 'troop', subtype: 'enxame',
    cost: 1, emoji: '💀', color: '#8b7fd4', tags: ['terrestre', 'corpo-a-corpo'], deployCount: 3,
    description: 'Baratos, frágeis e ótimos para distrair.',
    components: {
      health: { hp: 80 },
      movement: { speed: 2.2 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 40, hitSpeed: 1.0, range: MELEE },
    },
  },
  morcegos: {
    id: 'morcegos', name: 'Morcegos', rarity: 'comum', type: 'troop', subtype: 'enxame',
    cost: 3, emoji: '🦇', color: '#7e57c2', tags: ['aerea', 'voadora', 'corpo-a-corpo'], deployCount: 3,
    description: 'Trio voador veloz que morde qualquer coisa.',
    components: {
      health: { hp: 120 },
      movement: { speed: 2.4, flying: true },
      targeting: { targets: 'any', aggroRange: AGGRO, targetsAir: true },
      attack: { damage: 50, hitSpeed: 1.1, range: 1.2 },
    },
  },
  canhao: {
    id: 'canhao', name: 'Canhão', rarity: 'comum', type: 'building', subtype: 'defesa',
    cost: 3, emoji: '🔫', color: '#795548', tags: ['terrestre'],
    description: 'Defesa barata que dispara em alvos terrestres.',
    components: {
      health: { hp: 700 },
      lifetime: { seconds: 30 },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: false },
      attack: { damage: 110, hitSpeed: 1.0, range: 5.5 },
    },
  },
  barbaros: {
    id: 'barbaros', name: 'Bárbaros', rarity: 'comum', type: 'troop', subtype: 'enxame',
    cost: 5, emoji: '⚔️', color: '#ff8f00', tags: ['terrestre', 'corpo-a-corpo'], deployCount: 4,
    description: 'Quarteto durão de machados. Difícil de remover sem área.',
    components: {
      health: { hp: 380 },
      movement: { speed: 1.6 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 75, hitSpeed: 1.4, range: MELEE },
    },
  },
  bobina: {
    id: 'bobina', name: 'Bobina de Choque', rarity: 'comum', type: 'building', subtype: 'defesa',
    cost: 4, emoji: '⚡', color: '#26c6da', tags: ['terrestre'],
    description: 'Torre elétrica que fulmina alvos aéreos e terrestres.',
    components: {
      health: { hp: 750 },
      lifetime: { seconds: 35 },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: true },
      attack: { damage: 95, hitSpeed: 1.1, range: 5.5 },
    },
  },
  nuvemDeMorcegos: {
    id: 'nuvemDeMorcegos', name: 'Nuvem de Morcegos', rarity: 'comum', type: 'troop', subtype: 'enxame',
    cost: 5, emoji: '🦇', color: '#5e35b1', tags: ['aerea', 'voadora', 'corpo-a-corpo'], deployCount: 6,
    description: 'Meia dúzia de morcegos famintos escurece o céu.',
    components: {
      health: { hp: 120 },
      movement: { speed: 2.4, flying: true },
      targeting: { targets: 'any', aggroRange: AGGRO, targetsAir: true },
      attack: { damage: 50, hitSpeed: 1.1, range: 1.2 },
    },
  },
  choque: {
    id: 'choque', name: 'Choque', rarity: 'comum', type: 'spell', subtype: 'controle',
    cost: 2, emoji: '⚡', color: '#00bcd4', tags: ['explosiva'],
    description: 'Descarga instantânea que causa dano leve e atordoa por meio segundo.',
    components: { spell: { radius: 2.5, damage: 75, stunSeconds: 0.5 } },
  },
  morteiro: {
    id: 'morteiro', name: 'Morteiro', rarity: 'comum', type: 'building', subtype: 'condicao-de-vitoria',
    cost: 4, emoji: '🎯', color: '#546e7a', tags: ['terrestre', 'longo-alcance', 'explosiva'],
    description: 'Artilharia de longuíssimo alcance com cadência lenta.',
    components: {
      health: { hp: 800 },
      lifetime: { seconds: 30 },
      targeting: { targets: 'any', aggroRange: 9, targetsAir: false },
      attack: { damage: 120, hitSpeed: 4.5, range: 9, splashRadius: 1.5 },
    },
  },

  // ================= RARAS =================
  bolaDeFogo: {
    id: 'bolaDeFogo', name: 'Bola de Fogo', rarity: 'rara', type: 'spell', subtype: 'dano-em-area',
    cost: 4, emoji: '🔥', color: '#f4511e', tags: ['explosiva'],
    description: 'Projétil flamejante com dano pesado em área média.',
    components: { spell: { radius: 2, damage: 350 } },
  },
  executor: {
    id: 'executor', name: 'Executor', rarity: 'rara', type: 'troop', subtype: 'assassino',
    cost: 4, emoji: '🤖', color: '#455a64', tags: ['terrestre', 'corpo-a-corpo'],
    description: 'Golpes devastadores em um único alvo. Frágil para o custo.',
    components: {
      health: { hp: 680 },
      movement: { speed: 1.8 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 340, hitSpeed: 1.7, range: MELEE },
    },
  },
  mosqueteira: {
    id: 'mosqueteira', name: 'Mosqueteira', rarity: 'rara', type: 'troop', subtype: 'suporte',
    cost: 4, emoji: '🎯', color: '#7e57c2', tags: ['terrestre', 'longo-alcance'],
    description: 'Tiro certeiro de longo alcance contra ar e terra.',
    components: {
      health: { hp: 400 },
      movement: { speed: 1.6 },
      targeting: { targets: 'any', aggroRange: 6.5, targetsAir: true },
      attack: { damage: 130, hitSpeed: 1.1, range: 5.5 },
    },
  },
  gigante: {
    id: 'gigante', name: 'Gigante', rarity: 'rara', type: 'troop', subtype: 'condicao-de-vitoria',
    cost: 5, emoji: '🗿', color: '#a1887f', tags: ['terrestre', 'corpo-a-corpo'],
    description: 'Montanha ambulante que ignora tropas e esmaga construções.',
    components: {
      health: { hp: 3100 },
      movement: { speed: 1.25 },
      targeting: { targets: 'buildings', aggroRange: 99 },
      attack: { damage: 210, hitSpeed: 1.5, range: 1.2 },
    },
  },
  postoDeLanceiros: {
    id: 'postoDeLanceiros', name: 'Posto de Lanceiros', rarity: 'rara', type: 'building', subtype: 'gerador',
    cost: 5, emoji: '🛖', color: '#8bc34a', tags: ['geradora'],
    description: 'Recruta um lanceiro de tempos em tempos enquanto durar.',
    components: {
      health: { hp: 900 },
      lifetime: { seconds: 50 },
      spawner: { cardId: 'lanceiros', count: 1, interval: 4.5 },
    },
  },
  valquiria: {
    id: 'valquiria', name: 'Valquíria', rarity: 'rara', type: 'troop', subtype: 'dano-em-area',
    cost: 4, emoji: '🪓', color: '#ef6c00', tags: ['terrestre', 'corpo-a-corpo', 'explosiva'],
    description: 'Giro de machado que acerta tudo ao redor.',
    components: {
      health: { hp: 780 },
      movement: { speed: 1.5 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 100, hitSpeed: 1.4, range: MELEE, splashRadius: 1.3 },
    },
  },
  ossuario: {
    id: 'ossuario', name: 'Ossuário', rarity: 'rara', type: 'building', subtype: 'gerador',
    cost: 3, emoji: '🪦', color: '#9575cd', tags: ['geradora'],
    description: 'Ergue esqueletos periodicamente; solta uma última leva ao ruir.',
    components: {
      health: { hp: 350 },
      lifetime: { seconds: 30 },
      spawner: { cardId: 'esqueletos', count: 1, interval: 3.5 },
      deathEffect: { spawn: { cardId: 'esqueletos', count: 4 } },
    },
  },
  torreBombas: {
    id: 'torreBombas', name: 'Torre de Bombas', rarity: 'rara', type: 'building', subtype: 'defesa',
    cost: 4, emoji: '💣', color: '#6d4c41', tags: ['terrestre', 'explosiva'],
    description: 'Defesa robusta que lança bombas em área contra tropas terrestres.',
    components: {
      health: { hp: 850 },
      lifetime: { seconds: 35 },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: false },
      attack: { damage: 100, hitSpeed: 1.6, range: 5.5, splashRadius: 1.5 },
    },
  },
  foguete: {
    id: 'foguete', name: 'Foguete', rarity: 'rara', type: 'spell', subtype: 'dano-em-area',
    cost: 6, emoji: '🚀', color: '#d84315', tags: ['explosiva'],
    description: 'Dano brutal em área pequena. Mira bem antes de gastar.',
    components: { spell: { radius: 1.5, damage: 700 } },
  },
  acampamento: {
    id: 'acampamento', name: 'Acampamento', rarity: 'rara', type: 'building', subtype: 'gerador',
    cost: 6, emoji: '⛺', color: '#ff7043', tags: ['geradora'],
    description: 'Treina uma dupla de bárbaros a cada leva.',
    components: {
      health: { hp: 1100 },
      lifetime: { seconds: 50 },
      spawner: { cardId: 'barbaros', count: 2, interval: 13 },
    },
  },
  torreDeChamas: {
    id: 'torreDeChamas', name: 'Torre de Chamas', rarity: 'rara', type: 'building', subtype: 'defesa',
    cost: 5, emoji: '🌋', color: '#e53935', tags: ['terrestre'],
    description: 'Jato contínuo que derrete tanques com rajadas rapidíssimas.',
    components: {
      health: { hp: 900 },
      lifetime: { seconds: 35 },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: true },
      attack: { damage: 42, hitSpeed: 0.35, range: 5.5 },
    },
  },
  javali: {
    id: 'javali', name: 'Javali de Guerra', rarity: 'rara', type: 'troop', subtype: 'condicao-de-vitoria',
    cost: 4, emoji: '🐗', color: '#8d6e63', tags: ['terrestre', 'corpo-a-corpo'],
    description: 'Galopa direto para as construções e salta o rio em qualquer ponto.',
    components: {
      health: { hp: 900 },
      movement: { speed: 2.6, jumpsRiver: true },
      targeting: { targets: 'buildings', aggroRange: 99 },
      attack: { damage: 150, hitSpeed: 1.5, range: MELEE },
    },
  },
  mago: {
    id: 'mago', name: 'Mago', rarity: 'rara', type: 'troop', subtype: 'dano-em-area',
    cost: 5, emoji: '🧙', color: '#42a5f5', tags: ['terrestre', 'longo-alcance', 'explosiva'],
    description: 'Bolas de fogo em área contra qualquer alvo.',
    components: {
      health: { hp: 380 },
      movement: { speed: 1.5 },
      targeting: { targets: 'any', aggroRange: 6, targetsAir: true },
      attack: { damage: 160, hitSpeed: 1.4, range: 5, splashRadius: 1.2 },
    },
  },
  pocoDeElixir: {
    id: 'pocoDeElixir', name: 'Poço de Elixir', rarity: 'rara', type: 'building', subtype: 'gerador',
    cost: 6, emoji: '💧', color: '#d94fd4', tags: ['geradora'],
    description: 'Investimento: produz elixir extra enquanto sobreviver.',
    components: {
      health: { hp: 750 },
      lifetime: { seconds: 60 },
      resource: { elixirInterval: 8 },
    },
  },
  curandeira: {
    id: 'curandeira', name: 'Curandeira', rarity: 'rara', type: 'troop', subtype: 'suporte',
    cost: 4, emoji: '💚', color: '#26a69a', tags: ['terrestre', 'cura'],
    description: 'Não ataca: emana uma aura que cura aliados próximos continuamente.',
    components: {
      health: { hp: 550 },
      movement: { speed: 1.5 },
      targeting: { targets: 'any', aggroRange: 0 },
      aura: { radius: 3, healPerSecond: 55 },
    },
  },

  // ================= ÉPICAS =================
  principe: {
    id: 'principe', name: 'Príncipe', rarity: 'epica', type: 'troop', subtype: 'assassino',
    cost: 5, emoji: '🐴', color: '#ffb300', tags: ['terrestre', 'corpo-a-corpo', 'carregadora'],
    description: 'Após galopar uma distância, o próximo golpe causa o dobro de dano.',
    components: {
      health: { hp: 1050 },
      movement: { speed: 1.6 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 190, hitSpeed: 1.4, range: 1.0 },
      charge: { distance: 3, multiplier: 2 },
    },
  },
  dragaozinho: {
    id: 'dragaozinho', name: 'Dragão Jovem', rarity: 'epica', type: 'troop', subtype: 'dano-em-area',
    cost: 4, emoji: '🐉', color: '#66bb6a', tags: ['aerea', 'voadora', 'explosiva'],
    description: 'Voa e cospe fogo em área. Equilibrado e difícil de punir.',
    components: {
      health: { hp: 720 },
      movement: { speed: 1.8, flying: true },
      targeting: { targets: 'any', aggroRange: 5.5, targetsAir: true },
      attack: { damage: 100, hitSpeed: 1.5, range: 3.5, splashRadius: 1.2 },
    },
  },
  legiaoDeOssos: {
    id: 'legiaoDeOssos', name: 'Legião de Ossos', rarity: 'epica', type: 'troop', subtype: 'enxame',
    cost: 3, emoji: '☠️', color: '#673ab7', tags: ['terrestre', 'corpo-a-corpo'], deployCount: 10,
    description: 'Dez esqueletos de uma vez. Afoga qualquer alvo único.',
    components: {
      health: { hp: 80 },
      movement: { speed: 2.2 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 40, hitSpeed: 1.0, range: MELEE },
    },
  },
  bruxa: {
    id: 'bruxa', name: 'Bruxa', rarity: 'epica', type: 'troop', subtype: 'gerador',
    cost: 5, emoji: '🧹', color: '#ab47bc', tags: ['terrestre', 'longo-alcance', 'geradora'],
    description: 'Ataca em área leve e ergue esqueletos enquanto avança.',
    components: {
      health: { hp: 520 },
      movement: { speed: 1.5 },
      targeting: { targets: 'any', aggroRange: 6, targetsAir: true },
      attack: { damage: 90, hitSpeed: 1.1, range: 5, splashRadius: 1 },
      spawner: { cardId: 'esqueletos', count: 3, interval: 7 },
    },
  },
  relampago: {
    id: 'relampago', name: 'Relâmpago', rarity: 'epica', type: 'spell', subtype: 'controle',
    cost: 6, emoji: '🌩️', color: '#fdd835', tags: ['explosiva'],
    description: 'Três raios atingem os inimigos de MAIOR vida na área, com atordoamento.',
    components: { spell: { radius: 3.5, damage: 560, stunSeconds: 0.5, multiTargetCount: 3 } },
  },
  barrilSurpresa: {
    id: 'barrilSurpresa', name: 'Barril Surpresa', rarity: 'epica', type: 'spell', subtype: 'utilidade',
    cost: 3, emoji: '🛢️', color: '#7cb342', tags: ['geradora'],
    description: 'Arremessa um barril em QUALQUER lugar da arena; salteadores saem dele.',
    components: { spell: { radius: 1.5, spawn: { cardId: 'salteadores', count: 3 } } },
  },
  carregadorDeBomba: {
    id: 'carregadorDeBomba', name: 'Carregador de Bomba', rarity: 'epica', type: 'troop', subtype: 'tanque',
    cost: 6, emoji: '💀', color: '#78909c', tags: ['terrestre', 'corpo-a-corpo', 'explosiva'],
    description: 'Mira construções e larga uma bomba enorme ao morrer.',
    components: {
      health: { hp: 1400 },
      movement: { speed: 1.4 },
      targeting: { targets: 'buildings', aggroRange: 99 },
      attack: { damage: 140, hitSpeed: 1.5, range: 1.2 },
      deathEffect: { damage: { radius: 2, damage: 360 } },
    },
  },
  dirigivel: {
    id: 'dirigivel', name: 'Dirigível', rarity: 'epica', type: 'troop', subtype: 'condicao-de-vitoria',
    cost: 5, emoji: '🎈', color: '#ef5350', tags: ['aerea', 'voadora', 'explosiva'],
    description: 'Voa por cima de tudo rumo às torres; solta uma bomba ao cair.',
    components: {
      health: { hp: 750 },
      movement: { speed: 1.5, flying: true },
      targeting: { targets: 'buildings', aggroRange: 99 },
      attack: { damage: 400, hitSpeed: 2, range: MELEE },
      deathEffect: { damage: { radius: 1.5, damage: 200 } },
    },
  },
  furia: {
    id: 'furia', name: 'Fúria', rarity: 'epica', type: 'spell', subtype: 'utilidade',
    cost: 2, emoji: '😈', color: '#ec407a', tags: [],
    description: 'Enfurece aliados na área: movimento e ataque mais rápidos.',
    components: { spell: { radius: 3.5, rageSeconds: 6 } },
  },
  balestra: {
    id: 'balestra', name: 'Balestra', rarity: 'epica', type: 'building', subtype: 'condicao-de-vitoria',
    cost: 6, emoji: '🏹', color: '#5d4037', tags: ['terrestre', 'longo-alcance'],
    description: 'Besta gigante de alcance absurdo e cadência altíssima.',
    components: {
      health: { hp: 900 },
      lifetime: { seconds: 35 },
      targeting: { targets: 'any', aggroRange: 10, targetsAir: false },
      attack: { damage: 30, hitSpeed: 0.3, range: 10 },
    },
  },
  congelamento: {
    id: 'congelamento', name: 'Congelamento', rarity: 'epica', type: 'spell', subtype: 'controle',
    cost: 4, emoji: '❄️', color: '#4fc3f7', tags: [],
    description: 'Paralisa inimigos na área por alguns segundos. Não causa dano.',
    components: { spell: { radius: 3, freezeSeconds: 4 } },
  },
  colosso: {
    id: 'colosso', name: 'Colosso de Aço', rarity: 'epica', type: 'troop', subtype: 'tanque',
    cost: 7, emoji: '🦾', color: '#37474f', tags: ['terrestre', 'corpo-a-corpo'],
    description: 'Lento, caro e absolutamente devastador golpe a golpe.',
    components: {
      health: { hp: 2500 },
      movement: { speed: 1.2 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 510, hitSpeed: 1.8, range: MELEE },
    },
  },
  espelho: {
    id: 'espelho', name: 'Espelho', rarity: 'epica', type: 'mirror', subtype: 'utilidade',
    cost: 0, emoji: '🪞', color: '#b39ddb', tags: [],
    description: 'Repete a última carta que você jogou, por +1 de elixir.',
    components: {},
  },
  golem: {
    id: 'golem', name: 'Golem', rarity: 'epica', type: 'troop', subtype: 'condicao-de-vitoria',
    cost: 8, emoji: '🪨', color: '#6d4c41', tags: ['terrestre', 'corpo-a-corpo', 'explosiva'],
    description: 'Colosso de pedra que se parte em dois fragmentos ao morrer.',
    components: {
      health: { hp: 3400 },
      movement: { speed: 1.1 },
      targeting: { targets: 'buildings', aggroRange: 99 },
      attack: { damage: 195, hitSpeed: 1.5, range: 1.2 },
      deathEffect: { spawn: { cardId: 'fragmentoDeGolem', count: 2 } },
    },
  },
  guardiaoRunico: {
    id: 'guardiaoRunico', name: 'Guardião Rúnico', rarity: 'epica', type: 'troop', subtype: 'tanque',
    cost: 4, emoji: '🔰', color: '#3f51b5', tags: ['terrestre', 'corpo-a-corpo', 'escudo'],
    description: 'Um escudo rúnico absorve o dano antes da vida. Quebre-o primeiro.',
    components: {
      health: { hp: 600, shield: 500 },
      movement: { speed: 1.5 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 110, hitSpeed: 1.3, range: MELEE },
    },
  },
  laminaFaminta: {
    id: 'laminaFaminta', name: 'Lâmina Faminta', rarity: 'epica', type: 'troop', subtype: 'assassino',
    cost: 4, emoji: '🗡️', color: '#c62828', tags: ['terrestre', 'corpo-a-corpo'],
    description: 'Rouba vida a cada golpe e se restaura ao eliminar inimigos.',
    components: {
      health: { hp: 620 },
      movement: { speed: 2.0 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 160, hitSpeed: 1.2, range: MELEE, lifestealPct: 0.4, healOnKill: 120 },
    },
  },
  nevoaVenenosa: {
    id: 'nevoaVenenosa', name: 'Névoa Venenosa', rarity: 'epica', type: 'spell', subtype: 'dano-em-area',
    cost: 4, emoji: '☠️', color: '#7cb342', tags: ['veneno'],
    description: 'Deixa uma nuvem tóxica que corrói tudo na área por 8 segundos.',
    components: {
      spell: {
        radius: 2.5,
        damage: 0,
        zone: { durationSeconds: 8, pulseDamage: 55, pulseInterval: 1 },
      },
    },
  },
  trollRegenerante: {
    id: 'trollRegenerante', name: 'Troll Regenerante', rarity: 'epica', type: 'troop', subtype: 'tanque',
    cost: 5, emoji: '🧌', color: '#558b2f', tags: ['terrestre', 'corpo-a-corpo', 'cura'],
    description: 'Regenera vida sem parar. Mate-o rápido ou não o mate nunca.',
    components: {
      health: { hp: 1600, regenPerSecond: 45 },
      movement: { speed: 1.3 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 130, hitSpeed: 1.5, range: MELEE },
    },
  },

  // ================= CAMPEÕES =================
  campeaValente: {
    id: 'campeaValente', name: 'Campeã Valente', rarity: 'epica', type: 'champion', subtype: 'tanque',
    cost: 4, emoji: '⚜️', color: '#ffd700', tags: ['terrestre', 'corpo-a-corpo', 'escudo'],
    description: 'Campeã com habilidade ativa: Bastião ergue um escudo e a enfurece por alguns segundos. Máximo de 1 campeão por deck.',
    components: {
      health: { hp: 1200 },
      movement: { speed: 1.6 },
      targeting: { targets: 'any', aggroRange: AGGRO },
      attack: { damage: 140, hitSpeed: 1.2, range: MELEE },
      ability: {
        name: 'Bastião',
        description: 'Ganha 400 de escudo e fúria por 3s.',
        cost: 2,
        cooldownSeconds: 14,
        effect: { shieldGain: 400, rageSelfSeconds: 3 },
      },
    },
  },
  mestreDasTempestades: {
    id: 'mestreDasTempestades', name: 'Mestre das Tempestades', rarity: 'epica', type: 'champion', subtype: 'dano-em-area',
    cost: 5, emoji: '🌪️', color: '#4dd0e1', tags: ['terrestre', 'longo-alcance', 'explosiva'],
    description: 'Campeão à distância. Habilidade: Vendaval causa dano em área ao seu redor e o cura. Máximo de 1 campeão por deck.',
    components: {
      health: { hp: 620 },
      movement: { speed: 1.5 },
      targeting: { targets: 'any', aggroRange: 6, targetsAir: true },
      attack: { damage: 150, hitSpeed: 1.3, range: 5 },
      ability: {
        name: 'Vendaval',
        description: 'Dano de 260 num raio de 2,5 e cura 200 em si.',
        cost: 3,
        cooldownSeconds: 16,
        effect: { damage: 260, radius: 2.5, healSelf: 200 },
      },
    },
  },

  // ================= INTERNAS =================
  fragmentoDeGolem: {
    id: 'fragmentoDeGolem', name: 'Fragmento de Golem', rarity: 'epica', type: 'troop', subtype: 'tanque',
    cost: 0, emoji: '🪨', color: '#8d6e63', tags: ['terrestre', 'corpo-a-corpo'], hidden: true,
    description: 'Pedaço vivo de um golem destruído.',
    components: {
      health: { hp: 700 },
      movement: { speed: 1.1 },
      targeting: { targets: 'buildings', aggroRange: 99 },
      attack: { damage: 60, hitSpeed: 1.5, range: 1.0 },
      deathEffect: { damage: { radius: 1.2, damage: 80 } },
    },
  },
};

// Aplica o histórico de balanceamento (dados, não código) e valida tudo.
const failedPatches: BalanceChange[] = applyBalancePatches(RAW_CARDS, BALANCE_HISTORY);
if (failedPatches.length > 0) {
  throw new Error(`Patches de balanceamento inválidos: ${failedPatches.map((p) => `${p.cardId}.${p.attribute}`).join(', ')}`);
}
const issues = validateAll(RAW_CARDS);
if (issues.length > 0) {
  throw new Error(`Cartas inválidas: ${issues.map((i) => `${i.cardId}.${i.field} (${i.message})`).join('; ')}`);
}

export const CARDS: Record<string, CardDef> = RAW_CARDS;

/** Deck inicial. */
export const DEFAULT_DECK: string[] = [
  'cavaleiro',
  'arqueiras',
  'salteadores',
  'esqueletos',
  'flechas',
  'bolaDeFogo',
  'canhao',
  'mosqueteira',
];

export function getCard(cardId: string): CardDef | undefined {
  return CARDS[cardId];
}

/** Cartas visíveis na coleção e válidas em decks. */
export function collectionCards(): CardDef[] {
  return Object.values(CARDS).filter((card) => !card.hidden);
}

export const DECK_SIZE = 8;
export const MAX_CARD_LEVEL = 3;
/** Bônus de vida/dano por nível acima do 1 (+8% por nível) */
export const LEVEL_STAT_BONUS = 0.08;

export function levelMultiplier(level: number | undefined): number {
  const clamped = Math.min(MAX_CARD_LEVEL, Math.max(1, level ?? 1));
  return 1 + LEVEL_STAT_BONUS * (clamped - 1);
}

/** Sanitiza níveis vindos do cliente: só cartas existentes, 1..MAX. */
export function sanitizeCardLevels(raw: unknown): Record<string, number> {
  const levels: Record<string, number> = {};
  if (raw && typeof raw === 'object') {
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (CARDS[id] && typeof value === 'number' && Number.isFinite(value)) {
        levels[id] = Math.min(MAX_CARD_LEVEL, Math.max(1, Math.round(value)));
      }
    }
  }
  return levels;
}

/** Valida um deck: 8 cartas únicas, existentes, não internas e no máx. 1 campeão. */
export function isValidDeck(deck: unknown): deck is string[] {
  if (
    !Array.isArray(deck) ||
    deck.length !== DECK_SIZE ||
    !deck.every(
      (id) => typeof id === 'string' && CARDS[id] !== undefined && CARDS[id].hidden !== true,
    ) ||
    new Set(deck).size !== DECK_SIZE
  ) {
    return false;
  }
  const champions = deck.filter((id) => CARDS[id].type === 'champion').length;
  return champions <= 1;
}

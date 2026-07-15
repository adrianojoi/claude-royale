import { useEffect, useState } from 'react';
import { getCard, type BotDifficulty } from '@claude-royale/shared';
import { fetchLeaderboard, type JoinBattleOptions } from '../net/connection';
import { ARENA_PALETTES, isArenaTheme, type ArenaTheme } from '../game/arena';
import { CardArt } from './CardArt';
import { CollectionScreen } from './CollectionScreen';
import { DeckScreen } from './DeckScreen';
import { ProfileScreen } from './ProfileScreen';
import { currentArena } from './achievements';
import type { Profile } from './profileStorage';

const THEME_LABELS: Record<ArenaTheme, string> = {
  campo: '🌿 Campo', deserto: '🏜️ Deserto', neve: '❄️ Neve', noite: '🌙 Noite',
};

type Tab = 'batalha' | 'colecao' | 'deck' | 'perfil';
type PlayOptions = Omit<JoinBattleOptions, 'deck' | 'name' | 'cardLevels'>;

interface HomeScreenProps {
  connecting: boolean;
  deck: string[];
  profile: Profile;
  theme: ArenaTheme;
  onThemeChange: (theme: ArenaTheme) => void;
  onNameChange: (name: string) => void;
  onDeckChange: (deck: string[]) => void;
  onUpgradeCard: (cardId: string) => void;
  onRegister: (name: string) => void;
  onPlay: (opts: PlayOptions) => void;
  onSpectate: (code: string) => void;
}

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'colecao', label: 'Coleção', icon: '🃏' },
  { id: 'batalha', label: 'Batalha', icon: '⚔️' },
  { id: 'deck', label: 'Deck', icon: '🛡️' },
  { id: 'perfil', label: 'Perfil', icon: '👤' },
];

export function HomeScreen({
  connecting, deck, profile, theme, onThemeChange, onNameChange, onDeckChange,
  onUpgradeCard, onRegister, onPlay, onSpectate,
}: HomeScreenProps) {
  const [tab, setTab] = useState<Tab>('batalha');
  const arena = currentArena(profile.trophies);

  return (
    <div className="home-screen">
      {!profile.registered && <OnboardingModal onRegister={onRegister} />}
      <div className="profile-plate">
        <span className="profile-trophy">{arena.emoji} 🏆 {profile.trophies}</span>
        <span className="profile-gold">💰 {profile.gold}</span>
        <input
          className="profile-name"
          value={profile.name}
          maxLength={16}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Nome do jogador"
        />
      </div>

      <div className="home-content">
        {tab === 'batalha' && (
          <BattleTab
            connecting={connecting}
            deck={deck}
            profile={profile}
            theme={theme}
            onThemeChange={onThemeChange}
            onPlay={onPlay}
            onSpectate={onSpectate}
          />
        )}
        {tab === 'colecao' && <CollectionScreen profile={profile} onUpgradeCard={onUpgradeCard} />}
        {tab === 'deck' && <DeckScreen deck={deck} onDeckChange={onDeckChange} />}
        {tab === 'perfil' && <ProfileScreen profile={profile} onNameChange={onNameChange} />}
      </div>

      <nav className="tab-bar" aria-label="Navegação principal">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`tab-button ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

interface BattleTabProps {
  connecting: boolean;
  deck: string[];
  profile: Profile;
  theme: ArenaTheme;
  onThemeChange: (theme: ArenaTheme) => void;
  onPlay: (opts: PlayOptions) => void;
  onSpectate: (code: string) => void;
}

const DIFFICULTIES: Array<{ id: BotDifficulty; label: string }> = [
  { id: 'easy', label: 'Fácil' },
  { id: 'medium', label: 'Médio' },
  { id: 'hard', label: 'Difícil' },
];

function generateFriendCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('');
}

function BattleTab({
  connecting, deck, profile, theme, onThemeChange, onPlay, onSpectate,
}: BattleTabProps) {
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [friendCode, setFriendCode] = useState('');
  const [partyMode, setPartyMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; trophies: number }>>([]);

  useEffect(() => {
    fetchLeaderboard().then(setLeaderboard).catch(() => undefined);
  }, []);

  const mode = partyMode ? ('party' as const) : ('' as const);
  const normalizedCode = friendCode.trim().toUpperCase();

  return (
    <div className="battle-tab">
      <img className="menu-logo" src="/logo.png" alt="Claude Royale — uma nova batalha começa" />
      <p className="menu-subtitle">Batalhas 1v1 em tempo real no navegador</p>

      <div className="play-buttons">
        <button className="play-button" onClick={() => onPlay({})} disabled={connecting}>
          {connecting ? 'Conectando…' : '⚔️ Batalhar'}
        </button>
        <div className="bot-play">
          <button
            className="play-button secondary"
            onClick={() => onPlay({ vsBot: true, botDifficulty: difficulty, mode })}
            disabled={connecting}
          >
            🤖 Treinar vs Bot
          </button>
          <div className="difficulty-picker" role="radiogroup" aria-label="Dificuldade do bot">
            {DIFFICULTIES.map(({ id, label }) => (
              <button
                key={id}
                className={`difficulty-option ${difficulty === id ? 'active' : ''}`}
                onClick={() => setDifficulty(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mode-row">
        <button
          className="text-button"
          disabled={connecting}
          onClick={() => onPlay({ botMatch: true, botDifficulty: difficulty })}
        >
          📺 Assistir Bots
        </button>
        <label className={`party-toggle ${partyMode ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={partyMode}
            onChange={(e) => setPartyMode(e.target.checked)}
          />
          🎉 Elixir infinito (treino)
        </label>
        <div className="theme-picker" role="radiogroup" aria-label="Tema da arena">
          {(Object.keys(ARENA_PALETTES) as ArenaTheme[]).map((id) => (
            <button
              key={id}
              className={`difficulty-option ${theme === id ? 'active' : ''}`}
              onClick={() => isArenaTheme(id) && onThemeChange(id)}
            >
              {THEME_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="match-history leaderboard">
          <h3>🏆 Ranking</h3>
          <ul>
            {leaderboard.slice(0, 5).map((row, i) => (
              <li key={row.name} className="history-row">
                <span className="history-result">
                  {['🥇', '🥈', '🥉', '4º', '5º'][i]} {row.name}
                </span>
                <span className="history-score">🏆 {row.trophies}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="friend-row">
        <input
          className="code-input"
          placeholder="CÓDIGO"
          maxLength={6}
          value={friendCode}
          onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
        />
        <button
          className="text-button"
          disabled={connecting}
          onClick={() => {
            const code = normalizedCode || generateFriendCode();
            setFriendCode(code);
            onPlay({ privateCode: code });
          }}
        >
          👥 Jogar com amigo
        </button>
        <button
          className="text-button"
          disabled={connecting || normalizedCode.length < 4}
          onClick={() => onSpectate(normalizedCode)}
        >
          👁 Assistir
        </button>
      </div>
      <p className="menu-hint">
        Jogar com amigo: um cria o código, o outro digita o mesmo código. Assistir entra como
        espectador numa partida em andamento.
      </p>

      <div className="deck-preview">
        {deck.map((cardId) => {
          const card = getCard(cardId);
          if (!card) return null;
          return (
            <div key={cardId} className="deck-preview-card" title={card.name}>
              <CardArt cardId={cardId} color="blue" emoji={card.emoji} />
            </div>
          );
        })}
      </div>

      {profile.history.length > 0 && <MatchHistory profile={profile} />}
      <p className="menu-hint">Partidas contra o bot não valem troféus</p>
    </div>
  );
}

/** Cadastro no primeiro acesso: escolhe o nome de batalha. */
function OnboardingModal({ onRegister }: { onRegister: (name: string) => void }) {
  const [name, setName] = useState('');
  const valid = name.trim().length >= 2;
  return (
    <div className="modal-backdrop onboarding">
      <div className="modal-card onboarding-card">
        <img className="onboarding-logo" src="/logo.png" alt="Claude Royale" />
        <h3>Crie seu perfil</h3>
        <p className="modal-type">Escolha seu nome de batalha (aparece para o oponente e no ranking)</p>
        <input
          className="code-input name-input"
          placeholder="Seu nome"
          maxLength={16}
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && valid && onRegister(name.trim())}
        />
        <button
          className="play-button"
          disabled={!valid}
          onClick={() => onRegister(name.trim())}
        >
          ⚔️ Começar
        </button>
      </div>
    </div>
  );
}

function MatchHistory({ profile }: { profile: Profile }) {
  return (
    <div className="match-history">
      <h3>Últimas partidas</h3>
      <ul>
        {profile.history.slice(0, 5).map((match, i) => (
          <li key={i} className={`history-row ${match.result}`}>
            <span className="history-result">
              {match.result === 'win' ? '✅ Vitória' : match.result === 'loss' ? '❌ Derrota' : '🤝 Empate'}
            </span>
            <span className="history-score">
              {match.myCrowns} 👑 {match.oppCrowns}
            </span>
            <span className="history-mode">{match.vsBot ? '🤖 bot' : '⚔️ 1v1'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

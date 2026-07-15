import type { HudSnapshot } from '../net/connection';
import { toggleFullscreen } from './fullscreen';

interface TopBarProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onSurrender?: () => void;
}

export function TopBar({ hud, muted, onToggleMute, onSurrender }: TopBarProps) {
  const minutes = Math.floor(Math.max(0, hud.timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, hud.timeRemaining) % 60);

  return (
    <div className="top-bar">
      <div className={`player-plate ${hud.mySide === 'left' ? 'blue' : 'red'}`}>
        <span className="plate-name">{hud.myName}</span>
        <span className="plate-crowns">👑 {hud.myCrowns}</span>
      </div>

      <div className={`timer-plate ${hud.suddenDeath ? 'sudden-death' : ''}`}>
        <span className="timer-label">{hud.suddenDeath ? 'MORTE SÚBITA' : 'Restante:'}</span>
        <span className="timer-value">
          {minutes}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <div className={`player-plate ${hud.mySide === 'left' ? 'red' : 'blue'}`}>
        <span className="plate-name">{hud.oppName}</span>
        <span className="plate-crowns">👑 {hud.oppCrowns}</span>
      </div>

      <div className="top-actions">
        {onSurrender && hud.phase === 'battle' && (
          <button className="icon-button" onClick={onSurrender} aria-label="Desistir">
            🏳️
          </button>
        )}
        <button className="icon-button" onClick={onToggleMute} aria-label="Som">
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="icon-button" onClick={toggleFullscreen} aria-label="Tela cheia">
          ⛶
        </button>
      </div>
    </div>
  );
}

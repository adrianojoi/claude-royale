import { useState } from 'react';
import type { Room } from 'colyseus.js';

const EMOTES = ['👍', '😂', '😭', '😡'];
const COOLDOWN_MS = 2000;

/** Botão 💬 no canto que abre os 4 emotes; envia ao servidor com cooldown local. */
export function EmotePicker({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);

  const send = (emoji: string) => {
    if (coolingDown) return;
    room.send('emote', { emoji });
    setOpen(false);
    setCoolingDown(true);
    setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
  };

  return (
    <div className="emote-picker">
      {open && (
        <div className="emote-options">
          {EMOTES.map((emoji) => (
            <button key={emoji} className="emote-option" onClick={() => send(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        className={`icon-button emote-toggle ${coolingDown ? 'cooling' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Emotes"
      >
        💬
      </button>
    </div>
  );
}

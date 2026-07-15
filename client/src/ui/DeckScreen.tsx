import { useMemo, useState } from 'react';
import { DEFAULT_DECK, collectionCards, getCard } from '@claude-royale/shared';
import { CardArt } from './CardArt';

interface DeckScreenProps {
  deck: string[];
  onDeckChange: (deck: string[]) => void;
}

export function DeckScreen({ deck, onDeckChange }: DeckScreenProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const avgCost = useMemo(() => {
    const total = deck.reduce((sum, id) => sum + (getCard(id)?.cost ?? 0), 0);
    return (total / deck.length).toFixed(1);
  }, [deck]);

  const available = collectionCards().filter((card) => !deck.includes(card.id));

  const handleSlotClick = (index: number) => {
    setSelectedSlot((current) => (current === index ? null : index));
  };

  const handleReplacement = (cardId: string) => {
    if (selectedSlot === null) return;
    const next = [...deck];
    next[selectedSlot] = cardId;
    onDeckChange(next);
    setSelectedSlot(null);
  };

  return (
    <div className="deck-screen">
      <div className="deck-header">
        <h2 className="screen-title">Seu deck</h2>
        <span className="avg-cost">
          💧 Custo médio: <strong>{avgCost}</strong>
        </span>
        <button className="text-button" onClick={() => onDeckChange([...DEFAULT_DECK])}>
          Restaurar padrão
        </button>
      </div>

      <div className="deck-slots">
        {deck.map((cardId, i) => {
          const card = getCard(cardId);
          if (!card) return null;
          return (
            <button
              key={`${cardId}-${i}`}
              className={`grid-card deck-slot ${selectedSlot === i ? 'selected' : ''}`}
              style={{ ['--card-color' as string]: card.color }}
              onClick={() => handleSlotClick(i)}
            >
              <span className="card-cost">{card.cost}</span>
              <CardArt cardId={cardId} color="blue" emoji={card.emoji} />
              <span className="grid-card-name">{card.name}</span>
            </button>
          );
        })}
      </div>

      <p className="deck-hint">
        {selectedSlot === null
          ? 'Toque numa carta do deck para trocá-la'
          : 'Agora escolha a carta substituta 👇'}
      </p>

      <div className={`card-grid trade-grid ${selectedSlot === null ? 'dimmed' : ''}`}>
        {available.map((card) => (
          <button
            key={card.id}
            className="grid-card"
            style={{ ['--card-color' as string]: card.color }}
            disabled={selectedSlot === null}
            onClick={() => handleReplacement(card.id)}
          >
            <span className="card-cost">{card.cost}</span>
            <CardArt cardId={card.id} color="blue" emoji={card.emoji} />
            <span className="grid-card-name">{card.name}</span>
          </button>
        ))}
        {available.length === 0 && <p className="deck-hint">Todas as cartas já estão no deck</p>}
      </div>
    </div>
  );
}

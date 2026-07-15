import { useState } from 'react';
import {
  BALANCE_HISTORY, collectionCards, deriveStats, getCard, percentChange,
  type CardDef,
} from '@claude-royale/shared';
import { CardArt } from './CardArt';
import { UPGRADE_COSTS, type Profile } from './profileStorage';

const RARITY_LABEL: Record<string, string> = { comum: 'Comum', rara: 'Rara', epica: 'Épica' };
const TYPE_LABEL: Record<string, string> = {
  troop: 'Tropa', building: 'Construção', spell: 'Feitiço', mirror: 'Utilidade',
};
const KIND_LABEL: Record<string, string> = {
  buff: '⬆️ Buff', nerf: '⬇️ Nerf', rework: '🔁 Rework',
  correcao: '🔧 Correção', padronizacao: '📏 Padronização',
};

interface CollectionScreenProps {
  profile: Profile;
  onUpgradeCard: (cardId: string) => void;
}

export function CollectionScreen({ profile, onUpgradeCard }: CollectionScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const cards = collectionCards();
  const selectedCard = selected ? getCard(selected) : undefined;

  return (
    <div className="collection-screen">
      <div className="deck-header">
        <h2 className="screen-title">Coleção ({cards.length} cartas)</h2>
        <button className="text-button" onClick={() => setShowHistory(true)}>
          📜 Histórico de balanceamento
        </button>
      </div>
      <div className="card-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            className={`grid-card rarity-${card.rarity}`}
            style={{ ['--card-color' as string]: card.color }}
            onClick={() => setSelected(card.id)}
          >
            <span className="card-cost">{card.type === 'mirror' ? '?' : card.cost}</span>
            {(profile.cardLevels[card.id] ?? 1) > 1 && (
              <span className="card-level">Nv.{profile.cardLevels[card.id]}</span>
            )}
            <CardArt cardId={card.id} color="blue" emoji={card.emoji} />
            <span className="grid-card-name">{card.name}</span>
          </button>
        ))}
      </div>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          profile={profile}
          onUpgradeCard={onUpgradeCard}
          onClose={() => setSelected(null)}
        />
      )}
      {showHistory && <BalanceHistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

function CardDetailModal({
  card, profile, onUpgradeCard, onClose,
}: {
  card: CardDef;
  profile: Profile;
  onUpgradeCard: (cardId: string) => void;
  onClose: () => void;
}) {
  const c = card.components;
  const derived = deriveStats(card);
  const level = profile.cardLevels[card.id] ?? 1;
  const nextCost = UPGRADE_COSTS[level + 1];
  const canUpgrade = card.type !== 'mirror' && nextCost !== undefined;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-art" style={{ ['--card-color' as string]: card.color }}>
            <span className="card-cost">{card.type === 'mirror' ? '?' : card.cost}</span>
            <CardArt cardId={card.id} color="blue" emoji={card.emoji} />
          </div>
          <div>
            <h3>{card.name}</h3>
            <p className="modal-type">
              {TYPE_LABEL[card.type] ?? card.type} · {RARITY_LABEL[card.rarity] ?? card.rarity} · {card.subtype}
            </p>
            {card.tags.length > 0 && (
              <p className="modal-tags">{card.tags.map((tag) => `#${tag}`).join(' ')}</p>
            )}
          </div>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <p className="modal-description">{card.description}</p>

        <div className="stat-rows">
          {(card.deployCount ?? 1) > 1 && <StatRow icon="👥" label="Quantidade" value={`x${card.deployCount}`} />}
          {c.health && <StatRow icon="❤️" label="Vida" value={c.health.hp} />}
          {c.health?.shield !== undefined && <StatRow icon="🛡️" label="Escudo" value={c.health.shield} />}
          {c.health?.regenPerSecond !== undefined && (
            <StatRow icon="💞" label="Regeneração" value={`${c.health.regenPerSecond}/s`} />
          )}
          {c.attack && (
            <>
              <StatRow icon="⚔️" label="Dano" value={c.attack.damage} />
              <StatRow icon="⏱️" label="Intervalo de ataque" value={`${c.attack.hitSpeed}s`} />
              <StatRow icon="🎯" label="Alcance" value={c.attack.range <= 1.2 ? 'Corpo a corpo' : c.attack.range} />
              {c.attack.splashRadius ? <StatRow icon="💥" label="Dano em área" value={`raio ${c.attack.splashRadius}`} /> : null}
              {c.attack.lifestealPct ? <StatRow icon="🩸" label="Roubo de vida" value={`${Math.round(c.attack.lifestealPct * 100)}%`} /> : null}
              {c.attack.healOnKill ? <StatRow icon="🍖" label="Cura por eliminação" value={c.attack.healOnKill} /> : null}
            </>
          )}
          {c.movement && (
            <StatRow icon="👟" label="Velocidade" value={c.movement.speed >= 2.2 ? 'Rápida' : c.movement.speed >= 1.5 ? 'Média' : 'Lenta'} />
          )}
          {c.movement?.flying && <StatRow icon="🕊️" label="Deslocamento" value="Voador" />}
          {c.movement?.jumpsRiver && <StatRow icon="🌉" label="Travessia" value="Salta o rio" />}
          {c.targeting && (
            <StatRow icon="🏰" label="Alvos" value={c.targeting.targets === 'buildings' ? 'Construções' : c.targeting.targetsAir ? 'Ar e terra' : 'Terrestres'} />
          )}
          {c.charge && <StatRow icon="🐎" label="Carga" value={`${c.charge.multiplier}x após ${c.charge.distance} tiles`} />}
          {c.spawner && <StatRow icon="🧬" label="Geração" value={`${c.spawner.count}x a cada ${c.spawner.interval}s`} />}
          {c.deathEffect?.damage && <StatRow icon="💣" label="Dano de morte" value={`${c.deathEffect.damage.damage} (raio ${c.deathEffect.damage.radius})`} />}
          {c.deathEffect?.spawn && <StatRow icon="⚰️" label="Invocação ao morrer" value={`${c.deathEffect.spawn.count}x ${getCard(c.deathEffect.spawn.cardId)?.name ?? ''}`} />}
          {c.aura?.healPerSecond && <StatRow icon="💚" label="Aura de cura" value={`${c.aura.healPerSecond}/s (raio ${c.aura.radius})`} />}
          {c.lifetime && <StatRow icon="⏳" label="Vida útil" value={`${c.lifetime.seconds}s`} />}
          {c.resource && <StatRow icon="💧" label="Produção" value={`1 elixir a cada ${c.resource.elixirInterval}s`} />}
          {c.spell && (
            <>
              {c.spell.damage ? <StatRow icon="💥" label="Dano" value={c.spell.damage} /> : null}
              <StatRow icon="⭕" label="Raio" value={c.spell.radius} />
              {c.spell.stunSeconds ? <StatRow icon="💫" label="Atordoamento" value={`${c.spell.stunSeconds}s`} /> : null}
              {c.spell.freezeSeconds ? <StatRow icon="❄️" label="Congelamento" value={`${c.spell.freezeSeconds}s`} /> : null}
              {c.spell.rageSeconds ? <StatRow icon="😈" label="Fúria" value={`${c.spell.rageSeconds}s`} /> : null}
              {c.spell.multiTargetCount ? <StatRow icon="🎯" label="Alvos" value={`${c.spell.multiTargetCount} de maior vida`} /> : null}
              {c.spell.zone ? <StatRow icon="☠️" label="Zona" value={`${c.spell.zone.pulseDamage}/s por ${c.spell.zone.durationSeconds}s`} /> : null}
            </>
          )}
          <StatRow icon="💧" label="Custo de elixir" value={card.type === 'mirror' ? 'última + 1' : card.cost} />
          <StatRow icon="🎚️" label="Nível" value={`${level} de 3 (+${(level - 1) * 8}% vida/dano)`} />
        </div>

        {canUpgrade && (
          <button
            className="play-button secondary upgrade-button"
            disabled={profile.gold < nextCost}
            onClick={() => onUpgradeCard(card.id)}
          >
            ⬆️ Melhorar para Nv.{level + 1} — 💰{nextCost}
            {profile.gold < nextCost ? ' (ouro insuficiente)' : ''}
          </button>
        )}
        {!nextCost && card.type !== 'mirror' && (
          <p className="deck-hint">Nível máximo alcançado ⭐</p>
        )}

        <h4 className="derived-title">Atributos derivados (calculados)</h4>
        <div className="stat-rows derived">
          {derived.dps !== undefined && <StatRow icon="⚡" label="Dano por segundo" value={derived.dps} />}
          {derived.effectiveHp !== undefined && <StatRow icon="🧱" label="Vida efetiva" value={derived.effectiveHp} />}
          {derived.dpsPerElixir !== undefined && <StatRow icon="📈" label="DPS por elixir" value={derived.dpsPerElixir} />}
          {derived.hpPerElixir !== undefined && <StatRow icon="📊" label="Vida por elixir" value={derived.hpPerElixir} />}
          {derived.spellTotalDamage !== undefined && <StatRow icon="Σ" label="Dano total do feitiço" value={derived.spellTotalDamage} />}
          {derived.totalSpawned !== undefined && <StatRow icon="🧬" label="Total gerado na vida útil" value={derived.totalSpawned} />}
          {derived.totalElixirProduced !== undefined && <StatRow icon="💰" label="Elixir total produzido" value={derived.totalElixirProduced} />}
        </div>

        <CardBalanceHistory cardId={card.id} />
      </div>
    </div>
  );
}

function CardBalanceHistory({ cardId }: { cardId: string }) {
  const changes = BALANCE_HISTORY.filter((change) => change.cardId === cardId);
  if (changes.length === 0) return null;
  return (
    <>
      <h4 className="derived-title">Mudanças de balanceamento</h4>
      <div className="stat-rows derived">
        {changes.map((change, i) => (
          <div key={i} className="stat-row balance-row">
            <span className="stat-icon">{KIND_LABEL[change.kind]?.slice(0, 2) ?? '·'}</span>
            <span className="stat-label">
              v{change.version} — {change.attribute}: {change.oldValue} → {change.newValue} (
              {percentChange(change.oldValue, change.newValue)}%)
              <br />
              <em>{change.justification}</em>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function BalanceHistoryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📜 Histórico de balanceamento</h3>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="stat-rows">
          {[...BALANCE_HISTORY].reverse().map((change, i) => (
            <div key={i} className="stat-row balance-row">
              <span className="stat-icon">{KIND_LABEL[change.kind]?.slice(0, 2) ?? '·'}</span>
              <span className="stat-label">
                <strong>{getCard(change.cardId)?.name ?? change.cardId}</strong> — {KIND_LABEL[change.kind]}
                <br />
                {change.attribute}: {change.oldValue} → {change.newValue} (
                {percentChange(change.oldValue, change.newValue)}%) · v{change.version} · {change.date}
                <br />
                <em>{change.justification}</em>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="stat-row">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

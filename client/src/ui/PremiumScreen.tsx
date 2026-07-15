/**
 * Passe Real — vitrine da assinatura (visual/comercial).
 * O checkout real exige contas + provedor de pagamento (Stripe etc.);
 * o CTA fica em "em breve" até essa infraestrutura existir.
 */
const BENEFITS = [
  { icon: '/assets/ui/icon-dragons.png', title: 'Temas exclusivos de arena', detail: 'Vulcão, Ruínas Arcanas e novos a cada temporada' },
  { icon: '/assets/ui/icon-medal.png', title: 'Moldura de perfil dourada', detail: 'Seu nome em destaque no ranking e na tela VS' },
  { icon: '/assets/ui/icon-multiplayer.png', title: 'Emotes lendários', detail: '8 emotes animados que só assinantes possuem' },
  { icon: '/assets/ui/icon-scroll.png', title: 'Baú semanal de ouro', detail: '+500 de ouro toda semana para evoluir cartas' },
  { icon: '/assets/ui/icon-flag.png', title: 'Torneios privados ilimitados', detail: 'Crie torneios para sua comunidade' },
  { icon: '/assets/ui/icon-book.png', title: 'Estatísticas avançadas', detail: 'Winrate por carta, matchups e histórico completo' },
];

export function PremiumScreen() {
  return (
    <div className="premium-screen">
      <div className="premium-hero">
        <img className="premium-crest" src="/assets/ui/crest-flags.png" alt="" />
        <h2 className="premium-title">Passe Real</h2>
        <p className="premium-tagline">Apoie o reino. Jogue com vantagens que não afetam o combate.</p>
      </div>

      <div className="premium-grid">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="premium-benefit">
            <img src={benefit.icon} alt="" />
            <div>
              <strong>{benefit.title}</strong>
              <p>{benefit.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="premium-cta">
        <div className="premium-price">
          <span className="price-value">R$ 9,90</span>
          <span className="price-period">/mês</span>
        </div>
        <button className="play-button" disabled title="Pagamentos em desenvolvimento">
          👑 Assinar — em breve
        </button>
        <p className="deck-hint">Nenhum benefício altera o balanceamento: só cosméticos e conveniência.</p>
      </div>
    </div>
  );
}

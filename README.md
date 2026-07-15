# 👑 Claude Royale

Projeto de estudo inspirado no Clash Royale: batalhas 1v1 **multiplayer em tempo real no navegador**, em tela cheia e orientação **paisagem** (feito para jogar com o celular deitado).

![stack](https://img.shields.io/badge/stack-Phaser%203%20%2B%20React%20%2B%20Colyseus-blue)

## Como rodar

```bash
pnpm install
pnpm dev
```

- Cliente: http://localhost:5173 (Vite mostra a porta real; use a URL de **Network** para jogar pelo celular na mesma rede)
- Servidor: ws://localhost:2567

**Para jogar:** abra o jogo em **duas abas** (ou dois aparelhos) e clique em ⚔️ Batalhar nas duas. A partida começa quando os dois entram.

```bash
pnpm test   # testes unitários da simulação (Vitest)
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Arena (canvas) | [Phaser 3](https://phaser.io) — sprites, tweens, partículas |
| UI (menus/HUD/cartas) | React 18 + CSS |
| Servidor autoritativo | [Colyseus](https://colyseus.io) — salas + sync de estado |
| Simulação compartilhada | TypeScript puro em `shared/` (testável sem servidor) |

## Arquitetura

```
claude_royale/
├── client/   # Vite + React + Phaser
│   └── src/
│       ├── game/   # cena Phaser, projeção 2.5D, entidades, efeitos
│       ├── ui/     # React: mão de cartas, elixir, telas, overlays
│       └── net/    # cliente Colyseus
├── server/   # Node + Colyseus (BattleRoom espelha a simulação no schema)
└── shared/   # cartas, constantes, projeção e TODA a simulação
```

Princípios:

- **Servidor autoritativo** — toda a lógica (elixir, spawn, pathing, combate, vitória) roda no servidor a 20 ticks/s. O cliente só envia *intents* (`playCard`) e renderiza o estado interpolado.
- **2.5D em paisagem** — grid lógico 32×18 projetado em trapézio ([shared/src/projection.ts](shared/src/projection.ts)): o topo da tela fica "mais longe" (menor), sprites escalam pela profundidade e o depth-sort segue o Y da tela.
- **Visão espelhada** — cada jogador vê o próprio lado à esquerda; o cliente espelha renderização e input ([client/src/game/view.ts](client/src/game/view.ts)).
- **Tela cheia + paisagem** — Fullscreen API + `screen.orientation.lock('landscape')` ao entrar na batalha, overlay "gire o aparelho" em retrato via CSS.

## Campeões e evoluções

- **Campeões** (máx. 1 por deck): tropas com **habilidade ativa** — botão dourado na batalha com custo de elixir e recarga. Campeã Valente (Bastião: escudo + fúria) e Mestre das Tempestades (Vendaval: dano em área + cura)
- **Evoluções**: cartas com o componente `evolution` saem **evoluídas** a cada N usos (⭐ na arena) — Cavaleiro evolui com escudo e vida extra

## Telas e modos

- **Batalha 1v1** — matchmaking em tempo real, emotes (💬), desistência (🏳️) e **reconexão automática** (30s de tolerância a queda/reload)
- **Jogar com amigo** — sala privada por código de 4 letras (um cria, o outro digita o mesmo código)
- **Assistir** — espectador ao vivo de qualquer partida pelo código da sala
- **Treino vs Bot** — IA no servidor em 3 dificuldades ([shared/src/sim/bot.ts](shared/src/sim/bot.ts)): fácil (reage tarde), médio (defende e usa feitiços) e difícil (counters por tipo, finaliza torre com feitiço, apoia pushes); não vale troféus
- **Replay** — a partida é gravada no cliente e pode ser reassistida no fim (play/pause, 2x, reiniciar)
- **Assistir Bots** — bot vs bot ao vivo (ótimo para estudar interações de cartas sem jogar)
- **Elixir infinito** — modo festa para testar mecânicas sem esperar regeneração
- **Skins de arena** — Campo, Deserto, Neve e Noite (persistem no aparelho)
- **Ranking** — troféus por nome no servidor (`/leaderboard`), top 5 na home
- **Coleção** — as 12 cartas com modal de estatísticas (vida, dano, DPS, alcance, velocidade, alvos)
- **Deck** — monte seu deck de 8 cartas com custo médio de elixir; salvo em `localStorage` e enviado ao servidor
- **Perfil** — nome editável, troféus (+30/-20 por 1v1) e histórico das últimas partidas

## Game feel

Números de dano flutuantes, flash branco ao tomar dano, torres em chamas abaixo de 50%, queda de torre cinematográfica (zoom de câmera + escombros + cratera permanente), flechas e projéteis voando em arco, bola de fogo com rastro e fogo residual, chuva de flechas, confete na vitória, countdown com som e "LUTE!", morte súbita com banner, vinheta vermelha pulsante e música acelerada, e ambiente vivo (nuvens com sombra, pássaros, brilhos no rio).

## Motor de cartas (composição de componentes)

As cartas são definidas por **composição** em [shared/src/engine/model.ts](shared/src/engine/model.ts): identidade (nome, tipo, subtipo, raridade, custo, tags) + componentes opcionais (`health`, `movement`, `targeting`, `attack`, `charge`, `spawner`, `deathEffect`, `deployEffect`, `resource`, `lifetime`, `aura`, `spell`) — qualquer combinação é válida e novas mecânicas entram como novos componentes, sem tocar no núcleo.

- **46 cartas originais** (14 comuns, 13 raras, 19 épicas) em [shared/src/cards.ts](shared/src/cards.ts), incluindo mecânicas de escudo, roubo de vida, aura de cura, regeneração, zona de veneno, carga, voadores, construções geradoras, coletor de recurso, espelho e mais
- **Atributos derivados** ([engine/derived.ts](shared/src/engine/derived.ts)): DPS, vida efetiva, eficiência por elixir — sempre calculados, nunca armazenados
- **Validação** ([engine/model.ts](shared/src/engine/model.ts)): regras de coerência rodam no carregamento; carta inválida derruba o build, não a partida
- **Balanceamento versionado** ([shared/src/balanceHistory.ts](shared/src/balanceHistory.ts)): valores mudam por patches de DADOS com classificação semântica automática (intervalo menor = buff, custo maior = nerf…), justificativa e histórico legível pelo jogador na Coleção
- **Ferramenta admin**: `pnpm --filter @claude-royale/server edit-card <carta> <atributo> <valor> [justificativa]` — lê o valor atual, classifica e registra o patch

## Gameplay

- 12 cartas — Peões, Batedores, Cavaleiro, Arqueiras, Atiradora, Campeão, Gigante, Valquíria, Besteiro, Horda de Peões e os feitiços Bola de Fogo e Flechas — em [shared/src/cards.ts](shared/src/cards.ts)
- Elixir: regenera 1 a cada 2,8s (2x na morte súbita), máximo 10
- Partida: 3 min + 1 min de morte súbita; vence quem derrubar o rei (3 coroas) ou tiver mais coroas
- Tropas atravessam o rio apenas pelas pontes, priorizam inimigos próximos sobre torres (Gigante só ataca construções) e **não se sobrepõem** (separação por colisão)
- **Torre do rei começa adormecida** (💤): só ataca depois de tomar dano ou perder uma princesa — flanquear tem estratégia
- Segurança: servidor valida payloads e aplica rate-limit em cartas (200ms) e emotes (2s)

## Visual e assets

Tropas, torres, decoração e explosões usam o pack **[Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords)** do Pixel Frog (gratuito; uso pessoal/comercial permitido, redistribuição proibida — ver [CREDITS.md](client/public/assets/tiny-swords/CREDITS.md)). Spritesheets animados (idle/corrida/ataque) em frames de 192px, nas cores azul (lado esquerdo) e vermelho (lado direito). O terreno da arena continua procedural, desenhado tile a tile com a projeção em perspectiva.

Outras fontes gratuitas para evoluir:

| Tipo | Fonte | Licença |
|------|-------|---------|
| Mais personagens | [CraftPix freebies](https://craftpix.net/freebies/), [itch.io](https://itch.io/game-assets/free) | conforme pack |
| UI/props extras | [Kenney](https://kenney.nl/assets) | CC0 |
| Ícones de cartas | [game-icons.net](https://game-icons.net) | CC-BY 3.0 |
| SFX | [Kenney Audio](https://kenney.nl/assets?q=audio), [freesound](https://freesound.org) | CC0 |

> ⚠️ Não use assets do fankit da Supercell dentro do jogo — os termos proíbem uso em outros jogos.

## Áudio

Música de batalha: "Medieval: Battle" por RandomMind (CC0, [OpenGameArt](https://opengameart.org/content/medieval-battle)). SFX: packs RPG Audio, Impact Sounds e Music Jingles do [Kenney](https://kenney.nl) (CC0).

## Deploy público

O cliente é estático e o servidor é um processo Node — qualquer combinação "static host + VPS" funciona:

**Servidor** (Render/Railway/Fly.io ou VPS):
```bash
docker build -f server/Dockerfile -t claude-royale-server .
docker run -p 2567:2567 claude-royale-server
```
Coloque um proxy com TLS na frente (o navegador exige `wss://` quando o site é `https://`).

**Cliente** (Vercel/Netlify/Cloudflare Pages):
```bash
# variável de ambiente no build:
VITE_SERVER_URL=wss://seu-servidor.exemplo.com
pnpm --filter @claude-royale/client build   # gera client/dist
```

O jogo é um **PWA**: instalável na tela inicial do celular, abre em fullscreen paisagem e faz cache dos assets offline.

## Balanceamento por simulação

```bash
pnpm --filter @claude-royale/server balance 600
```
Roda N partidas bot vs bot com decks aleatórios e imprime a winrate por carta. Os números atuais das cartas foram calibrados assim (spread reduzido de ~21 para ~16 pontos). Nota: cartas que dependem de escolta (Gigante) ficam subestimadas na simulação porque o bot médio não apoia pushes — o bot difícil sim.

## Ideias de evolução

- [ ] Níveis de carta / progressão de coleção
- [ ] Ranking online (troféus no servidor + placar)
- [ ] Torneios (chaves com salas privadas encadeadas)
- [ ] Publicar o deploy (infra pronta — ver seção acima)

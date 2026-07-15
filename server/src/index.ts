import http from 'http';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { BattleRoom } from './BattleRoom';
import { lookupRoomByCode } from './roomRegistry';
import { topPlayers } from './leaderboard';

const PORT = Number(process.env.PORT ?? 2567);

// Servidor HTTP próprio para expor o lookup de sala por código
// (usado por "jogar com amigo" e pelo modo espectador).
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const match = req.url?.match(/^\/room-by-code\/([A-Za-z0-9]{4,6})$/);
  if (req.method === 'GET' && match) {
    const roomId = lookupRoomByCode(match[1]);
    res.setHeader('Content-Type', 'application/json');
    if (roomId) {
      res.writeHead(200);
      res.end(JSON.stringify({ roomId }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'sala não encontrada' }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/leaderboard') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(topPlayers(10)));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('⚔️ Claude Royale server');
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

// filterBy: partidas públicas (privateCode vazio) só casam entre si;
// salas com código só casam com quem digitou o mesmo código.
gameServer.define('battle', BattleRoom).filterBy(['privateCode', 'vsBot']);

gameServer.listen(PORT).then(() => {
  console.log(`⚔️  Claude Royale server ouvindo em ws://localhost:${PORT}`);
});


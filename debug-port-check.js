import net from 'node:net';
import { resolveAvailablePort } from './dist/env.js';

const server = net.createServer();
server.listen(3000, '0.0.0.0', async () => {
  console.log('busy on 3000');
  const port = await resolveAvailablePort(3000);
  console.log('resolved port', port);
  server.close();
});

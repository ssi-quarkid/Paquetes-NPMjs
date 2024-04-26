import { Server } from 'socket.io';
import { TransportSendRequest } from './transport';
import { WebsocketTransport } from './websocket-transport';

export class WebsocketServerTransport extends WebsocketTransport {
  initializeServer(socketServer: Server) {
    socketServer.on('connection', (client) => {
      this.listenToSocket(client);
    });
  }

  send(params: TransportSendRequest): void {
    const socket = this.connectedSockets.get(params.to.value);
    if (!socket) throw new Error(`No socket found for DID ${params.to.value}`);
    socket.emit('message', {
      message: params.data,
      did: this.agent.identity.getOperationalDID().value,
    });
  }
}

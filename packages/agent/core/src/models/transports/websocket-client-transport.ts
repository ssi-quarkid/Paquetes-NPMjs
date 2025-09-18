import { DIDDocumentUtils } from '@quarkid/did-core';
import { connect } from 'socket.io-client';
import { DID } from '../did';
import { TransportSendRequest } from './transport';
import { WebsocketTransport } from './websocket-transport';

export class WebsocketClientTransport extends WebsocketTransport {
  async send(params: TransportSendRequest): Promise<void> {
    const existingSocket = this.connectedSockets.get(params.to.value);
    if (!existingSocket) {
      const resolver = this.agent.resolver;
      const targetDidDocument = await resolver.resolve(params.to);
      try {
        const websocketUrl = DIDDocumentUtils.getServiceUrl(
          targetDidDocument,
          this.wsDidDocumentId
        )[0];
        const socket = connect(websocketUrl);
        this.listenToSocket(socket, { did: DID.from(params.to.value) });
        this.connectedSockets.set(params.to.value, socket);
      } catch (ex) {
        throw new Error('Error getting websocket endpoint in did document');
      }
    }

    const socket = this.connectedSockets.get(params.to.value);
    if (!socket) throw new Error(`No socket found for DID ${params.to.value}`);
    socket.emit('message', {
      message: params.data,
      did: this.agent.identity.getOperationalDID().value,
    });
  }
}

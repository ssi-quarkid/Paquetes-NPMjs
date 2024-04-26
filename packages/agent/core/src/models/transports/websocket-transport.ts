import { DIDDocumentUtils } from '@extrimian/did-core';
import { IPackedDIDCommMessage } from '@extrimian/kms-core';
import { Socket as ServerSocket } from 'socket.io';
import { Socket as ClientSocket } from 'socket.io-client';
import { Agent } from '../../agent';
import { ILiteEvent, LiteEvent } from '../../utils/lite-event';
import { DID } from '../did';
import { ConnectableTransport } from './connectable-transport';
import { MessageArrivedEventArg, TransportSendRequest } from './transport';

type GenericSocket = ServerSocket | ClientSocket;

export abstract class WebsocketTransport extends ConnectableTransport {
  protected agent: Agent;
  protected readonly onMessageArrived = new LiteEvent<MessageArrivedEventArg>();

  protected readonly connectedSockets = new Map<string, GenericSocket>();

  constructor(protected readonly wsDidDocumentId = 'MessagingWebSocket') {
    super();
  }

  get messageArrived(): ILiteEvent<MessageArrivedEventArg> {
    return this.onMessageArrived.expose();
  }

  async dispose(params?: { did: DID }): Promise<void> {
    if (params?.did) {
      const socket = this.connectedSockets.get(params.did.value);
      if (socket) {
        socket.disconnect();
      }
      this.connectedSockets.delete(params.did.value);
      return;
    } else {
      for (const socket of this.connectedSockets.values()) {
        socket.disconnect();
      }
    }
  }

  async initialize(params: { agent: Agent }): Promise<void> {
    this.agent = params.agent;

    this.onMessageArrived.on(async (data) => {
      await this.handleMessage(data, this);
    });
  }

  abstract send(params: TransportSendRequest): Promise<void> | void;

  async transportSupportedByTarget(params: {
    targetDID: DID;
  }): Promise<boolean> {
    const connectedClient = this.connectedSockets.get(params.targetDID.value);

    if (connectedClient) return true;
    const resolver = this.agent.resolver;
    const targetDidDocument = await resolver.resolve(params.targetDID);
    try {
      const websocketUrl = DIDDocumentUtils.getServiceUrl(
        targetDidDocument,
        this.wsDidDocumentId
      )[0];

      return !!websocketUrl;
    } catch {
      return false;
    }
  }

  listenToSocket(
    socket: GenericSocket,
    params?: {
      did: DID;
    }
  ) {
    socket.on(
      'message',
      (data: { message: IPackedDIDCommMessage; did: string }) => {
        const existingSocket = this.connectedSockets.get(data.did);
        if (!existingSocket) {
          this.connectedSockets.set(data.did, socket);
        }
        this.onMessageArrived.trigger({
          data: data.message?.message
            ? JSON.parse(data.message.message)
            : data.message,
          from: DID.from(data.did),
          context: {
            messageManagerCompatible: !!data.message?.message,
          },
        });
      }
    );

    socket.on('connect', () => {
      this.handleConnect({ did: params?.did });
    });

    socket.on('disconnect', () => {
      const socketsByDid = Array.from(this.connectedSockets.entries());
      socketsByDid.forEach(([did, socket]) => {
        if (socket.disconnected) {
          this.handleDisconnect({ did: DID.from(did) });
          this.connectedSockets.delete(did);
        }
      });
    });
  }
}

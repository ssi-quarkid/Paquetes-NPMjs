import { DIDDocument, DIDDocumentUtils } from '@quarkid/did-core';
import {
  DWNAmiClient,
  DWNMessage,
  MessageStorage,
  SendMessageParams,
  ThreadMethod,
} from '@quarkid/dwn-client-ami';
import { Agent } from '../../agent';
import { ILiteEvent, LiteEvent } from '../../utils/lite-event';
import { IAgentResolver } from '../agent-resolver';
import { DID } from '../did';
import { IMessagingTransport } from './messaging-transport';
import { MessageArrivedEventArg, TransportSendRequest } from './transport';
var AsyncLock = require('async-lock');

var lock = new AsyncLock();

export class DWNAmiTransport implements IMessagingTransport {
  private readonly onMessageArrived = new LiteEvent<MessageArrivedEventArg>();
  public get messageArrived(): ILiteEvent<MessageArrivedEventArg> {
    return this.onMessageArrived.expose();
  }

  dwnClientMap: Map<string, DWNAmiClient> = new Map();
  agent: Agent;
  private resolver: IAgentResolver;

  dwnPollMilliseconds: number;

  constructor(params?: { dwnPollMilliseconds: number }) {
    this.dwnPollMilliseconds = params?.dwnPollMilliseconds || 10000;
  }

  async transportSupportedByTarget(params: {
    targetDID: DID;
  }): Promise<boolean> {
    const targetDidDocument = await this.resolver.resolve(params.targetDID);
    const dwnUrl = await DIDDocumentUtils.getServiceUrl(
      targetDidDocument,
      'DecentralizedWebNode',
      'nodes'
    )[0];
    return dwnUrl != null;
  }

  async dispose(): Promise<void> {
    // TODO: dispose
  }

  async processNewDID(did: DID, initialzing: boolean = false) {
    await lock.acquire("dwnClients", async () => {

      if (this.dwnClientMap.get(did.value)) return;

      if (!did.isLongDID()) {
        const longDidDWNClient = Array.from(this.dwnClientMap.keys()).map(x => DID.from(x)).find(x => x.isLongDIDFor(did));

        //Si ya existe un dwn transport polleando el long, se debe eliminar ese polleo y comenzar a pollear el short.
        if (longDidDWNClient) {
          this.dwnClientMap.delete(longDidDWNClient.value);
        }
      } else {
        const shortDidDWNClient = Array.from(this.dwnClientMap.keys()).map(x => DID.from(x)).find(x => x.isShortDIDFor(did));

        //Si ya existe un dwn transport polleando el short, no se debe pollear el DWN del longDID.
        if (shortDidDWNClient) return;
      }

      const didDocument = await this.resolver.resolve(did);
      let dwnClient: DWNAmiClient;

      try {
        const dwnEndpoint = this.getServiceUrl(
          didDocument,
          'DecentralizedWebNode',
          'nodes'
        );

        if (!dwnEndpoint) return;

        dwnClient = new DWNAmiClient({
          did: did.value,
          storage: inMemoryMessageStorage,
          inboxURL: dwnEndpoint[0],
        });

      } catch (ex) {
        console.error(
          'An error occurred while polling for the DWN: DIDDocument has not a DWN service defined or it is not correct'
        );
        return;
      }

      this.dwnClientMap.set(did.value, dwnClient);

      dwnClient.addSubscriber(async (messages: DWNMessage[]) => {
        messages.forEach((message) => {
          //Los mensajes de DIDComm en el DWN vienen con caracteres extraños y no permiten JSON.parsear el string si no se remueven esos caracteres.

          let messageManagerCompatible: boolean = false;
          if (message.data.message) {
            message.data = JSON.parse(message.data.message);
            messageManagerCompatible = true;
          }

          if (
            typeof message.data === 'string' &&
            message.data.indexOf('{') != 0 &&
            message.data.indexOf('"header":{"alg":"ECDH-1PU') > -1
          ) {
            message.data = message.data.substring(
              message.data.indexOf('{'),
              message.data.lastIndexOf('}') + 1
            );
          }

          this.onMessageArrived.trigger({
            from: null,
            // from: messages[0].data?.message?.from,
            data: message.data,
            context: { ...message, messageManagerCompatible },
          });
        });
      });

      if (!initialzing) {
        this.startPollSpecificClient(did.value, dwnClient);
      }
    });
  }

  async initialize(params: { agent: Agent }) {
    this.agent = params.agent;
    this.resolver = this.agent.resolver;

    const dids = this.agent.identity.getDIDs();

    for (let did of dids) {
      await this.processNewDID(DID.from(did), true);
    }

    Array.from(this.dwnClientMap.keys()).forEach(did => {
      this.startPollSpecificClient(did, this.dwnClientMap.get(did));
    });

    this.agent.identity.didCreated.on((args) => {
      this.processNewDID(args.did);
    });

    this.onMessageArrived.on(async (data) => {
      await this.agent.transport.handleMessage(data, this);
    });
  }

  public async send(params: TransportSendRequest): Promise<void> {
    const targetDidDocument = await this.resolver.resolve(params.to);
    const dwnUrl = await DIDDocumentUtils.getServiceUrl(
      targetDidDocument,
      'DecentralizedWebNode',
      'nodes'
    )[0];

    const msgParams: SendMessageParams = {
      targetDID: params.to.value,
      targetInboxURL: dwnUrl,
      message: {
        data: params.context?.messageManagerCompatible
          ? { message: JSON.stringify(params.data) }
          : params.data,
        descriptor: {
          method: undefined,
          dateCreated: new Date(),
          dataFormat: 'application/json',
        },
      },
    };

    if (!params.context?.descriptor?.method) {
      msgParams.message.descriptor.method = ThreadMethod.Create;
    } else {
      msgParams.message.descriptor.method = ThreadMethod.Reply;

      msgParams.message.descriptor.root =
        params.context.descriptor.root || params.context.descriptor.objectId;
      msgParams.message.descriptor.parent = params.context.descriptor.objectId;
    }

    await this.dwnClientMap
      .get(this.agent.identity.getOperationalDID().value)
      .sendMessage(msgParams)
      .catch(console.error);
  }

  async startPollSpecificClient(did: string, dwnClient: DWNAmiClient) {
    try {
      await dwnClient.pullNewMessageWait();
    } catch {
      console.error("Error polling DWNClient for DID", did);
    } finally {
      setTimeout(() => {
        if (this.dwnClientMap.get(did)) {
          this.startPollSpecificClient(did, dwnClient);
        }
      }, this.dwnPollMilliseconds);
    }
  }

  getServiceUrl(
    didDocument: DIDDocument,
    serviceType: string,
    serviceEndpointMapKey?: string
  ): string[] {
    try {
      const service = didDocument.service?.find(
        (service) => service.type === serviceType
      );

      if (!service) return null;

      if (typeof service.serviceEndpoint === 'object')
        return service.serviceEndpoint[serviceEndpointMapKey];
      return [service.serviceEndpoint];
    } catch (error) {
      console.error(error);
      throw Error(`Error finding ${serviceType} service in DID Document`);
    }
  }
}

const messagesStorage: DWNMessage[] = [];
let lastPullDate: Date;

export const inMemoryMessageStorage: MessageStorage = {
  async getMessages(): Promise<DWNMessage[]> {
    return messagesStorage;
  },
  async getLastPullDate(): Promise<Date> {
    return lastPullDate;
  },
  async updateLastPullDate(date: Date): Promise<void> {
    lastPullDate = date;
  },
  async saveMessages(messages: DWNMessage[]): Promise<void> {
    messagesStorage.push(...messages);
  },
};

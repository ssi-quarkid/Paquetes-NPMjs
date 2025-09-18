import { Agent } from '../../agent';
import { ILiteEvent, LiteEvent } from '../../utils/lite-event';
import { DID } from '../did';
import { ITransport, MessageArrivedEventArg } from './transport';

export abstract class ConnectableTransport implements ITransport {
  protected agent: Agent;
  protected readonly onMessageArrived = new LiteEvent<MessageArrivedEventArg>();

  protected handleConnect(params?: { did: DID }): void {
    this.agent.transport.handleConnect({ did: params.did });
  }

  protected handleDisconnect(params: { did: DID }): void {
    this.agent.transport.handleDisconnect({ did: params.did });
  }

  async initialize(params: { agent: Agent }): Promise<void> {
    this.agent = params.agent;
  }

  get messageArrived(): ILiteEvent<MessageArrivedEventArg> {
    return this.onMessageArrived.expose();
  }

  abstract send(params: { data: any; context?: any }): Promise<void> | void;

  protected handleMessage(
    params: MessageArrivedEventArg,
    transport: ITransport
  ): Promise<void> {
    return this.agent.transport.handleMessage(params, transport);
  }

  abstract transportSupportedByTarget(params: {}): Promise<boolean>;

  abstract dispose(): Promise<void>;
}

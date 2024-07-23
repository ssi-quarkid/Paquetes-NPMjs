import { ITransport, MessageArrivedEventArg, TransportSendRequest } from "@quarkid/agent/dist/models/transports/transport";
import { Agent, DID } from "@quarkid/agent";
import { ILiteEvent, LiteEvent } from "@quarkid/agent/dist/utils/lite-event";

const transportMessages = new Array<TransportSendRequest>();
const messageArrived: LiteEvent<MessageArrivedEventArg> = new LiteEvent();

export class MockTransport implements ITransport {
    agent: Agent;

    async dispose(): Promise<void> {

    }

    async transportSupportedByTarget(params: { targetDID: DID; }): Promise<boolean> {
        return true;
    }

    currentDID: string;

    send(params: TransportSendRequest) {
        transportMessages.push(params);

        messageArrived.trigger({
            context: params,
            from: DID.from(this.currentDID),
            data: params.data.message || params.data
        })
    }

    messageArrived: ILiteEvent<MessageArrivedEventArg> = new LiteEvent();
    get onMessageArrived() { return this.messageArrived as LiteEvent<MessageArrivedEventArg>; }

    async initialize(params: { agent: Agent; }): Promise<void> {
        this.agent = params.agent;

        this.currentDID = params.agent.identity.getOperationalDID().value;

        messageArrived.on((message) => {
            if (params.agent.identity.getDIDs().some(y => y == message.context.to.value)) {
                this.onMessageArrived.trigger(message);
                this.agent.transport.handleMessage(message, this)
            }
        });
    }
}
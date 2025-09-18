import { Agent, DID, ITransport } from "../../src";
import { TransportSendRequest, MessageArrivedEventArg } from "../../src/models/transports/transport";
import { ILiteEvent, LiteEvent } from "../../src/utils/lite-event";

const transportMessages = new Array<TransportSendRequest>();
const messageArrived: LiteEvent<MessageArrivedEventArg> = new LiteEvent();

export class TransportMock implements ITransport {
    
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
        this.currentDID = params.agent.identity.getOperationalDID().value;

        messageArrived.on((message) => {
            if (message.context.to == this.currentDID) {
                this.onMessageArrived.trigger(message);
            }
        })
    }
}
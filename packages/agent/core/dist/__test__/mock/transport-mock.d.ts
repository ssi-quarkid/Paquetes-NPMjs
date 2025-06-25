import { Agent, DID, ITransport } from "../../src";
import { TransportSendRequest, MessageArrivedEventArg } from "../../src/models/transports/transport";
import { ILiteEvent, LiteEvent } from "../../src/utils/lite-event";
export declare class TransportMock implements ITransport {
    agent: Agent;
    dispose(): Promise<void>;
    transportSupportedByTarget(params: {
        targetDID: DID;
    }): Promise<boolean>;
    currentDID: string;
    send(params: TransportSendRequest): void;
    messageArrived: ILiteEvent<MessageArrivedEventArg>;
    get onMessageArrived(): LiteEvent<MessageArrivedEventArg>;
    initialize(params: {
        agent: Agent;
    }): Promise<void>;
}

import { ITransport, MessageArrivedEventArg, TransportSendRequest } from "@quarkid/agent/dist/models/transports/transport";
import { Agent, DID } from "@quarkid/agent";
import { ILiteEvent, LiteEvent } from "@quarkid/agent/dist/utils/lite-event";
export declare class MockTransport implements ITransport {
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

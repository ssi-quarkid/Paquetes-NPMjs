import { Agent } from "../../agent";
import { ILiteEvent } from "../../utils/lite-event";
import { DID } from "../did";

export interface ITransport {
    send(params: TransportSendRequest);
    messageArrived: ILiteEvent<MessageArrivedEventArg>;
    initialize(params: { agent: Agent }): Promise<void>;
    transportSupportedByTarget(params: { targetDID: DID }): Promise<boolean>;
    dispose(): Promise<void>;
}

export interface TransportSendRequest {
    data: any;
    from?: DID,
    context?: any;
    to: DID;
}

export interface MessageArrivedEventArg {
    data: any;
    from: DID;
    context: any;
}

export interface ConnectedEventArg {
    did: DID;
}

export type TransportInstance = new (params: any) => ITransport;

export function GetTransportByInstance(transports: ITransport[], instance: TransportInstance): ITransport {
    return transports.find(x => x instanceof instance);
}
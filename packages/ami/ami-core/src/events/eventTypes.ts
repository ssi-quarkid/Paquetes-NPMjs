
import { StandardMessageBodyModel } from "../message/message"

export type StandardMessageEvent = {
    messageId: string;
    body: StandardMessageBodyModel;
    did: string;
    onComplitionACK: boolean;
    thid?: string;
    pthid?:string;
};


export type ACKMessageEvent = {
    messageId: string, 
    status: string ,
    did: string
}

export type ProblemReportMessageEvent = {
    messageId: string,
    code: string,
    comment: string
}


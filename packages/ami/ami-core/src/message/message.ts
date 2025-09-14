
import { DIDCommMessage } from "@quarkid/did-core";
import { MessageTypes , ContentType , ACKStatus , PlsACKOnValues } from "./enums";


export type MessageBodyModel  = StandardMessageBodyModel | ProblemReportBodyModel | AckMessageBodyModel

export type StandardMessageBodyModel = {
    contentType: ContentType;
    data: string
}

export type AckMessageBodyModel = {status:ACKStatus}

export type ProblemReportBodyModel = {
  code: string;
  comment: string;
};

export interface Message extends DIDCommMessage<MessageBodyModel,any> {
  type: MessageTypes;
  create_time: number;
  pls_ack?: {
    on: PlsACKOnValues[]
  };
  pthid?: string;
};

export type StandardMessage = Message & {
  type: MessageTypes.STANDARD_MESSAGE;
  body: StandardMessageBodyModel;
};


export type AckMessage = Message & {
  type: MessageTypes.ACK;
  body:{status:ACKStatus}
};

export type ProblemReportMessage = Message & {
  type: MessageTypes.PROBLEM_REPORT;
  body: ProblemReportBodyModel
};



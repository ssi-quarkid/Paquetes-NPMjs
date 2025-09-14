import { DIDCommMessage } from "@quarkid/did-core";
import { OneClickThreadStorage } from "../storage/OneClickMessageStorage";

export enum MessageTypes {
  OOB = 'extrimian/did-authentication/oob',
  AUTHENTICATION_REQUEST = 'extrimian/did-authentication/request',
  AUTHENTICATION_RESPONSE = 'extrimian/did-authentication/response',
  AUTHENTICATION_RESULT = 'extrimian/did-authentication/result',
  PROBLEM_REPORT = 'extrimian/did-authentication/problem-report',
  ACK = 'extrimian/did-authentication/ack',
}

export enum OobGoalCode {
  LOGIN = 'extrimian/did-authentication/signin',
  SIGNUP = 'extrimian/did-authentication/signup',
}

export interface OneClickMessage extends DIDCommMessage<any,undefined>  {
  type: MessageTypes;
};

export type OobMessage = OneClickMessage & {
  type: MessageTypes.OOB;
  
  body: {
    goalCode: OobGoalCode;
  };
};

export type AuthRequestMessage = OneClickMessage & {
  type: MessageTypes.AUTHENTICATION_REQUEST;
  body: {
    requesterChallenge: string;
  };
};

export type AuthResponseMessage = OneClickMessage & {
  type: MessageTypes.AUTHENTICATION_RESPONSE;
  body: {
    requesterChallenge: string;
    responderChallenge: string;
  };
};

export type AuthResultMessage = OneClickMessage & {
  type: MessageTypes.AUTHENTICATION_RESULT;
  body: {
    responderChallenge: string;
  };
};

export type AckMessage = OneClickMessage & {
  type: MessageTypes.ACK;
  body: {
    status: string;
  };
};

export type ProblemReportMessage = OneClickMessage & {
  type: MessageTypes.PROBLEM_REPORT;
  body: {
    code: string;
    comment: string;
  };
};
export interface IMessageHandler {
  handle(messageThread: OneClickThreadStorage): Promise<OneClickMessage | void>;
}

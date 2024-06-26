import { Entry } from './message';

export type Reply = {
  messageId : string;
  status : {
    code : number;
    message ?: string;
  };
  entries : Entry[][];
};

export type InboxResponse = {
  replies : Reply[];
};

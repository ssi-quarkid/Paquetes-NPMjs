import { Message } from "../message/message";
import { IDIDCommThreadStorage , IDIDCommMessageStorage } from "@quarkid/did-core";

export interface IMessageStorage extends IDIDCommMessageStorage<Message>{

}

export interface IMessageThreadStorage extends IDIDCommThreadStorage<Message>{

}


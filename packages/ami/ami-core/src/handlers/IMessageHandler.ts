import { IMessageThreadStorage } from "../storage/IMessageStorage";
import { Message } from "../message/message"
export interface IMessageHandler {
    handle(messageThread: IMessageThreadStorage): Promise<Message | void>;
}
  
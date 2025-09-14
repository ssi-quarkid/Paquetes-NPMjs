import { IMessageThreadStorage } from '../storage/IMessageStorage';
import { IMessageHandler } from './IMessageHandler';
import { Message } from '../message/message';

class AckMessageHandler implements IMessageHandler {
  async handle(messageThread: IMessageThreadStorage): Promise<any | Message> {
    
    return null;
  }
}
export default AckMessageHandler;

import { IMessageHandler, OneClickMessage } from '../utils/message';
import { OneClickThreadStorage } from '../storage/OneClickMessageStorage';

class AckMessageHandler implements IMessageHandler {
  async handle(messageThread: OneClickThreadStorage): Promise<any | OneClickMessage> {
    return null;
  }
}
export default AckMessageHandler;

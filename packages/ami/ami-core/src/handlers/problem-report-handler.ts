import { IMessageThreadStorage } from '../storage/IMessageStorage';
import { Message } from '../message/message';
import { IMessageHandler } from './IMessageHandler';
class ProblemReportMessageHandler implements IMessageHandler {
  async handle(messageThread: IMessageThreadStorage): Promise<any | Message> {

    return null;
  }
}

export default ProblemReportMessageHandler;

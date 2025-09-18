import { OneClickThreadStorage } from '../storage/OneClickMessageStorage';
import { IMessageHandler, OneClickMessage } from '../utils/message';

class ProblemReportMessageHandler implements IMessageHandler {
  async handle(messageThread: OneClickThreadStorage): Promise<any | OneClickMessage> {
    return null;
  }
}

export default ProblemReportMessageHandler;

import AuthRequestMessageHandler from './handlers/step3-auth-request-message-handler';
import AuthResponseMessageHandler from './handlers/step4-auth-response-message-handler';
import AuthResultMessageHandler from './handlers/step5-auth-result-message-handler';
import OobMessageHandler from './handlers/step2-oob-message-handler';
import { IMessageHandler, OneClickMessage, MessageTypes } from './utils/message';
import ProblemReportMessageHandler from './handlers/problem-report-handler';
import AckMessageHandler from './handlers/step6-ack-message-handler';
import { OneClickThreadStorage } from './storage/OneClickMessageStorage';

export class Interpreter {
  private handlers: Map<MessageTypes, IMessageHandler> = new Map();
  constructor(did: string) {
    this.handlers.set(MessageTypes.OOB, new OobMessageHandler(did));
    this.handlers.set(
      MessageTypes.AUTHENTICATION_REQUEST,
      new AuthRequestMessageHandler(),
    );
    this.handlers.set(
      MessageTypes.AUTHENTICATION_RESPONSE,
      new AuthResponseMessageHandler(),
    );
    this.handlers.set(
      MessageTypes.AUTHENTICATION_RESULT,
      new AuthResultMessageHandler(),
    );
    this.handlers.set(
      MessageTypes.PROBLEM_REPORT,
      new ProblemReportMessageHandler(),
    );
    this.handlers.set(MessageTypes.ACK, new AckMessageHandler());
  }

  async interpret(messageThread: OneClickThreadStorage): Promise<OneClickMessage | any> {
    const len = await messageThread.getMessageCount();
    if (len == 0) {
      throw new Error(`Empty message thread`);
    }
    const message = await messageThread.getByIndex(len-1) as OneClickMessage;

    let handler = this.handlers.get(message.type);

    if (!handler) {
      throw new Error(`No handler for message type: ${message.type}`);
    }

    return await handler.handle(messageThread);
  }
}
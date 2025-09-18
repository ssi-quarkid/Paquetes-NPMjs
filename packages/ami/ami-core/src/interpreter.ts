
import { Message} from './message/message';
import { MessageTypes } from './message/enums';
import { IMessageHandler } from './handlers/IMessageHandler'
import ProblemReportMessageHandler from './handlers/problem-report-handler';
import AckMessageHandler from './handlers/ack-message-handler';
import StandardMessageHandler from './handlers/standard-message-handler';
import { StandardMessageEvent } from './events/eventTypes';
import { LiteEvent } from './events/lite-event';
import { IMessageThreadStorage } from './storage/IMessageStorage';

export class Interpreter {
  private handlers: Map<MessageTypes, IMessageHandler> = new Map();
  constructor(did: string , standardMessageEvent: LiteEvent<StandardMessageEvent>) {
    this.handlers.set(MessageTypes.ACK, new AckMessageHandler());
    this.handlers.set(
      MessageTypes.STANDARD_MESSAGE,
      new StandardMessageHandler(did , standardMessageEvent),
    );
    this.handlers.set(
      MessageTypes.PROBLEM_REPORT,
      new ProblemReportMessageHandler(),
    );
  }

  async interpret(messageThread: IMessageThreadStorage): Promise<Message | any> {
    const len = await messageThread.getMessageCount();
    if (len == 0) {
      throw new Error(`Empty message thread`);
    }
    const message = await messageThread.getByIndex(len-1) as Message;

    let handler = this.handlers.get(message.type);

    if (!handler) {
      throw new Error(`No handler for message type: ${message.type}`);
    }

    return await handler.handle(messageThread);
  }
}
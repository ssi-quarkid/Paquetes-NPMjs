import { Guid } from '../utils/guid';
import { extractExpectedChallenge } from '../utils/challenge';
import { OneClickThreadStorage } from '../storage/OneClickMessageStorage';

import {
  AckMessage,
  IMessageHandler,
  OneClickMessage,
  MessageTypes,
  ProblemReportMessage,
} from '../utils/message';

class AuthResultMessageHandler implements IMessageHandler {
  async handle(
    messageThread: OneClickThreadStorage,
  ): Promise<AckMessage | ProblemReportMessage> {
    const len = await messageThread.getMessageCount();
    const thread = await messageThread.getAll();
    const message = thread[len-1];
    const authResponseMessage = thread.find(
      (message) => message.type === MessageTypes.AUTHENTICATION_RESPONSE,
    );
    const challengeToCheck = extractExpectedChallenge(
      authResponseMessage,
      message?.body.responderChallenge,
    );

    if (!challengeToCheck) {
      return {
        id: Guid.newGuid(),
        thid: message.thid,
        type: MessageTypes.PROBLEM_REPORT,
        from: message.to[0]!,
        to: [message.from],
        body: {
          code: 'reject-authentication',
          comment: 'Verification of Responder Challenge faild',
        },
      };
    }

    let ack: AckMessage = {
      id: Guid.newGuid(),
      thid: message.thid,
      type: MessageTypes.ACK,
      from: message.to[0]!,
      to: [message.from],
      body: {
        status: 'Ok',
      },
    };
    return ack;
  }
}

export default AuthResultMessageHandler;

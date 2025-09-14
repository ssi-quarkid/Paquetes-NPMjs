import { extractExpectedChallenge } from '../utils/challenge';
import { OneClickThreadStorage } from '../storage/OneClickMessageStorage';

import {
  AuthResultMessage,
  IMessageHandler,
  OneClickMessage,
  MessageTypes,
  ProblemReportMessage,
} from '../utils/message';
import { Guid } from '../utils/guid';
class AuthResponseMessageHandler implements IMessageHandler {
  async handle(
    messageThread:OneClickThreadStorage,
  ): Promise<AuthResultMessage | ProblemReportMessage> {
    const len = await messageThread.getMessageCount();
    const thread = await messageThread.getAll();
    const message = thread[len-1];
    const authRequestMessage = thread.find(
      (message) => message.type === MessageTypes.AUTHENTICATION_REQUEST,
    );
    const challengeToCheck = extractExpectedChallenge(
      authRequestMessage,
      message.body.requesterChallenge,
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
          comment: 'Verification of Requester Challenge failed',
        },
      };
    }
    let authResult: AuthResultMessage = {
      id: Guid.newGuid(),
      thid: message.thid,
      type: MessageTypes.AUTHENTICATION_RESULT,
      from: message.to[0]!,
      to: [message.from],
      body: {
        responderChallenge: message.body.responderChallenge,
      },
    };
    return authResult;
  }
}

export default AuthResponseMessageHandler;

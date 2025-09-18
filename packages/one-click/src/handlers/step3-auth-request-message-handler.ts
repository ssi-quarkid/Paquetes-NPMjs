import { Guid } from '../utils/guid';
import { OneClickThreadStorage } from '../storage/OneClickMessageStorage';

import {
  AuthResponseMessage,
  IMessageHandler,
  OneClickMessage,
  MessageTypes,
} from '../utils/message';


class AuthRequestMessageHandler implements IMessageHandler {
  async handle(messageThread:OneClickThreadStorage): Promise<AuthResponseMessage> {
    const len = await messageThread.getMessageCount();
    const message = await messageThread.getByIndex(len-1) as OneClickMessage;

    let authResponse: AuthResponseMessage = {
      id: Guid.newGuid(),
      thid: message.thid,
      type: MessageTypes.AUTHENTICATION_RESPONSE,
      from: message.to[0]!,
      to: [message.from],
      body: {
        requesterChallenge: message.body.requesterChallenge,
        responderChallenge: Guid.newGuid(),
      },
    };
    return authResponse;
  }
}

export default AuthRequestMessageHandler;

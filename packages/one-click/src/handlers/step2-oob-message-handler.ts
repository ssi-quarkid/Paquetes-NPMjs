import {
  AuthRequestMessage,
  IMessageHandler,
  OneClickMessage,
  MessageTypes,
} from '../utils/message';

// import { callbacks } from '../callbacks';
import { Guid } from '../utils/guid';
import { OneClickThreadStorage } from '../storage/OneClickMessageStorage';

class OobMessageHandler implements IMessageHandler {

  constructor(private did: string) {

  }

  async handle(messageThread: OneClickThreadStorage): Promise<AuthRequestMessage> {


    return null;
  }
}

export default OobMessageHandler;

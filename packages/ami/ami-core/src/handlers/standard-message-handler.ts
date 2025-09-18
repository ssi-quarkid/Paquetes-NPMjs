import {
  AckMessage,
  Message,
  StandardMessage,
} from '../message/message';
import { 
    MessageTypes,
    ACKStatus,
    PlsACKOnValues
} from '../message/enums'

import {
    IMessageHandler
} from './IMessageHandler'
// import { callbacks } from '../callbacks';
import { Guid } from '../utils/guid';
import { LiteEvent } from '../events/lite-event';
import { StandardMessageEvent } from '../events/eventTypes';
import { IMessageThreadStorage } from '../storage/IMessageStorage';
class StandardMessageHandler implements IMessageHandler {

    constructor(private did: string , private onStandardMessage: LiteEvent<StandardMessageEvent>) {
    }

    async handle(messageThread: IMessageThreadStorage): Promise<AckMessage | void> {
    //el thread va siempre en memoria? podria hacerse con un thread de storage
        const len = await messageThread.getMessageCount();
        const message = await messageThread.getByIndex(len-1) as StandardMessage;
        
        let on_complition_ACK = false;
        let return_message = null

        const has_receipt = message.pls_ack?.on.filter( x => x == PlsACKOnValues.RECEIPT).length > 0
        const has_outcome = message.pls_ack?.on.filter( x => x == PlsACKOnValues.OUTCOME).length > 0
        
        if(has_receipt){
            let status = ACKStatus.OK;
            if(has_outcome){
                status = ACKStatus.PENDING;
                on_complition_ACK = true;
            }
            return_message = {
                thid: message.thid,
                id: Guid.newGuid(),
                type: MessageTypes.ACK,
                from: this.did,
                to:[ message.from ],
                body: {
                    status: status 
                },
                create_time: Math.floor(new Date().getTime()/1000),
                attachments: null
            };
        }

        
        this.onStandardMessage.trigger({ messageId: message.id , did:message.from , body: message.body , onComplitionACK: on_complition_ACK , thid: message.thid , pthid: message.pthid })
        
      
        return return_message
    }
 
}


export default StandardMessageHandler;

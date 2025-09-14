import { ACKStatus, AckMessage, IMessageThreadStorage, Message, MessageTypes, PlsACKOnValues } from "@quarkid/ami-core";
import { ChatMessage, IncomingChatMessageStatus,  OutgoingChatMessageStatus } from "./chat-message";

function getOutgoingChatMessageStatus(thread: Message[] , owner: string): OutgoingChatMessageStatus{
    let has_error = thread.filter( x => x.type === MessageTypes.PROBLEM_REPORT).length > 0

    if(has_error)
        return OutgoingChatMessageStatus.ERROR
    let firstMessage = thread[0]

    if(!firstMessage.pls_ack)
        return OutgoingChatMessageStatus.NOTIFICATION
    
    let requested_received = firstMessage.pls_ack.on.filter( x => x == PlsACKOnValues.RECEIPT).length > 0
    let requested_outcome =  firstMessage.pls_ack.on.filter( x => x == PlsACKOnValues.OUTCOME).length > 0

    if(!requested_outcome && !requested_received)
        return OutgoingChatMessageStatus.NOTIFICATION
        
    
    let acks : AckMessage[] = thread.filter(x => x.type === MessageTypes.ACK && x.from === firstMessage.to[0]) as AckMessage[]
    let ok_received = acks.filter( x => x.body.status === ACKStatus.OK).length > 0
    let pending_received = acks.filter( x => x.body.status === ACKStatus.PENDING).length > 0

    if(requested_received && !requested_outcome){

        if(!ok_received)
            return OutgoingChatMessageStatus.AWAITING_RECEIVED
        
        return OutgoingChatMessageStatus.RECEIVED

    }else if( requested_received && requested_outcome){

        if(!pending_received) //todavia no llego el pending
            return OutgoingChatMessageStatus.AWAITING_RECEIVED

        
        if(pending_received && !ok_received) //le llego pero todavia no me confirmo
            return OutgoingChatMessageStatus.RECEIVED_AWAITING_CONFIRMATION

        return OutgoingChatMessageStatus.CONFIRMED //esta confirmada
    }else{ //!requested_received && requested_outcome
        if(!ok_received)
            return OutgoingChatMessageStatus.AWAITING_CONFIRMATION
        return OutgoingChatMessageStatus.CONFIRMED
     }
    

}

function getIncomingChatMessageStatus(thread: Message[] , owner: string): IncomingChatMessageStatus {
    let has_error = thread.filter( x => x.type === MessageTypes.PROBLEM_REPORT).length > 0

    if(has_error)
        return IncomingChatMessageStatus.ERROR
    
    
    let firstMessage = thread[0]
   
    if(!firstMessage.pls_ack)
        return IncomingChatMessageStatus.NOTIFICATION
    
    let requested_received = firstMessage.pls_ack.on.filter( x => x == PlsACKOnValues.RECEIPT).length > 0
    let requested_outcome =  firstMessage.pls_ack.on.filter( x => x == PlsACKOnValues.OUTCOME).length > 0

    if(!requested_outcome && !requested_received)
        return IncomingChatMessageStatus.NOTIFICATION
        
    
    let acks : AckMessage[] = thread.filter(x => x.type === MessageTypes.ACK && x.from === firstMessage.to[0] && x.from == owner) as AckMessage[]
    let ok_sent = acks.filter( x => x.body.status === ACKStatus.OK).length > 0
    let pending_sent = acks.filter( x => x.body.status === ACKStatus.PENDING).length > 0

   if(requested_outcome){
        if(ok_sent)
            return IncomingChatMessageStatus.CONFIRMED
        if(pending_sent)
            return IncomingChatMessageStatus.MUST_CONFIRM
        return IncomingChatMessageStatus.ERROR
   }
   if(requested_received){
        if(ok_sent)
            return IncomingChatMessageStatus.RECEIVED
        return IncomingChatMessageStatus.ERROR
   }
   return IncomingChatMessageStatus.ERROR
}

export async function parseChatMessage(thread: IMessageThreadStorage , owner:string): Promise<ChatMessage>{
    if(thread == null)
        return null;
    let fullThread = await thread.getAll() || []
    if(fullThread.length === 0)
        return null
    let status : IncomingChatMessageStatus |  OutgoingChatMessageStatus; 
    if(fullThread[0].from === owner)
        status = getOutgoingChatMessageStatus(fullThread,owner);
    else
        status = getIncomingChatMessageStatus(fullThread,owner);

    return {
        message: fullThread[0],
        status: status
    }
    
}

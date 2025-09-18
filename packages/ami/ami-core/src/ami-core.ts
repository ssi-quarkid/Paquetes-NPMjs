import { Interpreter } from "./interpreter";
import { LiteEvent } from "./events/lite-event";
import { Message , ProblemReportBodyModel} from "./message/message";
import {  MessageTypes, ACKStatus} from "./message/enums"
import { StandardMessageEvent , ACKMessageEvent, ProblemReportMessageEvent} from "./events/eventTypes";
import { IMessageStorage, IMessageThreadStorage } from "./storage/IMessageStorage";

export class AMICore {

    interpreter: Interpreter;
   
    private onStandardMessage: LiteEvent<StandardMessageEvent> = new LiteEvent();
    public get standardMessage() { return this.onStandardMessage.expose(); }

    private onMessageAck: LiteEvent<ACKMessageEvent> = new LiteEvent();
    public get messageAck() { return this.onMessageAck.expose(); }


    private onProblemReport: LiteEvent<ProblemReportMessageEvent> = new LiteEvent();
    public get problemReport() { return this.onProblemReport.expose(); }
    

    constructor(
        did: string,
        private storage: IMessageStorage ){
        this.interpreter = new Interpreter(did, this.onStandardMessage);        
    }

    async isMessage(m: Message): Promise<boolean> {
        return Object.values(MessageTypes).includes(m.type as MessageTypes)
    }

    async getMessage(messageId: string ): Promise<Message>{
        return await this.storage.get(messageId);
    }

    async processNewMessage(message: Message): Promise<boolean>{
        return await this.storage.add(message);
    }
    
    async getThread(thid:string ) : Promise<IMessageThreadStorage>{
        return await this.storage.getByThread(thid);
    }
    async removeThread(message:Message){
        let thread = message.thid;
        return await this.removeThreadById(thread);
    }
    async removeThreadById(thid:string){
        return await this.storage.removeThread(thid);
    }
    

    async processMessage(m: Message) : Promise<Message>{
        
        switch (m.type) {
            case MessageTypes.PROBLEM_REPORT:
                let bodyReport = m.body as ProblemReportBodyModel;
                this.onProblemReport.trigger({ messageId: m.id, code: bodyReport.code, comment: bodyReport.comment }); break;
            case MessageTypes.ACK:
                let bodyAck = m.body as { status: ACKStatus}
                this.onMessageAck.trigger({ messageId: m.id, did: m.from , status: bodyAck.status}); break;
        }

        await this.storage.add(m);
        
        let threadStorage = await this.storage.getByThread(m.thid)
        
        const response = await this.interpreter.interpret(threadStorage);

        if (!response) return null;

        await this.storage.add(response);

        return response;
    }
}
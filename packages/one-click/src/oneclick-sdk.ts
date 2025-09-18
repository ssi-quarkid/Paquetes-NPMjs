import { DIDCommPackedMessage } from "@quarkid/kms-core";
import { Interpreter } from "./interpreter";
import { LiteEvent } from "./lite-event";
import { Guid } from "./utils/guid";
import { OneClickMessage, MessageTypes, OobGoalCode, OobMessage, AuthRequestMessage } from "./utils/message";
import { IStorage } from "@quarkid/did-core";
import { OneClickMessageStorage, OneClickThreadStorage } from "./storage/OneClickMessageStorage";

export class OneClickSDK {
    interpreter: Interpreter;
    storage : OneClickMessageStorage ;

    private onUserLoggedIn: LiteEvent<{ invitationId: string, did: string , isServer: boolean}> = new LiteEvent();
    public get userLoggedIn() { return this.onUserLoggedIn.expose(); }

    private onOOBReceived: LiteEvent<{ invitationId: string, did: string }> = new LiteEvent();
    public get OOBReceived() { return this.onOOBReceived.expose(); }

    private onLoginStarted: LiteEvent<{ invitationId: string, did: string , isOob: boolean }> = new LiteEvent();
    public get loginStarted() { return this.onLoginStarted.expose(); }

    

    private onProblemReport: LiteEvent<{
        invitationId: string,
        code: string,
        comment: string
    }> = new LiteEvent();
    public get problemReport() { return this.onProblemReport.expose(); }

    constructor(
        private did: string,
        private didcommPack: (to: string, message: any) => Promise<{ packedMessage: any }>,
        private didcommUnpack: (message: any) => Promise<any>,
        messageIStorage: IStorage,
        threadIStorage: IStorage) {
        this.interpreter = new Interpreter(did);
        this.storage = new OneClickMessageStorage(messageIStorage , threadIStorage);
    }

    async isOneClickMessage(message: DIDCommPackedMessage | OneClickMessage): Promise<boolean> {
        let m: OneClickMessage;

        if ((<OneClickMessage>message).id) {
            m = message as OneClickMessage;
        } else {
            m = await this.didcommUnpack(message);
        }

        return Object.values(MessageTypes).indexOf(m.type) != -1
    }

    async createInvitationMessage(): Promise<OobMessage> {
        let id = Guid.newGuid();
        return {
            id: id ,
            thid: id,
            type: MessageTypes.OOB,
            from: this.did,
            body: {
                goalCode: OobGoalCode.LOGIN,
            },
        };
    }
    

    async getMessageThread(thid: string): Promise<OneClickThreadStorage>{
        return this.storage.getByThread(thid);
    }

    async getMessage(id:string , thid?: string): Promise<OneClickMessage>{
        return this.storage.get(id,thid);
    }

    async createOOBResponse(oobMessageId: string){
        let message = await this.storage.get(oobMessageId , oobMessageId);
        if(!message)
            throw new Error("oob message not found");
        let response : AuthRequestMessage =  {
          id: Guid.newGuid(),
          thid: message.thid,
          type: MessageTypes.AUTHENTICATION_REQUEST,
          from: this.did,
          to: [message.from],
          body: {
            requesterChallenge: Guid.newGuid(),
          },
        };
        await this.storage.add(response);
        this.onLoginStarted.trigger({ invitationId: message.thid, did: message.from , isOob: true});
        return await this.didcommPack(message.from, response);
    }

    async processMessage(message: DIDCommPackedMessage | OneClickMessage) {
    
        let m: any;

        if ((<OneClickMessage>message).id) {

            m = message as OneClickMessage;
        } else {
            m = await this.didcommUnpack(message);

        }
    

        switch (m.type) {
            case MessageTypes.PROBLEM_REPORT:
                this.onProblemReport.trigger({ invitationId: m.thid,code: m.body.code, comment: m.body.comment }); break;
            case MessageTypes.OOB:
                this.onOOBReceived.trigger({ invitationId: m.thid, did: m.from }); break;
            case MessageTypes.AUTHENTICATION_REQUEST:
                this.onLoginStarted.trigger({ invitationId: m.thid, did: m.from  , isOob: false}); break;
            case MessageTypes.AUTHENTICATION_RESULT:
                this.onUserLoggedIn.trigger({ invitationId: m.thid, did: m.from , isServer: false}); break;
            case MessageTypes.ACK:
                this.onUserLoggedIn.trigger({ invitationId: m.thid, did: m.from , isServer: true }); break;
        }

        
        await this.storage.add(m)
        let thread = await this.storage.getByThread(m.thid);
        const response = await this.interpreter.interpret(thread);
        
        
        if (!response || response === null) return null;

        await this.storage.add(response);
        let packed = await this.didcommPack(m.from, response);
        return packed

    }
}
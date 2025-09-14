
import { Message, Guid ,
    AMICore , IMessageStorage , MessageTypes, StandardMessageBodyModel,
     AckMessage, StandardMessage, ACKStatus, PlsACKOnValues, ContentType, ProblemReportMessage, ProblemReportBodyModel } from "@quarkid/ami-core";
import { IStorage } from "./storage/storage";
import { IChat, IChatStorage } from "./storage/IChatStorage";
import { ChatStorage } from "./storage/ChatStorage";
import { DIDCommPackedMessage } from "@quarkid/kms-core";
import { StandardEncoder } from "./encoders/StandardEncoder"
import { IEncoder } from "./encoders/IEncoder";
import { isBase64String } from "./encoders/utils";

export class AMISDK {
    
    private core: AMICore;
    private chatStorage: IChatStorage;

    public get standardMessage() { return this.core.standardMessage; }
    public get messageAck() { return this.core.messageAck; }
    public get problemReport() { return this.core.problemReport; }
    private encoder : IEncoder;
    constructor(
        private did: string,
        private didcommPack: (to: string, message: any) => Promise<{ packedMessage: any }>,
        private didcommUnpack: (message: any) => Promise<any>,
        messageStorage : IMessageStorage , 
        chatIStorage : IStorage , 
        messageEncoder?: IEncoder )
    {
        if(!messageEncoder)
            this.encoder = new StandardEncoder()
        else
            this.encoder = messageEncoder
        this.core = new AMICore(did,messageStorage);       

        this.chatStorage = new ChatStorage(chatIStorage , this.core , this.did);
    }

    async isMessage(message: DIDCommPackedMessage ): Promise<boolean> {
        let m: Message = await this.didcommUnpack(message);
        return await this.core.isMessage(m);
    }
    async isMessageUnpacked(m: Message ): Promise<boolean> {
        return await this.core.isMessage(m);
    }

    async getChats(): Promise<IChat[]>{
        return await this.chatStorage.getAll();
    }

    async getChatByDid(did:string): Promise<IChat>{
        return await this.chatStorage.getChatById(did);
    }

    async getMessage(messageId: string){
        return await this.core.getMessage(messageId);
    }
 

    async packMessage(message: Message, to: string): Promise<{ packedMessage: DIDCommPackedMessage }> {
        if(message.to.filter(x => x === to ).length === 0)
                throw new Error("Destiny DID not found in message");
        return await this.didcommPack(message.to[0] , message);
    }

    
    
    async createFileMessageBody(contentType: ContentType , binaryData: Uint8Array): Promise<{contentType: ContentType , data: string}>{
        if(contentType === ContentType.TEXT)
            throw new Error("Message type is Standard Message"); 

        const encodedData = await this.encoder.encodeUint8ArrayToBase64(binaryData)
        if(!isBase64String(encodedData))
            throw new Error("Encoder error, data is not base64")

        return {
            contentType: contentType,
            data: encodedData
        }
    }

    async decodeFileMessageBody(message: StandardMessageBodyModel) : Promise<Uint8Array>{ 
        if(message.contentType === ContentType.TEXT)
            throw new Error("Message type is Standard Message")
        return await this.encoder.decodeBase64ToUint8Array(message.data)
    }



    async getMessageDataBuffer(messageId: string ) 
    : Promise<{contentType: ContentType , data: Uint8Array}> {
        const message = await this.core.getMessage(messageId)
        
        if(message == null)
        throw new Error("Message not found");

        
        if(message.type !== MessageTypes.STANDARD_MESSAGE)
            throw new Error("Message type is not Standard Message");


        let messageBody: StandardMessageBodyModel = message.body as StandardMessageBodyModel;
        if(messageBody.contentType === ContentType.TEXT)
            throw new Error("Message is content plaintext, please use getMessage()");

        const decodedBinaryData = await this.encoder.decodeBase64ToUint8Array(messageBody.data)

        return { 
            contentType: messageBody.contentType,
            data: decodedBinaryData
        }
    }

    async createStandardMessage(body: StandardMessageBodyModel, to: string[] ,thid?: string , plsACKOnValues?: PlsACKOnValues[] , pthid?: string): Promise<StandardMessage> {
        let id = Guid.newGuid()
        let ackInfo = {}
        if(plsACKOnValues){
            ackInfo = {
                pls_ack:{
                    on: plsACKOnValues
                }
            }
        }
        
        let message: StandardMessage = {
            id: id,
            thid: thid? thid : id ,
            type: MessageTypes.STANDARD_MESSAGE,
            from: this.did,
            to: to,
            body: body,
            create_time: Math.floor(new Date().getTime()/1000),
            attachments: null,
            pthid: pthid,
            ...ackInfo
        };
        await this.core.processNewMessage(message)
        await this.chatStorage.addMessage(message);
        return message;
    }


    async createAckMessage(to: string , thid: string): Promise<AckMessage>{ 
        let message : AckMessage= {
            id: Guid.newGuid() ,
            thid: thid,
            type: MessageTypes.ACK,
            from: this.did,
            create_time: Math.floor(new Date().getTime()/1000),
            to: [to],
            body: {status: ACKStatus.OK},
            attachments: null,
        };
        await this.core.processNewMessage(message);
        await this.chatStorage.addMessage(message);
        return message;
    }

    async createProblemReport(to: string , thid: string , problem: ProblemReportBodyModel): Promise<ProblemReportMessage>{ 
        let message : ProblemReportMessage= {
            id: Guid.newGuid() ,
            thid: thid,
            type: MessageTypes.PROBLEM_REPORT,
            from: this.did,
            create_time: Math.floor(new Date().getTime()/1000),
            to: [to],
            body: problem,
            attachments: null,
        };
        await this.core.processNewMessage(message);
        await this.chatStorage.addMessage(message);
        return message;
    }
    
    //json web messaging
    async processMessage(message: DIDCommPackedMessage ) : Promise<{packedMessage: DIDCommPackedMessage}>{
        let m: Message = await this.didcommUnpack(message);
        const response = await this.core.processMessage(m)
        await this.chatStorage.addMessage(m);
        if(response === null)
            return null
        await this.chatStorage.addMessage(response);
        return this.didcommPack(m.from, response);
    }
}
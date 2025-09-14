import { Agent, DID, IAgentPlugin, IAgentPluginMessage, IAgentPluginResponse, ITransport } from "@quarkid/agent";
import { DIDCommMessage } from "@quarkid/ami-core";
import { AMISDK, IEncoder, IStorage, MessageStorage } from "../../src";



export default class AMISDKplugin implements IAgentPlugin{

    private _agent: Agent;
    private _amisdk : AMISDK
    public get amisdk() : AMISDK {return this._amisdk}

    private _messageIStorage : IStorage;
    private _messageThreadIStorage : IStorage;
    private _chatIStorage : IStorage;
    private _encoder : IEncoder | undefined;
    async canHandle(input: IAgentPluginMessage): Promise<boolean>{
        return this._amisdk.isMessage(input.message);
    }
    async handle(input: IAgentPluginMessage): Promise<IAgentPluginResponse>{
        return {
            message : (await this.amisdk.processMessage(input.message)).packedMessage,
            to: DID.from((input.message as DIDCommMessage).from)
        }
    }

    private initializeSDK(){
        const agent = this._agent;
        if(agent.identity.getOperationalDID().isLongDID())
            return
        const did = agent.identity.getOperationalDID().value
        const pack = (to: string, message) => agent.messaging.packMessage(
            {
                to: DID.from(to),
                message
            })
        const unpack =  (message) => agent.messaging.unpackMessage({ message })
        const messageStorage = new MessageStorage(this._messageIStorage ,this._messageThreadIStorage)
        this._amisdk = new AMISDK(did , pack , unpack , messageStorage , this._chatIStorage , this._encoder)
    }
    async initialize(params: {
        agent: Agent;
    }): Promise<void>{
        console.log("intializing sdk")
        this._agent = params.agent
        if (this._agent.identity.getOperationalDID()?.value) {
            this.initializeSDK();
        }
    
        this._agent.identity.operationalDIDChanged.on(() => {
        // console.log("SDK CHANGED")
        this.initializeSDK();
        });
    
        this._agent.identity.didCreated.on(() => {
        // console.log("Did ready")

        this.initializeSDK();
        });
    }

    constructor(params: {
        messageIStorage: IStorage , 
        messageThreadIStorage: IStorage,
        chatIStorage: IStorage
        encoder?: IEncoder}){
        this._messageIStorage = params.messageIStorage
        this._messageThreadIStorage = params.messageThreadIStorage
        this._chatIStorage = params.chatIStorage
        this._encoder = params.encoder;
      
    }

    // async sendMessage(to: string , body: StandardMessageBodyModel , thid?:string ,pls_ack?: PlsACKOnValues[]){
    //     const message = await this.amisdk.createStandardMessage(body , [to] , thid, pls_ack);
    //      await this.agent.messaging.sendMessage( {to: DID.from(to) , message, })
    // }

}

// export default class SimpleAMISDKTransport implements ITransport {
//     private amisdk : AMISDK
//     private agent: Agent
//     constructor( params: {agent: Agent , amisdk: AMISDK} ){
//         this.agent = params.agent;
//         this.amisdk = params.amisdk;
//     }

//     async send(params: TransportSendRequest) {
        
//     }
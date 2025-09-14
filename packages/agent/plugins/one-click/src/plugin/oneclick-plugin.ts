import {
  Agent,
  DID,
  IAgentPlugin,
  IAgentPluginMessage,
  IAgentPluginResponse,
} from '@quarkid/agent';
import { MessageTypes, OneClickMessage, OneClickSDK } from '@quarkid/oneclick-sdk';
import { decode } from 'base-64';
import { LiteEvent } from '../events/lite-event';
import { IStorage } from '@quarkid/did-core';

export class OneClickPlugin implements IAgentPlugin {
  private agent: Agent;
  oneClickSDK: OneClickSDK;

  private onUserLoggedIn: LiteEvent<{ invitationId: string, did: string }> = new LiteEvent();
  public get userLoggedIn() { return this.onUserLoggedIn.expose(); }

  private onLoginStarted: LiteEvent<{ invitationId: string, did: string }> = new LiteEvent();
  public get loginStarted() { return this.onLoginStarted.expose(); }

  private onProblemReport: LiteEvent<{
    invitationId: string,
    code: string,
    comment: string
  }> = new LiteEvent();
  public get problemReport() { return this.onProblemReport.expose(); }

  constructor(   
      private messageIStorage : IStorage,
      private threadIStorage: IStorage , 
      private oobDecider: (  invitationId: string, did: string , sdk : OneClickSDK  ) => Promise<boolean>
  ) { }

  async initialize(params: { agent: Agent }): Promise<void> {
    this.agent = params.agent;

    if (this.agent.identity.getOperationalDID()?.value) {
      this.initializeOneClickSDK();
    }

    this.agent.identity.operationalDIDChanged.on(() => {
      this.initializeOneClickSDK();
    });

    this.agent.identity.didCreated.on(() => {
      this.initializeOneClickSDK();
    });
  }

  private initializeOneClickSDK() {
    if (this.oneClickSDK) {
      this.oneClickSDK.userLoggedIn.off(this.userLoggedInHandle)
      this.oneClickSDK.loginStarted.off(this.loginStartedHandle)
      this.oneClickSDK.problemReport.off(this.problemReportHandle)
    }

    this.oneClickSDK = new OneClickSDK(
      this.agent.identity.getOperationalDID().value,
      (to: string, message) =>
        this.agent.messaging.packMessage({
          to: DID.from(to),
          message,
        }),
      (message) => this.agent.messaging.unpackMessage({ message }), this.messageIStorage , this.threadIStorage 
    );

    this.oneClickSDK.userLoggedIn.on(this.userLoggedInHandle.bind(this));
    this.oneClickSDK.loginStarted.on(this.loginStartedHandle.bind(this));
    this.oneClickSDK.problemReport.on(this.problemReportHandle.bind(this));
  }

  private userLoggedInHandle(p: { invitationId: string, did: string }) {
    this.onUserLoggedIn.trigger(p);
  }

  private loginStartedHandle(p: { invitationId: string, did: string }) {
    this.onLoginStarted.trigger(p);
  }

  private problemReportHandle(p: { invitationId: string ,code: string, comment: string }) {
    this.onProblemReport.trigger(p);
  }

  async canHandle(input: IAgentPluginMessage): Promise<boolean> {
    let message = input.message;

    if (typeof input.message == 'string' && input.message.indexOf('_oob=')) {
      const oob = this.getOOB(input.message);

      if (typeof oob === 'string') {
        message = JSON.parse(oob);
      }
    }

    return await this.oneClickSDK.isOneClickMessage(message);
  }

  async handle(input: IAgentPluginMessage): Promise<IAgentPluginResponse> {
    let message = input.message;
   
    if (typeof input.message == 'string' && input.message.indexOf('_oob=')) {
      const oob = this.getOOB(input.message);

      if (typeof oob === 'string') {
        message = JSON.parse(oob);
      }
    }
    
    const m = await this.oneClickSDK.processMessage(message);
    
    if(message.type === MessageTypes.OOB){
      console.log("calling decider")
      
      this.oobDecider(message.id , message.from , this.oneClickSDK )
          .then( async (decision) => {
            console.log("decision" , decision)
              await this.agent.transport.sendMessage(
                {
                  to: DID.from(message.from) ,
                  message: (await this.oneClickSDK.createOOBResponse(message.id)).packedMessage
                } )
            
          } );
      // let decision = await this.oobDecider(message.id , message.from , this.oneClickSDK);
      // if(decision)
      //   return {
      //     message: (await this.oneClickSDK.createOOBResponse(message.id)).packedMessage ,
      //     to: DID.from(message.from)
      //   }
      
    }

    if (!m) return null;

    return {
      message: m.packedMessage,
      to: DID.from(message.from),
    };
    
  }

  private getOOB(url) {
    try {
      if (url.includes('_oob=')) {
        return decode(url?.split('_oob=')[1].split('&')[0]);
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async createInvitationMessage() {
    return this.oneClickSDK.createInvitationMessage();
  }

  async getMessageThread(thid: string): Promise<OneClickMessage[]>{
    return (await this.oneClickSDK.getMessageThread(thid)).getAll();
  }

  async getMessage(id:string , thid?: string): Promise<OneClickMessage>{
      return this.oneClickSDK.getMessage(id,thid);
  }

}

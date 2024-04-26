import { IssuerData, VerifiableCredentialWithInfo } from "@extrimian/agent/src/vc/protocols/waci-protocol";
import { VerifiableCredential } from "@extrimian/vc-core";
import { WACIMessage } from "@extrimian/waci";
import { Agent } from "../../agent";
import { DID } from "../../models/did";
import { LiteEvent } from "../../utils/lite-event";
import { CredentialFlow } from "../models/credentia-flow";

export enum ActorRole {
    Issuer,
    Holder,
    Verifier,
}

export abstract class VCProtocol<TProtocolMessage = any> {
    // protected readonly onCredentialRequested = new LiteEvent<CredentialRequestedEventArg>;
    // public get credentialRequested() { return this.onCredentialRequested.expose(); }

    protected readonly onVcArrived = new LiteEvent<{ credentials: VerifiableCredentialWithInfo[], issuer: IssuerData, messageId: string }>;
    public get vcArrived() { return this.onVcArrived.expose(); }

    protected readonly onCredentialIssued = new LiteEvent<{ vc: VerifiableCredential, toDID: DID, invitationId?: string }>;
    public get credentialIssued() { return this.onCredentialIssued.expose(); }

    protected readonly onVcVerified = new LiteEvent<{ verified: boolean, presentationVerified: boolean, vc: VerifiableCredential }>;
    public get vcVerified() { return this.onVcVerified.expose(); }

    protected readonly onPresentationVerified = new LiteEvent<{ verified: boolean, vcs: VerifiableCredential[], thid: string, invitationId: string, rejectMsg?: string, messageId: string }>;
    public get presentationVerified() { return this.onPresentationVerified.expose(); }

    protected readonly onAckCompleted = new LiteEvent<{ role: ActorRole, status: string, messageId: string, thid: string, invitationId?: string }>;
    public get ackCompleted() { return this.onAckCompleted.expose(); }

    protected readonly onProblemReport = new LiteEvent<{ did: DID, code: string, invitationId: string, messageId: string }>;
    public get problemReport() { return this.onProblemReport.expose(); }

    abstract processMessage(message: TProtocolMessage, context?: any, did?: DID): Promise<VCProtocolResponse | void>;
    abstract isProtocolMessage(message: any): Promise<boolean>;

    abstract createInvitationMessage(flow: CredentialFlow, did: DID): Promise<TProtocolMessage>;

    protected agent: Agent;

    constructor() {

    }

    initialize(params: {
        agent: Agent,
    }) {
        this.agent = params.agent;
    }
}

export enum VCMessageType {
    RequestCredential,
}

export interface CredentialRequestedEventArg<TProtocolMessage = any> {
    did: string;
    protocolMessage: TProtocolMessage;
}

export interface VCProtocolResponse {
    to: DID;
    message: any;
}


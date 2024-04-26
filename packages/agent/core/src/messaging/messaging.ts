import { DIDCommMessage, DIDDocumentUtils, VerificationMethodJwk, VerificationMethodTypes } from "@extrimian/did-core";
import { Base, BaseConverter, DIDCommMessagePacking, DIDCommPackedMessage, IDIDCommMessage, IJWK, IKMS, Suite } from "@extrimian/kms-core";
import { AgentIdentity } from "../models/agent-identity";
import { IAgentRegistry } from "../models/agent-registry";
import { IAgentResolver } from "../models/agent-resolver";
import { DID } from "../models/did";
import { AgentTransport  } from "../transport/transport";
import { ITransport, } from "../models/transports/transport";

export class Messaging {
    private kms: IKMS;
    private resolver: IAgentResolver;
    private registry: IAgentRegistry;
    private identity: AgentIdentity;
    private transport: AgentTransport;

    constructor(args: {
        kms: IKMS,
        resolver: IAgentResolver;
        registry: IAgentRegistry;
        identity: AgentIdentity,
        transport: AgentTransport,
    }) {
        this.kms = args.kms;
        this.resolver = args.resolver;
        this.registry = args.registry;
        this.identity = args.identity;
        this.transport = args.transport;
    }

    async packMessage(params: {
        to: DID[] | DID,
        from?: DID,
        message: IDIDCommMessage,
        messageManagerCompatible?: boolean,
    }): Promise<{ packedMessage: DIDCommPackedMessage }> {

        if (!Array.isArray(params.to)) {
            params.to = [params.to];
        }
        const myDID = params.from?.value || this.identity.getDIDs().find(x => params.message.from == x) || this.identity.getOperationalDID().value;

        if (!myDID) {
            throw new Error(`Message from ${params.message?.from} is not a DID managed by this agent. Please check message.from`);
        }

        const myDIDDocument = await this.resolver.resolve(DID.from(myDID));

        const myKeyAgreements = DIDDocumentUtils.getVerificationMethodsByType(myDIDDocument, VerificationMethodTypes.X25519KeyAgreementKey2019) as VerificationMethodJwk[];
        const didCommV2Keys = await this.kms.getPublicKeysBySuiteType(Suite.DIDCommV2);
        const keyToSign = myKeyAgreements.find(x => didCommV2Keys.some(y => y.x == x.publicKeyJwk.x && y.y == x.publicKeyJwk.y));


        const receiptVerificationMethods = await Promise.all(params.to.map(async did => {
            const targetDIDDocument = await this.resolver.resolve(did);
            const targetKeyAgreements = DIDDocumentUtils.getVerificationMethodsByType(targetDIDDocument, VerificationMethodTypes.X25519KeyAgreementKey2019) as VerificationMethodJwk[];
            return targetKeyAgreements;
            // return `${this.getFullVerificationMethodId(targetKeyAgreements[0].id, did)}`;
        }));

        if (params.messageManagerCompatible) {

            const toPublickKeyHex = BaseConverter.convert(receiptVerificationMethods[0][0].publicKeyJwk, Base.JWK, Base.Hex, receiptVerificationMethods[0][0].type);

            const message = await this.kms.packv2(myKeyAgreements[0].publicKeyJwk as IJWK,
                this.getFullVerificationMethodId(myKeyAgreements[0].id, this.identity.getOperationalDID()),
                [toPublickKeyHex],
                params.message, "authcrypt");

            return { packedMessage: JSON.parse(message.message) };
        }

        const result = await this.kms.packDIDCommV2({
            senderVerificationMethodId: this.getFullVerificationMethodId(keyToSign.id, DID.from(myDID)),
            recipientVerificationMethodIds: receiptVerificationMethods.map(vm => `${this.getFullVerificationMethodId(vm[0].id, DID.from(vm[0].controller))}`),
            message: params.message,
            packing: "authcrypt"
        });

        return result;
    }

    async unpackMessage(params: {
        message: DIDCommPackedMessage | string,
    }): Promise<DIDCommMessage> {
        if (typeof params.message === "string") {
            params.message = JSON.parse(params.message) as DIDCommPackedMessage;
        }
        const myKid = params.message.recipients.find(x => this.identity.getDIDs().some(did => did == DID.from(x.header.kid).value));

        if (!myKid) {
            const didDocument = await this.resolver.resolve(this.identity.getOperationalDID());

            const myKeyAgreements = DIDDocumentUtils.getVerificationMethodsByType(didDocument, VerificationMethodTypes.X25519KeyAgreementKey2019) as VerificationMethodJwk[];

            const key = myKeyAgreements[0];

            const packedMessage = await this.kms.unpackv2(key.publicKeyJwk as IJWK, { message: params.message }) as any;

            return packedMessage.message as DIDCommMessage;
            //TODO Arrojar excepción cuando se implemente el Backend Agent y sacar esto.
        }

        const unpackedMessage = await this.kms.unpackvDIDCommV2(DID.from(myKid.header.kid).value, params.message);

        return unpackedMessage.message as any;
    }

    async sendMessage(params: {
        to: DID,
        from?: DID,
        message: any,
        packing?: DIDCommMessagePacking,
        preferredTransport?: ITransport
    }) {
        if (!params.packing) {
            params.packing = "authcrypt"
        }

        if (params.packing != "none") {
            params.message = (await this.packMessage({
                to: params.to,
                from: params.from,
                message: params.message
            })).packedMessage
        }

        await this.transport.sendMessage({
            message: params.message,
            from: params.from,
            to: params.to,
            preferredTransport: params.preferredTransport
        });
    }

    private getFullVerificationMethodId(verificationMethodId: string, did: DID) {
        if (verificationMethodId.indexOf(did.value) > -1) {
            return verificationMethodId;
        }
        return `${did.value}#${verificationMethodId.replace("#", "")}`;
    }
}
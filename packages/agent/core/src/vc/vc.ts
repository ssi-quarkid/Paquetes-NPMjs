import { CredentialDisplay, IssuerData, VerifiableCredentialWithInfo } from "@quarkid/agent/src/vc/protocols/waci-protocol";
import { AssertionMethodPurpose, AuthenticationPurpose, Purpose, VerificationMethodJwk } from "@extrimian/did-core";
import { Base, BaseConverter, IJWK, IKMS, Suite, getTypeBySuite } from "@quarkid/kms-core";
import { VerifiableCredential } from "@extrimian/vc-core";
import { VCSuiteError, VCVerifierService } from "@extrimian/vc-verifier";
import { CredentialManifestStyles, PresentationDefinitionFrame } from "@extrimian/waci";
import { encode, decode } from "base-64";
import { VCProtocolNotFoundError } from "../exceptions/vc-protocol-not-found";
import { Messaging } from "../messaging/messaging";
import { AgentIdentity } from "../models/agent-identity";
import { AgentPublicKey } from "../models/agent-pbk";
import { IAgentResolver } from "../models/agent-resolver";
import { IAgentStorage, IStorage } from "../models/agent-storage";
import { DID } from "../models/did";
import { DWNTransport } from "../models/transports/dwn-transport";
import { ITransport } from "../models/transports/transport";
import { AgentTransport } from "../transport/transport";
import { LiteEvent } from "../utils/lite-event";
import { CredentialFlow } from "./models/credentia-flow";
import { VCCreateKeyRequest } from "./models/vc-create-key-request";
import { ActorRole, VCProtocol } from "./protocols/vc-protocol";
import { IAgentPlugin } from "../plugins/iplugin";
import { IStatusListAgentPlugin } from "../plugins/istatus-list-plugin";

export class VC {
    private transports: AgentTransport;
    private kms: IKMS;
    private resolver: IAgentResolver;
    private identity: AgentIdentity;
    private agentStorage: IAgentStorage;
    private vcStorage: IStorage;
    private vcProtocols: VCProtocol[];

    private readonly onCredentialArrived = new LiteEvent<{ credentials: VerifiableCredentialWithInfo[], issuer: IssuerData, messageId: string }>();
    public get credentialArrived() { return this.onCredentialArrived.expose(); }

    private readonly onCredentialPresented = new LiteEvent<{ vcVerified: boolean, presentationVerified: boolean, vc: VerifiableCredential }>();
    public get credentialPresented() { return this.onCredentialPresented.expose(); }

    protected readonly onPresentationVerified = new LiteEvent<{ verified: boolean, vcs: VerifiableCredential[], thid: string, messageId: string }>;
    public get presentationVerified() { return this.onPresentationVerified.expose(); }

    private readonly onCredentialIssued = new LiteEvent<{ vc: VerifiableCredential, to: DID, invitationId?: string }>();
    public get credentialIssued() { return this.onCredentialIssued.expose(); }

    protected readonly onAckCompleted = new LiteEvent<{ role: ActorRole, status: string, messageId: string, thid: any, invitationId?: string }>;
    public get ackCompleted() { return this.onAckCompleted.expose(); }

    protected readonly onProblemReport = new LiteEvent<{ did: DID, code: string, invitationId: string, messageId: string }>;
    public get problemReport() { return this.onProblemReport.expose(); };

    protected readonly onBeforeSigningVC = new LiteEvent<{ vc: VerifiableCredential, issuerDID: DID }>;
    public get beforeSigningVC() { return this.onBeforeSigningVC.expose(); };

    protected credentialStatusPlugins = new Array<IStatusListAgentPlugin>();

    constructor(opts: {
        transports: AgentTransport,
        vcProtocols: VCProtocol[],
        kms: IKMS,
        resolver: IAgentResolver,
        identity: AgentIdentity,
        agentStorage: IStorage,
        vcStorage: IStorage
        messaging: Messaging,
    }) {
        this.transports = opts.transports;
        this.kms = opts.kms;
        this.resolver = opts.resolver;
        this.identity = opts.identity;
        this.agentStorage = opts.agentStorage;
        this.vcProtocols = opts.vcProtocols;

        this.vcProtocols.forEach((protocol) => {
            protocol.vcArrived.on((data) => {
                this.onCredentialArrived.trigger(data);
            });

            protocol.vcVerified.on((data) => this.onCredentialPresented.trigger({
                vcVerified: data.verified,
                presentationVerified: data.presentationVerified,
                vc: data.vc,
            }));

            protocol.presentationVerified.on((data) => this.onPresentationVerified.trigger({
                messageId: data.messageId,
                thid: data.thid,
                vcs: data.vcs,
                verified: data.verified
            }));

            protocol.credentialIssued.on((data) => this.onCredentialIssued.trigger({
                to: data.toDID,
                vc: data.vc,
                invitationId: data.invitationId
            }));

            protocol.ackCompleted.on(data => { this.onAckCompleted.trigger(data) });
            protocol.problemReport.on(data => this.onProblemReport.trigger(data));
        })

        this.vcStorage = opts.vcStorage;
    }

    addCredentialStatusStrategy(credentialStatusStrategy: IStatusListAgentPlugin) {
        this.credentialStatusPlugins.push(credentialStatusStrategy);
    }

    async saveCredential(vc: VerifiableCredential) {
        await this.vcStorage.add(vc.id, vc);
    }

    async saveCredentialWithInfo(vc: VerifiableCredential, params?: {
        styles: CredentialManifestStyles
        display: CredentialDisplay
    }) {
        await this.vcStorage.add(vc.id, { data: vc, styles: params.styles, display: params.display });
    }

    async removeCredential(id: string) {
        await this.vcStorage.remove(id);
    }

    async getVerifiableCredentials(): Promise<VerifiableCredential[]> {
        return Array.from((await this.vcStorage.getAll()).values());
    }

    async getVerifiableCredentialsWithInfo(): Promise<{ data: VerifiableCredential, styles: CredentialManifestStyles, display: CredentialDisplay }[]> {
        return Array.from((await this.vcStorage.getAll()).values());
    }

    async getVerifiableCredentialsByType(types: string[]): Promise<VerifiableCredential[]> {
        return (await this.getVerifiableCredentials()).filter(x => !x.type.some(y => types.some(z => z != y)));
    }

    async createKey(params: VCCreateKeyRequest): Promise<AgentPublicKey> {
        const publicKey = await this.kms.create(Suite.Bbsbls2020);

        const agentPbk = new AgentPublicKey({
            name: params.name,
            description: params.description,
            publicKeyJWK: publicKey.publicKeyJWK,
        });

        this.agentStorage.add(
            BaseConverter.convert(publicKey.publicKeyJWK, Base.JWK, Base.Hex),
            agentPbk);

        return agentPbk;
    }

    async getKeys(): Promise<AgentPublicKey[]> {
        const bbsblsKeys = await this.kms.getPublicKeysBySuiteType(Suite.Bbsbls2020);

        const keys = new Array<AgentPublicKey>();

        for (let key in bbsblsKeys) {
            const apbk = new AgentPublicKey(await this.agentStorage.get<AgentPublicKey>
                (BaseConverter.convert(bbsblsKeys[key], Base.JWK, Base.Hex)))
            keys.push(apbk);
        }

        return keys;
    }

    async getKey(jwk: IJWK): Promise<AgentPublicKey> {
        const bbsblsKeys = await this.getKeys();

        const searchedKey = bbsblsKeys.find(key => key.publicKeyJWK.crv == jwk.crv &&
            key.publicKeyJWK.kty == jwk.kty &&
            key.publicKeyJWK.x == jwk.x &&
            key.publicKeyJWK.y == jwk.y);

        if (!searchedKey) throw new Error(`Key ${JSON.stringify(jwk)} not found in KMS`);

        return searchedKey;
    }

    async signVC<VCType = any>(opts: {
        credential: VerifiableCredential,
        publicKey?: IJWK,
        purpose?: Purpose,
        did?: DID,
    }): Promise<VerifiableCredential<VCType>> {

        let publicKeys: IJWK[];

        if (!opts.publicKey) {
            const bbsblsKeys = await this.kms.getPublicKeysBySuiteType(Suite.Bbsbls2020);

            if (bbsblsKeys.length == 0) {
                throw new Error("KMS doesn't contains keys for bbsbls2020. You need to create this kind of keys to sign verifiable credentials")
            }

            publicKeys = bbsblsKeys;
        } else {
            publicKeys = [opts.publicKey];
        }

        const didDocument = await this.resolver.resolve(opts.did || this.identity.getOperationalDID());

        const validPublicKeys = didDocument.verificationMethod.filter(x => x.type == "Bls12381G1Key2020") as VerificationMethodJwk[];

        //Comienzo a comparar las claves que estan en el DID Document con las que tiene el KMS hasta encontrar un match
        const firstValidPbk = validPublicKeys.find(didDocKey =>
            publicKeys.some(kmsKey =>
                didDocKey.publicKeyJwk.x == kmsKey.x &&
                didDocKey.publicKeyJwk.y == kmsKey.y));

        // Si el DID Document no contiene la clave, el agente no debería firmar ya que hay un error.
        if (!firstValidPbk) {
            throw Error("There aren't public keys valid to use based on Issuer DID Document and KMS secrets");
        }

        this.onBeforeSigningVC.trigger({ vc: opts.credential, issuerDID: opts.did });

        for (let csPlugin of this.credentialStatusPlugins) {
            if (await csPlugin.canHandle({ vc: opts.credential, issuerDID: opts.did })) {
                await csPlugin.handle({ vc: opts.credential, issuerDID: opts.did });
                break;
            }
        }

        // Si contiene la clave, se procede a la firma
        const vc = await this.kms.signVC(Suite.Bbsbls2020,
            firstValidPbk.publicKeyJwk as IJWK,
            opts.credential,
            (opts.did || this.identity.getOperationalDID()).value,
            (opts.did || this.identity.getOperationalDID()).value + firstValidPbk.id,
            opts.purpose || new AssertionMethodPurpose());

        return vc as VerifiableCredential;
    }

    async signPresentation(params: {
        contentToSign: string,
        challenge: string,
        domain: string,
        publicKey?: IJWK,
        purpose?: Purpose,
        did?: DID,
    }) {
        const verificationMethod = await this.getValidVerificationMethodSigner({
            suiteType: Suite.RsaSignature2018,
            publicKey: params.publicKey,
            did: params.did || this.identity.getOperationalDID()
        });

        const signature = await this.kms.signVCPresentation({
            did: (params.did || this.identity.getOperationalDID()).value,
            presentationObject: params.contentToSign,
            publicKeyJWK: verificationMethod.publicKeyJwk as IJWK,
            purpose: params.purpose || new AuthenticationPurpose({ challenge: params.challenge }),
            verificationMethodId: (params.did || this.identity.getOperationalDID()).value + verificationMethod.id
        });

        return signature;
    }

    async sendVC(params: {
        vc: VerifiableCredential
        to: DID,
        preferredTransportClassRef?: new (params: any) => ITransport,
    }): Promise<void> {
        if (params.preferredTransportClassRef) {
            params.preferredTransportClassRef = DWNTransport;
        }

        await this.transports.sendMessage({
            to: params.to,
            message: JSON.stringify(params.vc),
        });
    }

    async verifyVC(params: {
        vc: VerifiableCredential,
        purpose?: Purpose,
    }) {
        const vcService = new VCVerifierService({
            didDocumentResolver: (did: string) => this.resolver.resolve(DID.from(did)),
        });
        const result = await vcService.verify(params.vc, params.purpose || new AssertionMethodPurpose());
        return result;
    }

    async verifyPresentation(params: {
        presentation: any,
        challenge: string,
    }): Promise<{
        result: boolean;
        error?: VCSuiteError;
    }>;

    async verifyPresentation(params: {
        presentation: any,
        purpose: Purpose,
    }): Promise<{
        result: boolean;
        error?: VCSuiteError;
    }>;

    async verifyPresentation(params: {
        presentation: any,
        purpose?: Purpose,
        challenge?: string,
    }): Promise<{
        result: boolean;
        error?: VCSuiteError;
    }> {
        if (!params.challenge && !params.purpose) {
            throw new Error("Challenge or purpose are required for verifyPresentation");
        }

        const vcService = new VCVerifierService({
            didDocumentResolver: (did: string) => this.resolver.resolve(DID.from(did)),
        });
        const result = await vcService.verify(params.presentation,
            params.purpose || new AuthenticationPurpose({ challenge: params.challenge }));
        return result;
    }

    async createInvitationMessage(args: {
        path?: string
        flow: CredentialFlow,
        did?: DID
    }, outParam?: { invitationId: string }) {
        if (!args.path) args.path = "didcomm";

        const oobMessage = await this.vcProtocols[0].createInvitationMessage(args.flow,
            args.did || this.identity.getOperationalDID())

        const oob = encode(JSON.stringify(oobMessage));

        if (outParam) outParam.invitationId = oobMessage.id;

        return `${args.path}://?_oob=${oob}`;
    }

    async processMessage(params: {
        message: any,
        did?: DID,
        transport?: ITransport
        contextMessage?: any,
    }) {

        const promises = this.vcProtocols.map(async (x) => await x.isProtocolMessage(params.message));
        const results = await Promise.all(promises);
        const vcProtocol = this.vcProtocols[results.indexOf(true)];
        if (!vcProtocol) {
            throw new VCProtocolNotFoundError();
        }

        const response = await vcProtocol.processMessage(params.message, params.contextMessage, params.did);

        if (!params.did) {
            if (typeof params.message === "string") {
                const oobMessage = params.message.substring(params.message.indexOf("_oob=") + 5)
                const decodedMessage = JSON.parse(decode(oobMessage));
                params.did = decodedMessage.to ? DID.from(decodedMessage.to) : this.identity.getOperationalDID();
            } else {
                if (!params.message.to || params.message.to.length == 0) {
                    params.did = this.identity.getOperationalDID();
                } else {
                    const did = this.identity.getDIDs().find(x => params.message.to.some(y => y == x));
                    params.did = did ? DID.from(did) : null;
                }
            }
        }

        if (response) {
            await this.transports.sendMessage({
                message: response.message,
                to: response.to,
                from: params.did,
                messageContext: params.contextMessage,
                preferredTransport: params.transport
            });
        }
    }

    private async getValidVerificationMethodSigner(params: {
        suiteType: Suite,
        publicKey?: IJWK,
        did: DID,
    }): Promise<VerificationMethodJwk> {
        let publicKeys: IJWK[];

        if (!params.publicKey) {
            const bbsblsKeys = await this.kms.getPublicKeysBySuiteType(params.suiteType);

            if (bbsblsKeys.length == 0) {
                throw new Error("KMS doesn't contains keys for bbsbls2020. You need to create this kind of keys to sign verifiable credentials")
            }

            publicKeys = bbsblsKeys;
        } else {
            publicKeys = [params.publicKey];
        }

        const didDocument = await this.resolver.resolve(params.did);

        const validPublicKeys = didDocument.verificationMethod.filter(x => x.type == getTypeBySuite(params.suiteType)) as VerificationMethodJwk[];

        //Comienzo a comparar las claves que estan en el DID Document con las que tiene el KMS hasta encontrar un match
        const firstValidPbk = validPublicKeys.find(didDocKey => {
            const jKey = JSON.stringify(didDocKey.publicKeyJwk);
            return publicKeys.some(kmsKey =>
                JSON.stringify(kmsKey) === jKey);
        });


        // Si el DID Document no contiene la clave, el agente no debería firmar ya que hay un error.
        if (!firstValidPbk) {
            throw Error("There aren't public keys valid to use based on Issuer DID Document and KMS secrets");
        }

        return firstValidPbk;
    }

    async deriveVC(params: { vc: VerifiableCredential, deriveProofFrame: PresentationDefinitionFrame }) {
        if (!params.vc) throw new Error("params.vc is required for deriveVC");
        if (!params.deriveProofFrame) throw new Error("params.deriveProofFrame is required for deriveVC");

        const derivedVc = this.kms.deriveVC({
            frame: params.deriveProofFrame,
            vc: params.vc
        });

        return derivedVc;
    }
}
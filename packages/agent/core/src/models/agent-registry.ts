import { IJWK, IKMS, Suite } from "@quarkid/kms-core";
import { Did, ModenaUniversalRegistry } from "@quarkid/did-registry";
import { Purpose, Service } from "@quarkid/did-core";
import { ISigner, ModenaSdkConfig } from "@quarkid/modena-sdk";
import { AgentModenaUniversalResolver } from "./agent-resolver";
import { DIDUniversalResolver } from "@quarkid/did-resolver";
import { DID } from "./did";
import { DIDDocumentMetadata } from "@quarkid/modena-sdk";

export abstract class IAgentRegistry {
    protected kms: IKMS;

    initialize(params: {
        kms: IKMS
    }) {
        this.kms = params.kms;
    }

    abstract createDID(createRequest: CreateDIDRequest): Promise<CreateDIDResponse>;
    abstract updateDIDDocument(updateRequest: UpdateDIDRequest): Promise<void>;
}

export abstract class IAgentSidetreeRegistry extends IAgentRegistry {
    protected kms: IKMS;

    initialize(params: {
        kms: IKMS
    }) {
        this.kms = params.kms;
    }

    abstract createDID(createRequest: CreateDIDRequest): Promise<CreateDIDSidetreeResponse>;
}


export interface CreateDIDRequest {
    didMethod?: string;
    updateKeys: IJWK[];
    recoveryKeys: IJWK[];
    verificationMethods: {
        id: string;
        type: string;
        publicKeyJwk: IJWK;
        purpose: Purpose[];
    }[];
    services?: Service[];
}

export interface UpdateDIDRequest {
    did: DID,
    updatePublicKey: IJWK,
    kms: IKMS,
    newUpdateKeys: IJWK[],
    documentMetadata: DIDDocumentMetadata,
    updateKeysToRemove?: {
        publicKeys?: IJWK[];
        updateCommitment?: string[];
    },
    verificationMethodsToAdd?: {
        id: string;
        type: string;
        publicKeyJwk: IJWK;
        purpose: Purpose[];
    }[];
    idsOfVerificationMethodsToRemove?: string[];
    servicesToAdd?: ServiceDefinition[],
    idsOfServiceToRemove?: string[],
}

export interface CreateDIDResponse {
    did: string;
}

export interface CreateDIDSidetreeResponse extends CreateDIDResponse {
    longDid: string;
}

export interface KeyDefinition {
    id: string,
    vmKey: VMKey,
}

export enum VMKey {
    ES256k,
    DIDComm,
    VC,
    RSA,
}

export interface ServiceDefinition {
    id: string;
    type: string;
    serviceEndpoint: string | string[] | Record<string, string | string[]>
}

export class AgentModenaUniversalRegistry extends IAgentSidetreeRegistry {
    _defaultDidMethod: string;
    didService: ModenaUniversalRegistry;

    constructor(private modenaEndpointURL: string, defaultDidMethod?: string) {
        super();
        this.didService = new ModenaUniversalRegistry();

        ModenaSdkConfig.maxCanonicalizedDeltaSizeInBytes = 2000;
        this._defaultDidMethod = defaultDidMethod;
    }

    setDefaultDIDMethod(didMethod: string) {
        this._defaultDidMethod = didMethod;
    }

    async getSupportedDidMethods(): Promise<string[]> {
        return await this.didService.getSupportedDidMethods(this.modenaEndpointURL);
    }

    async createDID(createRequest: CreateDIDRequest): Promise<CreateDIDSidetreeResponse> {
        const defaultDidMethod = createRequest.didMethod || this._defaultDidMethod || (await (this.getSupportedDidMethods())[0])

        const didService = new ModenaUniversalRegistry();

        const createDIDResponse = await didService.createDID({
            updateKeys: createRequest.updateKeys,
            recoveryKeys: createRequest.recoveryKeys,
            verificationMethods: createRequest.verificationMethods,
            services: createRequest.services?.length > 0 ? createRequest.services : undefined,
        });

        const publishResult = await didService.publishDID({
            didMethod: defaultDidMethod,
            universalResolverURL: this.modenaEndpointURL,
            createDIDResponse: createDIDResponse,
        });

        return {
            did: publishResult.did,
            longDid: publishResult.longDid,
        }
    }

    async updateDIDDocument(request: UpdateDIDRequest) {
        return await this.didService.updateDID({
            didSuffix: request.did.getDIDSuffix(),
            newUpdateKeys: request.newUpdateKeys,
            updateApiUrl: this.modenaEndpointURL,
            updateKeysToRemove: request.updateKeysToRemove,
            documentMetadata: request.documentMetadata,
            updatePublicKey: request.updatePublicKey,
            idsOfServiceToRemove: request.idsOfServiceToRemove,
            servicesToAdd: request.servicesToAdd,
            verificationMethodsToAdd: request.verificationMethodsToAdd,
            idsOfVerificationMethodsToRemove: request.idsOfVerificationMethodsToRemove,
            signer: async (content: any): Promise<string> => {
                return await request.kms.sign(Suite.ES256k, request.updatePublicKey, content);
            },
        });
    }
}

export class AgentModenaRegistry extends IAgentSidetreeRegistry {
    didService = new Did();

    constructor(private modenaEndpointURL: string, private didMethod?: string) {
        super();
    }

    async createDID(createRequest: CreateDIDRequest): Promise<CreateDIDSidetreeResponse> {
        ModenaSdkConfig.maxCanonicalizedDeltaSizeInBytes = 2000;

        const createDIDResponse = await this.didService.createDID({
            updateKeys: createRequest.updateKeys,
            recoveryKeys: createRequest.recoveryKeys,
            verificationMethods: createRequest.verificationMethods,
            didMethod: this.didMethod,
            services: createRequest.services?.length > 0 ? createRequest.services : undefined,
        });

        const publishResult = await this.didService.publishDID({
            modenaApiURL: this.modenaEndpointURL,
            createDIDResponse: createDIDResponse,
        });

        return {
            did: publishResult.did,
            longDid: createDIDResponse.longDid,
        }
    }

    async updateDIDDocument(request: UpdateDIDRequest) {
        return await this.didService.updateDID({
            didSuffix: request.did.getDIDSuffix(),
            newUpdateKeys: request.newUpdateKeys,
            updateApiUrl: this.modenaEndpointURL,
            updateKeysToRemove: request.updateKeysToRemove,
            documentMetadata: request.documentMetadata,
            updatePublicKey: request.updatePublicKey,
            idsOfServiceToRemove: request.idsOfServiceToRemove,
            servicesToAdd: request.servicesToAdd,
            verificationMethodsToAdd: request.verificationMethodsToAdd,
            idsOfVerificationMethodsToRemove: request.idsOfVerificationMethodsToRemove,
            signer: async (content: any): Promise<string> => {
                return await request.kms.sign(Suite.ES256k, request.updatePublicKey, content);
            },
        });
    }
}
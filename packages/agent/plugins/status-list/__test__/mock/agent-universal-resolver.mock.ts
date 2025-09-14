import { CreateDIDRequest, CreateDIDResponse, DID, IAgentRegistry, IAgentResolver, UpdateDIDRequest } from "@quarkid/agent";
import { DIDDocument } from "@quarkid/did-core";
import { ModenaResponse } from "@quarkid/did-resolver";
import { IKMS } from "@quarkid/kms-core";

export class AgentUniversalResolverMock implements IAgentResolver {

    resolve(did: DID): Promise<DIDDocument> {
        throw new Error("Method not implemented.");
    }

    resolveWithMetdata(did: DID): Promise<ModenaResponse> {
        throw new Error("Method not implemented.");
    }
}

export class AgentUniversalRegistryMock extends IAgentRegistry {

    protected kms: IKMS;

    initialize(params: { kms: IKMS; }): void {
        throw new Error("Method not implemented.");
    }

    createDID(createRequest: CreateDIDRequest): Promise<CreateDIDResponse> {
        throw new Error("Method not implemented.");
    }
    
    updateDIDDocument(updateRequest: UpdateDIDRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
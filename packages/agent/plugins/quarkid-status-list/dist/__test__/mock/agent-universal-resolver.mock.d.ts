import { CreateDIDRequest, CreateDIDResponse, DID, IAgentRegistry, IAgentResolver, UpdateDIDRequest } from "@quarkid/agent";
import { DIDDocument } from "@quarkid/did-core";
import { ModenaResponse } from "@quarkid/did-resolver";
import { IKMS } from "@quarkid/kms-core";
export declare class AgentUniversalResolverMock implements IAgentResolver {
    resolve(did: DID): Promise<DIDDocument>;
    resolveWithMetdata(did: DID): Promise<ModenaResponse>;
}
export declare class AgentUniversalRegistryMock extends IAgentRegistry {
    protected kms: IKMS;
    initialize(params: {
        kms: IKMS;
    }): void;
    createDID(createRequest: CreateDIDRequest): Promise<CreateDIDResponse>;
    updateDIDDocument(updateRequest: UpdateDIDRequest): Promise<void>;
}

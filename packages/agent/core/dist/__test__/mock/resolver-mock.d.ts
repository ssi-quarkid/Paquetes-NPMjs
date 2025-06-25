import { DIDDocument } from "@extrimian/did-core";
import { ModenaResponse } from "@extrimian/did-resolver";
import { DID, IAgentResolver } from "../../src";
export declare class ResolverMock implements IAgentResolver {
    resolve(did: DID): Promise<DIDDocument>;
    resolveWithMetdata(did: DID): Promise<ModenaResponse>;
}

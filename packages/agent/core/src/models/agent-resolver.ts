import { DIDDocument } from "@extrimian/did-core";
import { DIDModenaResolver, DIDUniversalResolver, ModenaResponse } from "@extrimian/did-resolver"
import { DID } from "./did";

export interface IAgentResolver {
    resolve(did: DID): Promise<DIDDocument>;
    resolveWithMetdata(did: DID): Promise<ModenaResponse>;
}

export class AgentModenaUniversalResolver implements IAgentResolver {
    universalResolver: DIDUniversalResolver;

    constructor(resolverURL: string) {
        this.universalResolver = new DIDUniversalResolver({
            universalResolverURL: resolverURL,
        });
    }

    async resolve(did: DID): Promise<DIDDocument> {
        return await this.universalResolver.resolveDID(did.value);
    }

    async resolveWithMetdata(did: DID): Promise<ModenaResponse> {
        return await this.universalResolver.resolveDIDWithMetadata(did.value);
    }
}

export class AgentModenaResolver implements IAgentResolver {
    modenaResolver: DIDModenaResolver;

    constructor(resolverURL: string) {
        this.modenaResolver = new DIDModenaResolver({
            modenaURL: resolverURL,
        });
    }

    async resolve(did: DID): Promise<DIDDocument> {
        const didDocumentResult = await this.modenaResolver.resolveDID(did.getDIDSuffix());
        return didDocumentResult;
    }

    async resolveWithMetdata(did: DID): Promise<ModenaResponse> {
        return await this.modenaResolver.resolveDIDWithMetadata(did.value);
    }

}
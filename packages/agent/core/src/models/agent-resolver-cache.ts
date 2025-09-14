import { DIDDocument } from "@quarkid/did-core";
import { DIDModenaResolver, DIDUniversalResolver, ModenaResponse } from "@quarkid/did-resolver"
import { DID } from "./did";
const LRU = require('lru-cache');
import { IAgentResolver } from "./agent-resolver";

export class AgentModenaUniversalResolverCached implements IAgentResolver {
    universalResolver: DIDUniversalResolver;
    cache: any;

    constructor(resolverURL: string, cacheOptions?: {
        maxItems?: number,
        durationInSeconds?: number
    }) {
        this.universalResolver = new DIDUniversalResolver({
            universalResolverURL: resolverURL,
        });

        this.cache = new LRU({
            max: cacheOptions?.maxItems || 10000, // Máximo número de items en la cache
            ttl: 1000 * (cacheOptions?.durationInSeconds || 30)
        });
    }

    async resolve(did: DID): Promise<DIDDocument> {
        return (await this.resolveWithMetdata(did)).didDocument;
    }

    async resolveWithMetdata(did: DID): Promise<ModenaResponse> {
        if (this.cache.has(did.value)) {
            return this.cache.get(did.value);
        }
        const didDocWithMetadata = await this.universalResolver.resolveDIDWithMetadata(did.value);
        this.cache.set(did.value, didDocWithMetadata);
        return didDocWithMetadata;
    }
}

export class AgentModenaResolverCached implements IAgentResolver {
    cache: any;
    modenaResolver: DIDModenaResolver;

    constructor(resolverURL: string) {
        this.modenaResolver = new DIDModenaResolver({
            modenaURL: resolverURL,
        });
    }

    async resolve(did: DID): Promise<DIDDocument> {
        return (await this.resolveWithMetdata(did)).didDocument;
    }

    async resolveWithMetdata(did: DID): Promise<ModenaResponse> {
        if (this.cache.has(did.value)) {
            return this.cache.get(did.value);
        }
        const didDocWithMetadata = await this.modenaResolver.resolveDIDWithMetadata(did.getDidMethod());
        this.cache.set(did.value, didDocWithMetadata);
        return didDocWithMetadata;
    }

}
import { IJWK } from "@quarkid/kms-core";
export declare class AgentPublicKey {
    name: string;
    description: string;
    publicKeyJWK: IJWK;
    constructor(params: {
        name: string;
        description: string;
        publicKeyJWK: IJWK;
    });
}

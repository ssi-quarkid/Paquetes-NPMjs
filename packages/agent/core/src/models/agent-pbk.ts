import { IJWK } from "@quarkid/kms-core";

export class AgentPublicKey {
    name: string;
    description: string;
    publicKeyJWK: IJWK;

    constructor(params: {
        name: string,
        description: string,
        publicKeyJWK: IJWK
    }) {
        this.name = params.name;
        this.description = params.description;
        this.publicKeyJWK = params.publicKeyJWK;
    }
}
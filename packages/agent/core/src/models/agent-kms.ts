import { DIDDocumentUtils, VerificationMethod, VerificationMethodJwk, VerificationMethodTypes } from "@quarkid/did-core";
import { IJWK, IKMS, Suite } from "@quarkid/kms-core";
import { AgentIdentity } from "./agent-identity";
import { IAgentResolver } from "./agent-resolver";
import { DID } from "./did";

export class AgentKMS {
    private kms: IKMS;
    private resolver: IAgentResolver;
    private identity: AgentIdentity;

    constructor(opts: {
        kms: IKMS,
        resolver: IAgentResolver,
        identity: AgentIdentity,
    }) {
        this.kms = opts.kms;
        this.resolver = opts.resolver;
        this.identity = opts.identity;
    }

    async signMessage(params: {
        content: string,
        publicKey?: IJWK,
    }) {
        const did = this.identity.getOperationalDID();
        const didDoc = await this.resolver.resolve(did);

        const vms = DIDDocumentUtils.getVerificationMethodsByType(didDoc, VerificationMethodTypes.EcdsaSecp256k1VerificationKey2019) as VerificationMethodJwk[];
        let vm: VerificationMethodJwk = null;

        if (!params.publicKey) {
            params.publicKey = (await this.kms.getAllPublicKeys()).find(x => vms.some(y =>
                x.x == y.publicKeyJwk.x &&
                x.y == y.publicKeyJwk.y
            ));
        }

        if (!params.publicKey) {
            throw new Error(`Cannot find a valid key of type 'Ed25519VerificationKey2018' to use to signJWS for did ${did}`);
        }

        vm = vms.find(y =>
            y.publicKeyJwk.x == params.publicKey.x &&
            y.publicKeyJwk.y == params.publicKey.y
        );

        if (!vm) {
            throw new Error(`Provided publicKey not found in did document: DID -> ${did} | pbk: ${JSON.stringify(params.publicKey)}`);
        }

        const result = await this.kms.sign(Suite.ES256k, params.publicKey, params.content);

        return {
            signature: result,
            publicKey: params.publicKey,
            verificationMethodId: vm.id.indexOf(did.value) > -1 ? vm.id : did.value + vm.id
        };
    }

    async verifyMessage(params: {
        content: string,
        publicKey: IJWK,
        signature: string,
    } | {
        content: string,
        verificationMethodId: string,
        signature: string,
    }): Promise<{ verified: true } | { verified: false, result: VerifiyJWSResult, signedContent: string, error?: any }> {
        try {
            let pbk: IJWK = null;

            if ('verificationMethodId' in params) {
                const did = DID.from(params.verificationMethodId);

                const didDoc = await this.resolver.resolve(did);

                const vm = DIDDocumentUtils.getVerificationMethodById(didDoc, params.verificationMethodId) as VerificationMethodJwk;

                if (!vm) throw new Error(`Verification Method id not found in DID Document: ${params.verificationMethodId}`);

                pbk = vm.publicKeyJwk as any;
            }

            if ('publicKey' in params) {
                pbk = params.publicKey;
            }

            const result = await this.kms.verifySignature(pbk, params.content, params.signature);

            if (result) { return { verified: true } };

            return {
                verified: false,
                signedContent: null,
                result: VerifiyJWSResult.InvalidSignature
            }
        } catch (ex) {
            return {
                verified: false,
                signedContent: null,
                result: VerifiyJWSResult.UnexpectedError,
                error: ex,
            }
        }
    }
}

export enum VerifiyJWSResult {
    InvalidContent = "invalid-content",
    UnexpectedError = "invalid-content",
    InvalidSignature = "invalid-signature",
}
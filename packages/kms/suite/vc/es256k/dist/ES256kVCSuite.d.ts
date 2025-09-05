import { IVCSuite, IVCJsonLDKeyPair } from '@quarkid/kms-core';
import { Purpose } from '@quarkid/did-core';
interface VerifiableCredential {
    '@context'?: string | string[];
    id?: string;
    type?: string | string[];
    issuer?: string;
    issuanceDate?: string;
    expirationDate?: string;
    credentialSubject?: any;
    proof?: any;
    [key: string]: any;
}
export declare class ES256kVCSuite implements IVCSuite {
    private keyPair?;
    private static kmsInstance;
    constructor();
    /**
     * Set the KMS instance to be used for key creation
     */
    static setKMS(kms: any): void;
    /**
     * Create a new key pair using the KMS
     * This method is expected by the agent's KMSClient
     */
    create(): Promise<IVCJsonLDKeyPair>;
    /**
     * Load the suite with a key pair
     */
    loadSuite(params: {
        secrets: IVCJsonLDKeyPair;
        useCache: boolean;
    }): void;
    /**
     * Sign a verifiable credential
     */
    sign(documentToSign: any, did: string, verificationMethodId: string, purpose: Purpose): Promise<VerifiableCredential>;
}
export {};
//# sourceMappingURL=ES256kVCSuite.d.ts.map
export enum VerificationMethodTypes {
    Ed25519VerificationKey2018 = "Ed25519VerificationKey2018",
    EcdsaSecp256k1VerificationKey2019 = "EcdsaSecp256k1VerificationKey2019",
    X25519KeyAgreementKey2019 = "X25519KeyAgreementKey2019",
    JsonWebKey2020 = "JsonWebKey2020",
    GpgVerificationKey2020 = "GpgVerificationKey2020",
    Bls12381G1Key2020 = "Bls12381G1Key2020",
    RsaVerificationKey2018 = "RsaVerificationKey2018"
}

export class VerificationMethodHelper {
    static getVMValue(vm: VerificationMethod) {
        if ((<VerificationMethodPublicKey58>vm).publicKeyBase58 != null) {
            return (<VerificationMethodPublicKey58>vm).publicKeyBase58;
        }
        else if ((<VerificationMethodPublicKeyHex>vm).publicKeyHex != null) {
            return (<VerificationMethodPublicKeyHex>vm).publicKeyHex;
        }
        else if ((<VerificationMethodGpg>vm).publicKeyGpg != null) {
            return (<VerificationMethodGpg>vm).publicKeyGpg;
        }
    }
}

export interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
}

export interface VerificationMethodPublicKeyPem extends VerificationMethod {
    type: VerificationMethodTypes.RsaVerificationKey2018;
    publicKeyPem: string;
}

export interface VerificationMethodPublicKeyHex extends VerificationMethod {
    type: VerificationMethodTypes.Ed25519VerificationKey2018 | VerificationMethodTypes.Bls12381G1Key2020 | VerificationMethodTypes.EcdsaSecp256k1VerificationKey2019;
    publicKeyHex: string;
}

export interface VerificationMethodPublicKey58 extends VerificationMethod {
    type: VerificationMethodTypes.Ed25519VerificationKey2018 | VerificationMethodTypes.Bls12381G1Key2020 | VerificationMethodTypes.EcdsaSecp256k1VerificationKey2019;
    publicKeyBase58: string;
}

export interface VerificationMethodGpg extends VerificationMethod {
    type: VerificationMethodTypes.GpgVerificationKey2020;
    publicKeyGpg: string;
}

export interface VerificationMethodJwk extends VerificationMethod {
    type: VerificationMethodTypes;

    publicKeyJwk: {
        crv: string;
        x?: string;
        y?: string;
        kty: string;
        kid?: string;
        n?: string;
        e?: string;
        d?: string;
        p?: string;
        q?: string;
        dp?: string;
        dq?: string;
        qi?: string;
    };
}
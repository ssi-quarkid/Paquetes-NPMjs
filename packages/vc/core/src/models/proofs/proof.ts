import { Purpose } from "@quarkid/did-core";

export interface Proof {
    type: string;
    created: string;
    proofPurpose: Purpose;
    verificationMethod: string;
    jws?: string; // ES256k signature in DER format (hex)
}
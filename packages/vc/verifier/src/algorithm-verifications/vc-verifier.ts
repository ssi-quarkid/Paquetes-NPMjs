import { DIDDocument, Purpose } from "@quarkid/did-core";
import { VerifiableCredential } from "@quarkid/vc-core";

export interface VCVerifier {
    verify(signedData: VerifiableCredential, purpose: Purpose, didDocumentResolver: (did: string) => Promise<DIDDocument>): Promise<{ result: boolean, errors?: string[] }>;
}
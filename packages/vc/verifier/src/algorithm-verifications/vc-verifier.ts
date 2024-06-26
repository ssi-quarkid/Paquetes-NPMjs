import { DIDDocument, Purpose } from "@extrimian/did-core";
import { VerifiableCredential } from "@extrimian/vc-core";

export interface VCVerifier {
    verify(signedData: VerifiableCredential, purpose: Purpose, didDocumentResolver: (did: string) => Promise<DIDDocument>): Promise<{ result: boolean, errors?: string[] }>;
}
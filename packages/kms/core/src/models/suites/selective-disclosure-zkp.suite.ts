import { DIDDocument } from "@quarkid/did-core";
import { VerifiableCredential } from "@quarkid/vc-core";
import { IVCSuite } from "./vc.suite";

export interface SelectiveDisclosureZKPSuite extends IVCSuite {
    deriveVC(signedDocument: VerifiableCredential, deriveProofFrame: string, didDocumentResolver: (did: string) => Promise<DIDDocument>): Promise<VerifiableCredential>;
}
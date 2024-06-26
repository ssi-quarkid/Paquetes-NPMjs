import { DIDDocument } from "@extrimian/did-core";
import { VerifiableCredential } from "@extrimian/vc-core";
import { IVCSuite } from "./vc.suite";

export interface SelectiveDisclosureZKPSuite extends IVCSuite {
    deriveVC(signedDocument: VerifiableCredential, deriveProofFrame: string, didDocumentResolver: (did: string) => Promise<DIDDocument>): Promise<VerifiableCredential>;
}
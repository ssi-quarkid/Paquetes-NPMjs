import { DIDDocument } from "@quarkid/did-core";

export class DIDDocumentMetadata {
    method: {
        published: boolean,
        recoveryCommitment: string[],
        updateCommitment: string[]
    };
    versionId: number;
    canonicalId: string;
}
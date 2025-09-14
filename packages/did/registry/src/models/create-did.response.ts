import { IJWK } from "@quarkid/kms-core";
import { ModenaDocumentModel } from "@quarkid/modena-sdk";

export interface CreateDIDResponse {
    recoveryKeys: IJWK[];
    updateKeys: IJWK[];
    document: ModenaDocumentModel;
    longDid: string;
    didUniqueSuffix: string;
}
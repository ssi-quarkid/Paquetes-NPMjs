import { VerifiableCredential } from "@quarkid/vc-core";
import { DID } from "./did";

export interface IVCStorage {
    getAllByDID(did: DID);
    save(did: DID, vc: VerifiableCredential);
    getById(credentialId: string);
    remove(did: DID, credentialId: string);
}
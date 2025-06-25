import { CredentialStatus } from "@quarkid/vc-core";
export declare class QuarkIDCredentialStatus extends CredentialStatus {
    type: QuarkIDCredentialStatusType | any;
    persistanceType: PersistanceType;
    bitArrayIndex: number;
    bitArraySC: string;
    bitArrayID: number | string;
}
export declare enum PersistanceType {
    IPFS = "IPFS"
}
export declare enum QuarkIDCredentialStatusType {
    BitArrayStatusEntry = "bitArrayStatusEntry",
    RevocationList2020Status = "RevocationList2020Status",
    CredentialStatusList2017 = "CredentialStatusList2017"
}

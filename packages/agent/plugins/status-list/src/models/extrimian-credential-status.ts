import { CredentialStatus, CredentialStatusType } from "@quarkid/vc-core";

export class ExtrimianCredentialStatus extends CredentialStatus {
    type: ExtrimianCredentialStatusType | any;
    persistanceType: PersistanceType;
    bitArrayIndex: number;
    bitArraySC: string;
    bitArrayID: number | string;
}

export enum PersistanceType {
    IPFS = "IPFS"
}

export enum ExtrimianCredentialStatusType {
    BitArrayStatusEntry = "bitArrayStatusEntry",
    RevocationList2020Status = "RevocationList2020Status",
    CredentialStatusList2017 = "CredentialStatusList2017"
}
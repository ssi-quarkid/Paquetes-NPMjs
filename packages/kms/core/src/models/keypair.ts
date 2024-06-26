import { IJWK } from "../utils/base-converter";
import { Suite } from "./supported-suites";

export interface IKeyPair {
    readonly privateKey: string;
    readonly publicKey: string;

    readonly privateKeyJWK?: IJWK;
    readonly publicKeyJWK?: IJWK;

    readonly keyType?: string;

    suite?: Suite;
}
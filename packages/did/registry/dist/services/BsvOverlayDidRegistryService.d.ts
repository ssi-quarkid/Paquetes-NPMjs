import { Transaction, // Added for explicit type if needed elsewhere, though addInput handles it.
SatoshisPerKilobyte } from '@bsv/sdk';
import { RequestInfo, Response, RequestInit } from 'node-fetch';
export interface UTXO {
    txid: string;
    vout: number;
    scriptPubKey: string;
    satoshis: number;
    sourceTransactionHex: string;
    publicKeyHex?: string;
}
export type BsvSignerFunction = (transaction: Transaction, inputsToSign: Array<{
    inputIndex: number;
    publicKeyHex: string;
    sighashType?: number;
}>) => Promise<Transaction>;
export type UtxoProviderFunction = (amountNeeded: number, specificOutpoint?: {
    txid: string;
    vout: number;
}) => Promise<UTXO[]>;
export type ChangeAddressProviderFunction = () => Promise<string>;
export interface ResolveDidSuccessResponse {
    didDocument: any;
    metadata: {
        method: {
            published: boolean;
            network?: string;
            txid?: string;
            vout?: number;
            blockHeight?: number;
            timestamp?: string;
        };
        resolver?: any;
    };
}
export interface BsvOverlayDidRegistryConfig {
    signer: BsvSignerFunction;
    utxoProvider: UtxoProviderFunction;
    changeAddressProvider: ChangeAddressProviderFunction;
    overlayNodeEndpoint: string;
    topic: string;
    feeModel?: SatoshisPerKilobyte;
    fetchImplementation?: (url: RequestInfo, init?: RequestInit) => Promise<Response>;
}
export interface CreateDidRequest {
    didDocument: any;
    controllerPublicKeyHex: string;
    feePerKb?: number;
}
export interface CreateDidResponse {
    did: string;
    longFormDid?: string;
    didDocument: any;
    transaction: Transaction;
    metadata: {
        txid: string;
        vout: number;
        protocol: string;
        operation: string;
    };
}
export interface UpdateDidRequest {
    didToUpdate: string;
    currentBrc48TxHex: string;
    currentBrc48Vout: number;
    currentBrc48Satoshis: number;
    currentControllerPrivateKeyHex: string;
    newDidDocument: any;
    newControllerPublicKeyHex: string;
    feePerKb?: number;
}
export interface UpdateDidResponse {
    did: string;
    didDocument: any;
    transaction: Transaction;
    metadata: {
        txid: string;
        vout: number;
        protocol: string;
        operation: string;
        previousTxid: string;
        previousVout: number;
    };
}
export declare class BsvOverlayDidRegistryService {
    private config;
    private fetchImplementation;
    constructor(config: BsvOverlayDidRegistryConfig);
    createDID(request: CreateDidRequest): Promise<CreateDidResponse>;
    private buildAndBroadcastBrc48CreateTx;
    updateDID(request: UpdateDidRequest): Promise<UpdateDidResponse>;
    private buildAndBroadcastBrc48UpdateTx;
    resolveDID(did: string): Promise<ResolveDidSuccessResponse>;
}

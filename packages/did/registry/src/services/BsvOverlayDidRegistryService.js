"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BsvOverlayDidRegistryService = void 0;
const sdk_1 = require("@bsv/sdk");
const SatoshisPerKilobyte_1 = __importDefault(require("@bsv/sdk/transaction/fee-models/SatoshisPerKilobyte"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// Constants for BRC-48 DID Operations
const QKDID_PROTOCOL_MARKER = 'QKDID';
const OP_CREATE = 'CREATE';
const OP_UPDATE = 'UPDATE';
const QKDID_REVOKE_MARKER = 'QKDID_REVOKE'; // For future use
class BsvOverlayDidRegistryService {
    constructor(config) {
        this.config = {
            ...config,
            feeModel: config.feeModel || new SatoshisPerKilobyte_1.default(50), // Default 0.05 sats/byte
        };
        this.fetchImplementation = config.fetchImplementation || node_fetch_1.default;
    }
    async createDID(request) {
        const feePerKb = request.feePerKb || (this.config.feeModel instanceof SatoshisPerKilobyte_1.default ? this.config.feeModel.value : 50);
        const { tx, vout } = await this.buildAndBroadcastBrc48CreateTx(request, feePerKb);
        const did = `did:bsv:${this.config.topic}:${tx.id('hex')}:${vout}`;
        console.log('DID Created:', did);
        return {
            did,
            didDocument: request.didDocument,
            transaction: tx,
            metadata: {
                txid: tx.id('hex'),
                vout,
                protocol: QKDID_PROTOCOL_MARKER,
                operation: OP_CREATE,
            },
        };
    }
    async buildAndBroadcastBrc48CreateTx(request, feePerKb) {
        const tx = new sdk_1.Transaction();
        const didDocumentString = JSON.stringify(request.didDocument);
        const payloadReferenceHash = sdk_1.Hash.sha256(didDocumentString);
        try {
            new sdk_1.PublicKey(request.controllerPublicKeyHex); // Validate public key format
        }
        catch (e) {
            throw new Error(`Invalid controllerPublicKeyHex: ${e.message}`);
        }
        const brc48CreateAsm = `
      ${Buffer.from(QKDID_PROTOCOL_MARKER).toString('hex')}
      ${Buffer.from(OP_CREATE).toString('hex')}
      ${Buffer.from(payloadReferenceHash).toString('hex')}
      OP_DROP OP_DROP OP_DROP
      ${request.controllerPublicKeyHex}
      OP_CHECKSIG
    `.trim().replace(/\n\s*/g, ' ');
        let brc48Script;
        try {
            brc48Script = sdk_1.LockingScript.fromASM(brc48CreateAsm);
        }
        catch (e) {
            throw new Error(`Error creating BRC-48 CREATE script: ${e.message}`);
        }
        const brc48OutputValue = 1; // Minimal value for the BRC-48 token UTXO
        tx.addOutput({
            lockingScript: brc48Script,
            satoshis: brc48OutputValue,
        });
        const brc48OutputIndex = tx.outputs.length - 1;
        const SATS_PER_BYTE = feePerKb / 1000;
        const P2PKH_OUTPUT_SIZE = 34;
        const BRC48_OUTPUT_SCRIPT_SIZE = brc48Script.toBuffer().length;
        const BRC48_OUTPUT_SIZE = BRC48_OUTPUT_SCRIPT_SIZE + 9; // script + value + output index
        const P2PKH_FUNDING_INPUT_SIZE = 148; // Approximate size for a P2PKH input
        let estimatedTxSize = 10 + BRC48_OUTPUT_SIZE + P2PKH_OUTPUT_SIZE; // Base tx + BRC48 output + change output
        let estimatedFee = Math.ceil(estimatedTxSize * SATS_PER_BYTE);
        let amountToRequestFromUtxoProvider = BigInt(brc48OutputValue) + BigInt(estimatedFee);
        console.log(`Initial funding request. Estimated size: ${estimatedTxSize} bytes, Estimated fee: ${estimatedFee} sats`);
        console.log(`Amount to request from UTXO provider: ${amountToRequestFromUtxoProvider} satoshis`);
        const fundingUtxosWithKeys = await this.config.utxoProvider(Number(amountToRequestFromUtxoProvider));
        if (!fundingUtxosWithKeys || fundingUtxosWithKeys.length === 0) {
            throw new Error('Insufficient funds or no UTXOs available from provider.');
        }
        let totalFundingFromInputs = BigInt(0);
        const inputsForGeneralSigner = [];
        const sighashType = sdk_1.TransactionSignature.SIGHASH_ALL | sdk_1.TransactionSignature.SIGHASH_FORKID;
        fundingUtxosWithKeys.forEach(utxo => {
            if (!utxo.publicKeyHex) {
                console.warn(`Funding UTXO ${utxo.txid}:${utxo.vout} is missing publicKeyHex. The general signer might not be able to sign it if it relies on this field.`);
                // Depending on signer implementation, this might be an error or handled by the signer itself.
            }
            tx.addInput({
                sourceTransaction: sdk_1.Transaction.fromHex(utxo.sourceTransactionHex),
                sourceOutputIndex: utxo.vout,
                unlockingScript: new sdk_1.UnlockingScript(), // Placeholder, signer will fill this
                sequence: 0xffffffff,
            });
            const inputIndex = tx.inputs.length - 1;
            totalFundingFromInputs += BigInt(utxo.satoshis);
            if (utxo.publicKeyHex) { // Only add to general signer list if pubkey is known
                inputsForGeneralSigner.push({ inputIndex, publicKeyHex: utxo.publicKeyHex, sighashType });
            }
        });
        console.log(`Total satoshis from funding inputs: ${totalFundingFromInputs}`);
        const changeAddress = await this.config.changeAddressProvider();
        let finalEstimatedSize = 10 + BRC48_OUTPUT_SIZE + (fundingUtxosWithKeys.length * P2PKH_FUNDING_INPUT_SIZE);
        if (totalFundingFromInputs - BigInt(brc48OutputValue) - BigInt(Math.ceil(finalEstimatedSize * SATS_PER_BYTE)) > BigInt(546)) {
            finalEstimatedSize += P2PKH_OUTPUT_SIZE; // Add change output size if it's being added
        }
        const finalEstimatedFee = Math.ceil(finalEstimatedSize * SATS_PER_BYTE);
        const changeAmount = totalFundingFromInputs - BigInt(brc48OutputValue) - BigInt(finalEstimatedFee);
        if (changeAmount > BigInt(546)) {
            tx.addOutput({
                lockingScript: new sdk_1.P2PKH().lock(changeAddress),
                satoshis: Number(changeAmount),
            });
            console.log(`Added change output of ${changeAmount} satoshis to ${changeAddress}`);
        }
        else if (changeAmount > BigInt(0)) {
            console.log(`Change amount ${changeAmount} is dust, will be absorbed by fees.`);
        }
        if (inputsForGeneralSigner.length === 0 && fundingUtxosWithKeys.length > 0) {
            throw new Error('Funding UTXOs were provided, but none had publicKeyHex, so the general signer cannot be called.');
        }
        if (inputsForGeneralSigner.length === 0 && fundingUtxosWithKeys.length === 0) {
            throw new Error('No funding UTXOs and no publicKeyHex for signing. This should not happen if utxoProvider works correctly.');
        }
        const signedTx = await this.config.signer(tx, inputsForGeneralSigner);
        console.log('Transaction signed by general signer.');
        const broadcastPayload = {
            rawTx: signedTx.toHex(),
            metadata: {
                didDocument: request.didDocument,
                operation: OP_CREATE,
                protocol: QKDID_PROTOCOL_MARKER,
                payloadHash: Buffer.from(payloadReferenceHash).toString('hex'),
                controllerPublicKey: request.controllerPublicKeyHex,
            },
        };
        let broadcastResult;
        try {
            const response = await this.fetchImplementation(`${this.config.overlayNodeEndpoint}/broadcast/${this.config.topic}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(broadcastPayload)
            });
            const responseBody = await response.text();
            if (response.ok) {
                let txid = 'unknown_txid_from_broadcast';
                try {
                    const jsonResponse = JSON.parse(responseBody);
                    txid = jsonResponse.txid || (typeof jsonResponse === 'string' && /^[0-9a-fA-F]{64}$/.test(jsonResponse) ? jsonResponse : txid);
                }
                catch (e) {
                    if (/^[0-9a-fA-F]{64}$/.test(responseBody))
                        txid = responseBody;
                    else
                        console.warn('Broadcast response was not a clear txid or JSON object:', responseBody);
                }
                broadcastResult = {
                    status: 'success',
                    txid: txid,
                    message: 'Broadcast presumed successful via custom fetch.'
                };
            }
            else {
                broadcastResult = {
                    status: 'error',
                    code: response.status.toString(),
                    description: `Broadcast failed: ${response.statusText} - ${responseBody}`
                };
            }
        }
        catch (error) {
            broadcastResult = {
                status: 'error',
                code: 'FETCH_ERROR',
                description: error.message || 'Fetch request to broadcast transaction failed.'
            };
        }
        if (broadcastResult.status === 'error') {
            const failure = broadcastResult;
            console.error('Broadcast failed:', failure.description, failure.code);
            throw new Error(`Failed to broadcast transaction: ${failure.description || 'Unknown error'}`);
        }
        const successResponse = broadcastResult;
        if (!successResponse.txid || successResponse.txid.toLowerCase() !== signedTx.id("hex").toLowerCase()) {
            console.warn(`CRITICAL: Broadcasted TXID (${successResponse.txid}) does not match calculated TXID (${signedTx.id("hex")}). This may indicate a problem.`);
        }
        console.log('Transaction broadcasted. Reported TXID:', successResponse.txid, "Calculated TXID:", signedTx.id("hex"));
        return { tx: signedTx, vout: brc48OutputIndex };
    }
    async updateDID(request) {
        // TODO: Parse didToUpdate to extract topic, current txid, vout if needed for validation
        // For now, we assume the caller provides all necessary parts of the current BRC-48 UTXO correctly.
        console.log(`Initiating update for DID: ${request.didToUpdate}`);
        const feePerKb = request.feePerKb || (this.config.feeModel instanceof SatoshisPerKilobyte_1.default ? this.config.feeModel.value : 50);
        const { tx, vout } = await this.buildAndBroadcastBrc48UpdateTx(request, feePerKb);
        const updatedDid = `did:bsv:${this.config.topic}:${tx.id('hex')}:${vout}`;
        console.log('DID Updated. New DID:', updatedDid);
        return {
            did: updatedDid,
            didDocument: request.newDidDocument,
            transaction: tx,
            metadata: {
                txid: tx.id('hex'),
                vout: vout,
                protocol: QKDID_PROTOCOL_MARKER,
                operation: OP_UPDATE,
                previousTxid: request.currentBrc48TxHex, // This should be the TXID of the input, not the full hex
                previousVout: request.currentBrc48Vout,
            },
        };
    }
    async buildAndBroadcastBrc48UpdateTx(request, feePerKb) {
        console.log('Starting BRC-48 DID Update process for:', request.didToUpdate);
        const tx = new sdk_1.Transaction();
        // 1. Prepare BRC-48 'UPDATE' Script data
        const newDidDocumentString = JSON.stringify(request.newDidDocument);
        const newPayloadReferenceHash = sdk_1.Hash.sha256(newDidDocumentString);
        try {
            new sdk_1.PublicKey(request.newControllerPublicKeyHex); // Validate new public key format
        }
        catch (e) {
            throw new Error(`Invalid newControllerPublicKeyHex: ${e.message}`);
        }
        const brc48UpdateAsm = `
      ${Buffer.from(QKDID_PROTOCOL_MARKER).toString('hex')}
      ${Buffer.from(OP_UPDATE).toString('hex')} 
      ${Buffer.from(newPayloadReferenceHash).toString('hex')}
      OP_DROP OP_DROP OP_DROP
      ${request.newControllerPublicKeyHex}
      OP_CHECKSIG
    `.trim().replace(/\n\s*/g, ' ');
        let brc48UpdateScript;
        try {
            brc48UpdateScript = sdk_1.LockingScript.fromASM(brc48UpdateAsm);
        }
        catch (e) {
            throw new Error(`Error creating BRC-48 UPDATE script: ${e.message}`);
        }
        // 2. Add the input spending the current BRC-48 UTXO
        const currentBrc48Tx = sdk_1.Transaction.fromHex(request.currentBrc48TxHex);
        const currentControllerPrivKey = sdk_1.PrivateKey.fromHex(request.currentControllerPrivateKeyHex);
        const currentControllerPubKey = currentControllerPrivKey.toPublicKey();
        tx.addInput({
            sourceTransaction: currentBrc48Tx,
            sourceOutputIndex: request.currentBrc48Vout,
            unlockingScript: new sdk_1.UnlockingScript(), // Placeholder, will be replaced by specific signature
            sequence: 0xffffffff
        });
        const brc48InputIndex = tx.inputs.length - 1;
        console.log(`Added BRC-48 input from ${currentBrc48Tx.id('hex')}:${request.currentBrc48Vout}`);
        // 3. Add the new BRC-48 output
        const newBrc48OutputValue = 1; // Minimal value for the new BRC-48 token UTXO
        tx.addOutput({
            lockingScript: brc48UpdateScript,
            satoshis: newBrc48OutputValue
        });
        const newBrc48OutputIndex = tx.outputs.length - 1;
        console.log('Added new BRC-48 output with OP_UPDATE script.');
        // 4. Fund the Transaction
        const SATS_PER_BYTE = feePerKb / 1000;
        const BRC48_INPUT_SIZE_APPROX = 110;
        const P2PKH_OUTPUT_SIZE = 34;
        const BRC48_OUTPUT_SCRIPT_SIZE = brc48UpdateScript.toBuffer().length;
        const BRC48_OUTPUT_SIZE = BRC48_OUTPUT_SCRIPT_SIZE + 9;
        const P2PKH_FUNDING_INPUT_SIZE = 148;
        let estimatedTxSize = 10 + BRC48_INPUT_SIZE_APPROX + BRC48_OUTPUT_SIZE + P2PKH_OUTPUT_SIZE;
        let estimatedFee = Math.ceil(estimatedTxSize * SATS_PER_BYTE);
        let totalFundingFromInputs = BigInt(request.currentBrc48Satoshis);
        let amountToRequestFromUtxoProvider = BigInt(0);
        const outputsTotalValue = BigInt(newBrc48OutputValue);
        let fundingUtxosWithKeys = [];
        if (totalFundingFromInputs < outputsTotalValue + BigInt(estimatedFee)) {
            // Estimate size with one funding input initially
            estimatedTxSize = 10 + BRC48_INPUT_SIZE_APPROX + P2PKH_FUNDING_INPUT_SIZE + BRC48_OUTPUT_SIZE + P2PKH_OUTPUT_SIZE;
            estimatedFee = Math.ceil(estimatedTxSize * SATS_PER_BYTE);
            amountToRequestFromUtxoProvider = (outputsTotalValue + BigInt(estimatedFee)) - totalFundingFromInputs;
            if (amountToRequestFromUtxoProvider <= BigInt(0)) { // Safety check, if currentBrc48Satoshis became enough after re-eval
                amountToRequestFromUtxoProvider = BigInt(P2PKH_FUNDING_INPUT_SIZE * SATS_PER_BYTE); // Request at least enough for one input's fee
            }
            console.log(`Requesting additional UTXOs. Estimated size: ${estimatedTxSize} bytes, Estimated fee: ${estimatedFee} sats`);
            console.log(`Amount to request from UTXO provider: ${amountToRequestFromUtxoProvider} satoshis`);
            fundingUtxosWithKeys = await this.config.utxoProvider(Number(amountToRequestFromUtxoProvider));
            if (!fundingUtxosWithKeys || fundingUtxosWithKeys.length === 0) {
                throw new Error('Insufficient funds or no UTXOs available from provider for update operation.');
            }
            console.log('Additional UTXOs received for funding:', fundingUtxosWithKeys.length);
            fundingUtxosWithKeys.forEach(utxo => {
                if (!utxo.publicKeyHex) {
                    console.warn(`Funding UTXO ${utxo.txid}:${utxo.vout} is missing publicKeyHex. The general signer might not be able to sign it.`);
                }
                tx.addInput({
                    sourceTransaction: sdk_1.Transaction.fromHex(utxo.sourceTransactionHex),
                    sourceOutputIndex: utxo.vout,
                    unlockingScript: new sdk_1.UnlockingScript(),
                    sequence: 0xffffffff
                });
                totalFundingFromInputs += BigInt(utxo.satoshis);
            });
        }
        console.log(`Total satoshis from all inputs: ${totalFundingFromInputs}`);
        // 5. Add Change Output
        const changeAddress = await this.config.changeAddressProvider();
        let finalEstimatedSize = 10 + BRC48_INPUT_SIZE_APPROX + BRC48_OUTPUT_SIZE;
        finalEstimatedSize += (tx.inputs.length - 1) * P2PKH_FUNDING_INPUT_SIZE; // All inputs except the BRC-48 one are funding inputs
        if (totalFundingFromInputs - outputsTotalValue - BigInt(Math.ceil(finalEstimatedSize * SATS_PER_BYTE)) > BigInt(546)) {
            finalEstimatedSize += P2PKH_OUTPUT_SIZE; // Add change output size if it's being added
        }
        const finalEstimatedFee = Math.ceil(finalEstimatedSize * SATS_PER_BYTE);
        const changeAmount = totalFundingFromInputs - outputsTotalValue - BigInt(finalEstimatedFee);
        if (changeAmount > BigInt(546)) {
            tx.addOutput({
                lockingScript: new sdk_1.P2PKH().lock(changeAddress),
                satoshis: Number(changeAmount)
            });
            console.log(`Added change output of ${changeAmount} satoshis to ${changeAddress}`);
        }
        else if (changeAmount > BigInt(0)) {
            console.log(`Change amount ${changeAmount} is dust, will be absorbed by fees.`);
        }
        // 6. Sign the transaction
        const sighashType = sdk_1.TransactionSignature.SIGHASH_ALL | sdk_1.TransactionSignature.SIGHASH_FORKID;
        const sig = tx.sign(currentControllerPrivKey, sighashType, brc48InputIndex, currentBrc48Tx.outputs[request.currentBrc48Vout].lockingScript, currentBrc48Tx.outputs[request.currentBrc48Vout].satoshis);
        const unlockingScriptBrc48 = new sdk_1.UnlockingScript()
            .writeBuffer(sig.toBuffer())
            .writeBuffer(currentControllerPubKey.toBuffer());
        tx.inputs[brc48InputIndex].unlockingScript = unlockingScriptBrc48;
        console.log('Signed BRC-48 input specifically.');
        const inputsForGeneralSigner = [];
        if (tx.inputs.length > 1) { // If there are funding inputs
            let fundingUtxoCounter = 0;
            for (let i = 0; i < tx.inputs.length; i++) {
                if (i === brc48InputIndex) {
                    continue;
                }
                const fundingUtxo = fundingUtxosWithKeys[fundingUtxoCounter++];
                if (!fundingUtxo || !fundingUtxo.publicKeyHex) {
                    throw new Error(`Critical: Missing publicKeyHex for funding input at transaction index ${i} (UTXO: ${fundingUtxo?.txid}:${fundingUtxo?.vout}). Cannot proceed with general signing.`);
                }
                inputsForGeneralSigner.push({
                    inputIndex: i,
                    publicKeyHex: fundingUtxo.publicKeyHex,
                    sighashType: sighashType
                });
            }
        }
        let finalSignedTx = tx;
        if (inputsForGeneralSigner.length > 0 && this.config.signer) {
            console.log('Calling general signer for inputs:', inputsForGeneralSigner.map(i => i.inputIndex));
            finalSignedTx = await this.config.signer(tx, inputsForGeneralSigner);
            console.log('General signer processed other inputs.');
        }
        else if (inputsForGeneralSigner.length > 0 && !this.config.signer) {
            throw new Error('Funding inputs need signing, but no general signer is configured.');
        }
        // 7. Broadcast the transaction
        const broadcastPayload = {
            rawTx: finalSignedTx.toHex(),
            metadata: {
                didDocument: request.newDidDocument,
                operation: OP_UPDATE,
                protocol: QKDID_PROTOCOL_MARKER,
                previousTxid: currentBrc48Tx.id('hex'),
                previousVout: request.currentBrc48Vout,
                payloadHash: Buffer.from(newPayloadReferenceHash).toString('hex'),
                controllerPublicKey: request.newControllerPublicKeyHex
            }
        };
        let broadcastResult;
        try {
            const response = await this.fetchImplementation(`${this.config.overlayNodeEndpoint}/broadcast/${this.config.topic}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(broadcastPayload)
            });
            const responseBody = await response.text();
            if (response.ok) {
                let txid = 'unknown_txid_from_broadcast';
                try {
                    const jsonResponse = JSON.parse(responseBody);
                    txid = jsonResponse.txid || (typeof jsonResponse === 'string' && /^[0-9a-fA-F]{64}$/.test(jsonResponse) ? jsonResponse : txid);
                }
                catch (e) {
                    if (/^[0-9a-fA-F]{64}$/.test(responseBody))
                        txid = responseBody;
                    else
                        console.warn('Broadcast response for UPDATE was not a clear txid or JSON object:', responseBody);
                }
                broadcastResult = { status: 'success', txid: txid, message: 'Update broadcast presumed successful.' };
            }
            else {
                broadcastResult = { status: 'error', code: response.status.toString(), description: `Update broadcast failed: ${response.statusText} - ${responseBody}` };
            }
        }
        catch (error) {
            broadcastResult = { status: 'error', code: 'FETCH_ERROR', description: error.message || 'Fetch request for UPDATE broadcast failed.' };
        }
        if (broadcastResult.status === 'error') {
            const failure = broadcastResult;
            throw new Error(`Failed to broadcast UPDATE transaction: ${failure.description || 'Unknown error'}`);
        }
        const successResponse = broadcastResult;
        if (!successResponse.txid || successResponse.txid.toLowerCase() !== finalSignedTx.id("hex").toLowerCase()) {
            console.warn(`CRITICAL (UPDATE): Broadcasted TXID (${successResponse.txid}) does not match calculated TXID (${finalSignedTx.id("hex")}).`);
        }
        console.log('BRC-48 UPDATE Transaction broadcasted successfully:', successResponse.txid);
        return { tx: finalSignedTx, vout: newBrc48OutputIndex };
    }
    async resolveDID(did) {
        const parts = did.split(':');
        if (parts.length !== 5 || parts[0] !== 'did' || parts[1] !== 'bsv') {
            throw new Error('Invalid DID string format. Expected did:bsv:<topic>:<txid>:<vout>');
        }
        const didTopic = parts[2];
        const txid = parts[3];
        const vout = parseInt(parts[4], 10);
        if (isNaN(vout)) {
            throw new Error('Invalid vout in DID string. Must be a number.');
        }
        if (didTopic !== this.config.topic) {
            console.warn(`Resolving DID with topic "${didTopic}" which is different from service configured topic "${this.config.topic}".`);
        }
        const resolutionUrl = `${this.config.overlayNodeEndpoint}/resolve/${didTopic}/${txid}/${vout}`;
        console.log('Resolution URL:', resolutionUrl);
        try {
            const response = await this.fetchImplementation(resolutionUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`DID not found: ${did}`);
                }
                const errorBody = await response.text();
                throw new Error(`Failed to resolve DID: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const resolvedData = await response.json();
            if (!resolvedData || typeof resolvedData.didDocument !== 'object' || typeof resolvedData.metadata !== 'object' || typeof resolvedData.metadata.method !== 'object') {
                throw new Error('Invalid response structure from DID resolution endpoint.');
            }
            console.log('DID Resolved Successfully:', resolvedData);
            return resolvedData;
        }
        catch (error) {
            console.error('Error resolving DID:', error.message);
            if (error instanceof Error) {
                throw error;
            }
            else {
                throw new Error(String(error));
            }
        }
    }
}
exports.BsvOverlayDidRegistryService = BsvOverlayDidRegistryService;
//# sourceMappingURL=BsvOverlayDidRegistryService.js.map
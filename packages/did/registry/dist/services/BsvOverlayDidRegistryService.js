"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BsvOverlayDidRegistryService = void 0;
var sdk_1 = require("@bsv/sdk");
var SatoshisPerKilobyte_1 = require("@bsv/sdk/transaction/fee-models/SatoshisPerKilobyte");
var node_fetch_1 = require("node-fetch");
// Constants for BRC-48 DID Operations
var QKDID_PROTOCOL_MARKER = 'QKDID';
var OP_CREATE = 'CREATE';
var OP_UPDATE = 'UPDATE';
var QKDID_REVOKE_MARKER = 'QKDID_REVOKE'; // For future use
var BsvOverlayDidRegistryService = /** @class */ (function () {
    function BsvOverlayDidRegistryService(config) {
        this.config = __assign(__assign({}, config), { feeModel: config.feeModel || new SatoshisPerKilobyte_1.default(50) });
        this.fetchImplementation = config.fetchImplementation || node_fetch_1.default;
    }
    BsvOverlayDidRegistryService.prototype.createDID = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var feePerKb, _a, tx, vout, did;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        feePerKb = request.feePerKb || (this.config.feeModel instanceof SatoshisPerKilobyte_1.default ? this.config.feeModel.value : 50);
                        return [4 /*yield*/, this.buildAndBroadcastBrc48CreateTx(request, feePerKb)];
                    case 1:
                        _a = _b.sent(), tx = _a.tx, vout = _a.vout;
                        did = "did:bsv:".concat(this.config.topic, ":").concat(tx.id('hex'), ":").concat(vout);
                        console.log('DID Created:', did);
                        return [2 /*return*/, {
                                did: did,
                                didDocument: request.didDocument,
                                transaction: tx,
                                metadata: {
                                    txid: tx.id('hex'),
                                    vout: vout,
                                    protocol: QKDID_PROTOCOL_MARKER,
                                    operation: OP_CREATE,
                                },
                            }];
                }
            });
        });
    };
    BsvOverlayDidRegistryService.prototype.buildAndBroadcastBrc48CreateTx = function (request, feePerKb) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, didDocumentString, payloadReferenceHash, brc48CreateAsm, brc48Script, brc48OutputValue, brc48OutputIndex, SATS_PER_BYTE, P2PKH_OUTPUT_SIZE, BRC48_OUTPUT_SCRIPT_SIZE, BRC48_OUTPUT_SIZE, P2PKH_FUNDING_INPUT_SIZE, estimatedTxSize, estimatedFee, amountToRequestFromUtxoProvider, fundingUtxosWithKeys, totalFundingFromInputs, inputsForGeneralSigner, sighashType, changeAddress, finalEstimatedSize, finalEstimatedFee, changeAmount, signedTx, broadcastPayload, broadcastResult, response, responseBody, txid, jsonResponse, error_1, failure, successResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = new sdk_1.Transaction();
                        didDocumentString = JSON.stringify(request.didDocument);
                        payloadReferenceHash = sdk_1.Hash.sha256(didDocumentString);
                        try {
                            new sdk_1.PublicKey(request.controllerPublicKeyHex); // Validate public key format
                        }
                        catch (e) {
                            throw new Error("Invalid controllerPublicKeyHex: ".concat(e.message));
                        }
                        brc48CreateAsm = "\n      ".concat(Buffer.from(QKDID_PROTOCOL_MARKER).toString('hex'), "\n      ").concat(Buffer.from(OP_CREATE).toString('hex'), "\n      ").concat(Buffer.from(payloadReferenceHash).toString('hex'), "\n      OP_DROP OP_DROP OP_DROP\n      ").concat(request.controllerPublicKeyHex, "\n      OP_CHECKSIG\n    ").trim().replace(/\n\s*/g, ' ');
                        try {
                            brc48Script = sdk_1.LockingScript.fromASM(brc48CreateAsm);
                        }
                        catch (e) {
                            throw new Error("Error creating BRC-48 CREATE script: ".concat(e.message));
                        }
                        brc48OutputValue = 1;
                        tx.addOutput({
                            lockingScript: brc48Script,
                            satoshis: brc48OutputValue,
                        });
                        brc48OutputIndex = tx.outputs.length - 1;
                        SATS_PER_BYTE = feePerKb / 1000;
                        P2PKH_OUTPUT_SIZE = 34;
                        BRC48_OUTPUT_SCRIPT_SIZE = brc48Script.toBuffer().length;
                        BRC48_OUTPUT_SIZE = BRC48_OUTPUT_SCRIPT_SIZE + 9;
                        P2PKH_FUNDING_INPUT_SIZE = 148;
                        estimatedTxSize = 10 + BRC48_OUTPUT_SIZE + P2PKH_OUTPUT_SIZE;
                        estimatedFee = Math.ceil(estimatedTxSize * SATS_PER_BYTE);
                        amountToRequestFromUtxoProvider = BigInt(brc48OutputValue) + BigInt(estimatedFee);
                        console.log("Initial funding request. Estimated size: ".concat(estimatedTxSize, " bytes, Estimated fee: ").concat(estimatedFee, " sats"));
                        console.log("Amount to request from UTXO provider: ".concat(amountToRequestFromUtxoProvider, " satoshis"));
                        return [4 /*yield*/, this.config.utxoProvider(Number(amountToRequestFromUtxoProvider))];
                    case 1:
                        fundingUtxosWithKeys = _a.sent();
                        if (!fundingUtxosWithKeys || fundingUtxosWithKeys.length === 0) {
                            throw new Error('Insufficient funds or no UTXOs available from provider.');
                        }
                        totalFundingFromInputs = BigInt(0);
                        inputsForGeneralSigner = [];
                        sighashType = sdk_1.TransactionSignature.SIGHASH_ALL | sdk_1.TransactionSignature.SIGHASH_FORKID;
                        fundingUtxosWithKeys.forEach(function (utxo) {
                            if (!utxo.publicKeyHex) {
                                console.warn("Funding UTXO ".concat(utxo.txid, ":").concat(utxo.vout, " is missing publicKeyHex. The general signer might not be able to sign it if it relies on this field."));
                                // Depending on signer implementation, this might be an error or handled by the signer itself.
                            }
                            tx.addInput({
                                sourceTransaction: sdk_1.Transaction.fromHex(utxo.sourceTransactionHex),
                                sourceOutputIndex: utxo.vout,
                                unlockingScript: new sdk_1.UnlockingScript(),
                                sequence: 0xffffffff,
                            });
                            var inputIndex = tx.inputs.length - 1;
                            totalFundingFromInputs += BigInt(utxo.satoshis);
                            if (utxo.publicKeyHex) { // Only add to general signer list if pubkey is known
                                inputsForGeneralSigner.push({ inputIndex: inputIndex, publicKeyHex: utxo.publicKeyHex, sighashType: sighashType });
                            }
                        });
                        console.log("Total satoshis from funding inputs: ".concat(totalFundingFromInputs));
                        return [4 /*yield*/, this.config.changeAddressProvider()];
                    case 2:
                        changeAddress = _a.sent();
                        finalEstimatedSize = 10 + BRC48_OUTPUT_SIZE + (fundingUtxosWithKeys.length * P2PKH_FUNDING_INPUT_SIZE);
                        if (totalFundingFromInputs - BigInt(brc48OutputValue) - BigInt(Math.ceil(finalEstimatedSize * SATS_PER_BYTE)) > BigInt(546)) {
                            finalEstimatedSize += P2PKH_OUTPUT_SIZE; // Add change output size if it's being added
                        }
                        finalEstimatedFee = Math.ceil(finalEstimatedSize * SATS_PER_BYTE);
                        changeAmount = totalFundingFromInputs - BigInt(brc48OutputValue) - BigInt(finalEstimatedFee);
                        if (changeAmount > BigInt(546)) {
                            tx.addOutput({
                                lockingScript: new sdk_1.P2PKH().lock(changeAddress),
                                satoshis: Number(changeAmount),
                            });
                            console.log("Added change output of ".concat(changeAmount, " satoshis to ").concat(changeAddress));
                        }
                        else if (changeAmount > BigInt(0)) {
                            console.log("Change amount ".concat(changeAmount, " is dust, will be absorbed by fees."));
                        }
                        if (inputsForGeneralSigner.length === 0 && fundingUtxosWithKeys.length > 0) {
                            throw new Error('Funding UTXOs were provided, but none had publicKeyHex, so the general signer cannot be called.');
                        }
                        if (inputsForGeneralSigner.length === 0 && fundingUtxosWithKeys.length === 0) {
                            throw new Error('No funding UTXOs and no publicKeyHex for signing. This should not happen if utxoProvider works correctly.');
                        }
                        return [4 /*yield*/, this.config.signer(tx, inputsForGeneralSigner)];
                    case 3:
                        signedTx = _a.sent();
                        console.log('Transaction signed by general signer.');
                        broadcastPayload = {
                            rawTx: signedTx.toHex(),
                            metadata: {
                                didDocument: request.didDocument,
                                operation: OP_CREATE,
                                protocol: QKDID_PROTOCOL_MARKER,
                                payloadHash: Buffer.from(payloadReferenceHash).toString('hex'),
                                controllerPublicKey: request.controllerPublicKeyHex,
                            },
                        };
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 7, , 8]);
                        return [4 /*yield*/, this.fetchImplementation("".concat(this.config.overlayNodeEndpoint, "/broadcast/").concat(this.config.topic), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(broadcastPayload)
                            })];
                    case 5:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 6:
                        responseBody = _a.sent();
                        if (response.ok) {
                            txid = 'unknown_txid_from_broadcast';
                            try {
                                jsonResponse = JSON.parse(responseBody);
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
                                description: "Broadcast failed: ".concat(response.statusText, " - ").concat(responseBody)
                            };
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        broadcastResult = {
                            status: 'error',
                            code: 'FETCH_ERROR',
                            description: error_1.message || 'Fetch request to broadcast transaction failed.'
                        };
                        return [3 /*break*/, 8];
                    case 8:
                        if (broadcastResult.status === 'error') {
                            failure = broadcastResult;
                            console.error('Broadcast failed:', failure.description, failure.code);
                            throw new Error("Failed to broadcast transaction: ".concat(failure.description || 'Unknown error'));
                        }
                        successResponse = broadcastResult;
                        if (!successResponse.txid || successResponse.txid.toLowerCase() !== signedTx.id("hex").toLowerCase()) {
                            console.warn("CRITICAL: Broadcasted TXID (".concat(successResponse.txid, ") does not match calculated TXID (").concat(signedTx.id("hex"), "). This may indicate a problem."));
                        }
                        console.log('Transaction broadcasted. Reported TXID:', successResponse.txid, "Calculated TXID:", signedTx.id("hex"));
                        return [2 /*return*/, { tx: signedTx, vout: brc48OutputIndex }];
                }
            });
        });
    };
    BsvOverlayDidRegistryService.prototype.updateDID = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var feePerKb, _a, tx, vout, updatedDid;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // TODO: Parse didToUpdate to extract topic, current txid, vout if needed for validation
                        // For now, we assume the caller provides all necessary parts of the current BRC-48 UTXO correctly.
                        console.log("Initiating update for DID: ".concat(request.didToUpdate));
                        feePerKb = request.feePerKb || (this.config.feeModel instanceof SatoshisPerKilobyte_1.default ? this.config.feeModel.value : 50);
                        return [4 /*yield*/, this.buildAndBroadcastBrc48UpdateTx(request, feePerKb)];
                    case 1:
                        _a = _b.sent(), tx = _a.tx, vout = _a.vout;
                        updatedDid = "did:bsv:".concat(this.config.topic, ":").concat(tx.id('hex'), ":").concat(vout);
                        console.log('DID Updated. New DID:', updatedDid);
                        return [2 /*return*/, {
                                did: updatedDid,
                                didDocument: request.newDidDocument,
                                transaction: tx,
                                metadata: {
                                    txid: tx.id('hex'),
                                    vout: vout,
                                    protocol: QKDID_PROTOCOL_MARKER,
                                    operation: OP_UPDATE,
                                    previousTxid: request.currentBrc48TxHex,
                                    previousVout: request.currentBrc48Vout,
                                },
                            }];
                }
            });
        });
    };
    BsvOverlayDidRegistryService.prototype.buildAndBroadcastBrc48UpdateTx = function (request, feePerKb) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, newDidDocumentString, newPayloadReferenceHash, brc48UpdateAsm, brc48UpdateScript, currentBrc48Tx, currentControllerPrivKey, currentControllerPubKey, brc48InputIndex, newBrc48OutputValue, newBrc48OutputIndex, SATS_PER_BYTE, BRC48_INPUT_SIZE_APPROX, P2PKH_OUTPUT_SIZE, BRC48_OUTPUT_SCRIPT_SIZE, BRC48_OUTPUT_SIZE, P2PKH_FUNDING_INPUT_SIZE, estimatedTxSize, estimatedFee, totalFundingFromInputs, amountToRequestFromUtxoProvider, outputsTotalValue, fundingUtxosWithKeys, changeAddress, finalEstimatedSize, finalEstimatedFee, changeAmount, sighashType, sig, unlockingScriptBrc48, inputsForGeneralSigner, fundingUtxoCounter, i, fundingUtxo, finalSignedTx, broadcastPayload, broadcastResult, response, responseBody, txid, jsonResponse, error_2, failure, successResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Starting BRC-48 DID Update process for:', request.didToUpdate);
                        tx = new sdk_1.Transaction();
                        newDidDocumentString = JSON.stringify(request.newDidDocument);
                        newPayloadReferenceHash = sdk_1.Hash.sha256(newDidDocumentString);
                        try {
                            new sdk_1.PublicKey(request.newControllerPublicKeyHex); // Validate new public key format
                        }
                        catch (e) {
                            throw new Error("Invalid newControllerPublicKeyHex: ".concat(e.message));
                        }
                        brc48UpdateAsm = "\n      ".concat(Buffer.from(QKDID_PROTOCOL_MARKER).toString('hex'), "\n      ").concat(Buffer.from(OP_UPDATE).toString('hex'), " \n      ").concat(Buffer.from(newPayloadReferenceHash).toString('hex'), "\n      OP_DROP OP_DROP OP_DROP\n      ").concat(request.newControllerPublicKeyHex, "\n      OP_CHECKSIG\n    ").trim().replace(/\n\s*/g, ' ');
                        try {
                            brc48UpdateScript = sdk_1.LockingScript.fromASM(brc48UpdateAsm);
                        }
                        catch (e) {
                            throw new Error("Error creating BRC-48 UPDATE script: ".concat(e.message));
                        }
                        currentBrc48Tx = sdk_1.Transaction.fromHex(request.currentBrc48TxHex);
                        currentControllerPrivKey = sdk_1.PrivateKey.fromHex(request.currentControllerPrivateKeyHex);
                        currentControllerPubKey = currentControllerPrivKey.toPublicKey();
                        tx.addInput({
                            sourceTransaction: currentBrc48Tx,
                            sourceOutputIndex: request.currentBrc48Vout,
                            unlockingScript: new sdk_1.UnlockingScript(),
                            sequence: 0xffffffff
                        });
                        brc48InputIndex = tx.inputs.length - 1;
                        console.log("Added BRC-48 input from ".concat(currentBrc48Tx.id('hex'), ":").concat(request.currentBrc48Vout));
                        newBrc48OutputValue = 1;
                        tx.addOutput({
                            lockingScript: brc48UpdateScript,
                            satoshis: newBrc48OutputValue
                        });
                        newBrc48OutputIndex = tx.outputs.length - 1;
                        console.log('Added new BRC-48 output with OP_UPDATE script.');
                        SATS_PER_BYTE = feePerKb / 1000;
                        BRC48_INPUT_SIZE_APPROX = 110;
                        P2PKH_OUTPUT_SIZE = 34;
                        BRC48_OUTPUT_SCRIPT_SIZE = brc48UpdateScript.toBuffer().length;
                        BRC48_OUTPUT_SIZE = BRC48_OUTPUT_SCRIPT_SIZE + 9;
                        P2PKH_FUNDING_INPUT_SIZE = 148;
                        estimatedTxSize = 10 + BRC48_INPUT_SIZE_APPROX + BRC48_OUTPUT_SIZE + P2PKH_OUTPUT_SIZE;
                        estimatedFee = Math.ceil(estimatedTxSize * SATS_PER_BYTE);
                        totalFundingFromInputs = BigInt(request.currentBrc48Satoshis);
                        amountToRequestFromUtxoProvider = BigInt(0);
                        outputsTotalValue = BigInt(newBrc48OutputValue);
                        fundingUtxosWithKeys = [];
                        if (!(totalFundingFromInputs < outputsTotalValue + BigInt(estimatedFee))) return [3 /*break*/, 2];
                        // Estimate size with one funding input initially
                        estimatedTxSize = 10 + BRC48_INPUT_SIZE_APPROX + P2PKH_FUNDING_INPUT_SIZE + BRC48_OUTPUT_SIZE + P2PKH_OUTPUT_SIZE;
                        estimatedFee = Math.ceil(estimatedTxSize * SATS_PER_BYTE);
                        amountToRequestFromUtxoProvider = (outputsTotalValue + BigInt(estimatedFee)) - totalFundingFromInputs;
                        if (amountToRequestFromUtxoProvider <= BigInt(0)) { // Safety check, if currentBrc48Satoshis became enough after re-eval
                            amountToRequestFromUtxoProvider = BigInt(P2PKH_FUNDING_INPUT_SIZE * SATS_PER_BYTE); // Request at least enough for one input's fee
                        }
                        console.log("Requesting additional UTXOs. Estimated size: ".concat(estimatedTxSize, " bytes, Estimated fee: ").concat(estimatedFee, " sats"));
                        console.log("Amount to request from UTXO provider: ".concat(amountToRequestFromUtxoProvider, " satoshis"));
                        return [4 /*yield*/, this.config.utxoProvider(Number(amountToRequestFromUtxoProvider))];
                    case 1:
                        fundingUtxosWithKeys = _a.sent();
                        if (!fundingUtxosWithKeys || fundingUtxosWithKeys.length === 0) {
                            throw new Error('Insufficient funds or no UTXOs available from provider for update operation.');
                        }
                        console.log('Additional UTXOs received for funding:', fundingUtxosWithKeys.length);
                        fundingUtxosWithKeys.forEach(function (utxo) {
                            if (!utxo.publicKeyHex) {
                                console.warn("Funding UTXO ".concat(utxo.txid, ":").concat(utxo.vout, " is missing publicKeyHex. The general signer might not be able to sign it."));
                            }
                            tx.addInput({
                                sourceTransaction: sdk_1.Transaction.fromHex(utxo.sourceTransactionHex),
                                sourceOutputIndex: utxo.vout,
                                unlockingScript: new sdk_1.UnlockingScript(),
                                sequence: 0xffffffff
                            });
                            totalFundingFromInputs += BigInt(utxo.satoshis);
                        });
                        _a.label = 2;
                    case 2:
                        console.log("Total satoshis from all inputs: ".concat(totalFundingFromInputs));
                        return [4 /*yield*/, this.config.changeAddressProvider()];
                    case 3:
                        changeAddress = _a.sent();
                        finalEstimatedSize = 10 + BRC48_INPUT_SIZE_APPROX + BRC48_OUTPUT_SIZE;
                        finalEstimatedSize += (tx.inputs.length - 1) * P2PKH_FUNDING_INPUT_SIZE; // All inputs except the BRC-48 one are funding inputs
                        if (totalFundingFromInputs - outputsTotalValue - BigInt(Math.ceil(finalEstimatedSize * SATS_PER_BYTE)) > BigInt(546)) {
                            finalEstimatedSize += P2PKH_OUTPUT_SIZE; // Add change output size if it's being added
                        }
                        finalEstimatedFee = Math.ceil(finalEstimatedSize * SATS_PER_BYTE);
                        changeAmount = totalFundingFromInputs - outputsTotalValue - BigInt(finalEstimatedFee);
                        if (changeAmount > BigInt(546)) {
                            tx.addOutput({
                                lockingScript: new sdk_1.P2PKH().lock(changeAddress),
                                satoshis: Number(changeAmount)
                            });
                            console.log("Added change output of ".concat(changeAmount, " satoshis to ").concat(changeAddress));
                        }
                        else if (changeAmount > BigInt(0)) {
                            console.log("Change amount ".concat(changeAmount, " is dust, will be absorbed by fees."));
                        }
                        sighashType = sdk_1.TransactionSignature.SIGHASH_ALL | sdk_1.TransactionSignature.SIGHASH_FORKID;
                        sig = tx.sign(currentControllerPrivKey, sighashType, brc48InputIndex, currentBrc48Tx.outputs[request.currentBrc48Vout].lockingScript, currentBrc48Tx.outputs[request.currentBrc48Vout].satoshis);
                        unlockingScriptBrc48 = new sdk_1.UnlockingScript()
                            .writeBuffer(sig.toBuffer())
                            .writeBuffer(currentControllerPubKey.toBuffer());
                        tx.inputs[brc48InputIndex].unlockingScript = unlockingScriptBrc48;
                        console.log('Signed BRC-48 input specifically.');
                        inputsForGeneralSigner = [];
                        if (tx.inputs.length > 1) { // If there are funding inputs
                            fundingUtxoCounter = 0;
                            for (i = 0; i < tx.inputs.length; i++) {
                                if (i === brc48InputIndex) {
                                    continue;
                                }
                                fundingUtxo = fundingUtxosWithKeys[fundingUtxoCounter++];
                                if (!fundingUtxo || !fundingUtxo.publicKeyHex) {
                                    throw new Error("Critical: Missing publicKeyHex for funding input at transaction index ".concat(i, " (UTXO: ").concat(fundingUtxo === null || fundingUtxo === void 0 ? void 0 : fundingUtxo.txid, ":").concat(fundingUtxo === null || fundingUtxo === void 0 ? void 0 : fundingUtxo.vout, "). Cannot proceed with general signing."));
                                }
                                inputsForGeneralSigner.push({
                                    inputIndex: i,
                                    publicKeyHex: fundingUtxo.publicKeyHex,
                                    sighashType: sighashType
                                });
                            }
                        }
                        finalSignedTx = tx;
                        if (!(inputsForGeneralSigner.length > 0 && this.config.signer)) return [3 /*break*/, 5];
                        console.log('Calling general signer for inputs:', inputsForGeneralSigner.map(function (i) { return i.inputIndex; }));
                        return [4 /*yield*/, this.config.signer(tx, inputsForGeneralSigner)];
                    case 4:
                        finalSignedTx = _a.sent();
                        console.log('General signer processed other inputs.');
                        return [3 /*break*/, 6];
                    case 5:
                        if (inputsForGeneralSigner.length > 0 && !this.config.signer) {
                            throw new Error('Funding inputs need signing, but no general signer is configured.');
                        }
                        _a.label = 6;
                    case 6:
                        broadcastPayload = {
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
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, this.fetchImplementation("".concat(this.config.overlayNodeEndpoint, "/broadcast/").concat(this.config.topic), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(broadcastPayload)
                            })];
                    case 8:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 9:
                        responseBody = _a.sent();
                        if (response.ok) {
                            txid = 'unknown_txid_from_broadcast';
                            try {
                                jsonResponse = JSON.parse(responseBody);
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
                            broadcastResult = { status: 'error', code: response.status.toString(), description: "Update broadcast failed: ".concat(response.statusText, " - ").concat(responseBody) };
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        error_2 = _a.sent();
                        broadcastResult = { status: 'error', code: 'FETCH_ERROR', description: error_2.message || 'Fetch request for UPDATE broadcast failed.' };
                        return [3 /*break*/, 11];
                    case 11:
                        if (broadcastResult.status === 'error') {
                            failure = broadcastResult;
                            throw new Error("Failed to broadcast UPDATE transaction: ".concat(failure.description || 'Unknown error'));
                        }
                        successResponse = broadcastResult;
                        if (!successResponse.txid || successResponse.txid.toLowerCase() !== finalSignedTx.id("hex").toLowerCase()) {
                            console.warn("CRITICAL (UPDATE): Broadcasted TXID (".concat(successResponse.txid, ") does not match calculated TXID (").concat(finalSignedTx.id("hex"), ")."));
                        }
                        console.log('BRC-48 UPDATE Transaction broadcasted successfully:', successResponse.txid);
                        return [2 /*return*/, { tx: finalSignedTx, vout: newBrc48OutputIndex }];
                }
            });
        });
    };
    BsvOverlayDidRegistryService.prototype.resolveDID = function (did) {
        return __awaiter(this, void 0, void 0, function () {
            var parts, didTopic, txid, vout, resolutionUrl, response, errorBody, resolvedData, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parts = did.split(':');
                        if (parts.length !== 5 || parts[0] !== 'did' || parts[1] !== 'bsv') {
                            throw new Error('Invalid DID string format. Expected did:bsv:<topic>:<txid>:<vout>');
                        }
                        didTopic = parts[2];
                        txid = parts[3];
                        vout = parseInt(parts[4], 10);
                        if (isNaN(vout)) {
                            throw new Error('Invalid vout in DID string. Must be a number.');
                        }
                        if (didTopic !== this.config.topic) {
                            console.warn("Resolving DID with topic \"".concat(didTopic, "\" which is different from service configured topic \"").concat(this.config.topic, "\"."));
                        }
                        resolutionUrl = "".concat(this.config.overlayNodeEndpoint, "/resolve/").concat(didTopic, "/").concat(txid, "/").concat(vout);
                        console.log('Resolution URL:', resolutionUrl);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.fetchImplementation(resolutionUrl, {
                                method: 'GET',
                                headers: { 'Accept': 'application/json' },
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        if (response.status === 404) {
                            throw new Error("DID not found: ".concat(did));
                        }
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorBody = _a.sent();
                        throw new Error("Failed to resolve DID: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorBody));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        resolvedData = _a.sent();
                        if (!resolvedData || typeof resolvedData.didDocument !== 'object' || typeof resolvedData.metadata !== 'object' || typeof resolvedData.metadata.method !== 'object') {
                            throw new Error('Invalid response structure from DID resolution endpoint.');
                        }
                        console.log('DID Resolved Successfully:', resolvedData);
                        return [2 /*return*/, resolvedData];
                    case 6:
                        error_3 = _a.sent();
                        console.error('Error resolving DID:', error_3.message);
                        if (error_3 instanceof Error) {
                            throw error_3;
                        }
                        else {
                            throw new Error(String(error_3));
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return BsvOverlayDidRegistryService;
}());
exports.BsvOverlayDidRegistryService = BsvOverlayDidRegistryService;
//# sourceMappingURL=BsvOverlayDidRegistryService.js.map
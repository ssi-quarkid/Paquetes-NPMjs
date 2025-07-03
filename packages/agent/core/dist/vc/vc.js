"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VC = void 0;
const did_core_1 = require("@quarkid/did-core");
const kms_core_1 = require("@quarkid/kms-core");
const vc_verifier_1 = require("@extrimian/vc-verifier");
const base_64_1 = require("base-64");
const vc_protocol_not_found_1 = require("../exceptions/vc-protocol-not-found");
const agent_pbk_1 = require("../models/agent-pbk");
const did_1 = require("../models/did");
const dwn_transport_1 = require("../models/transports/dwn-transport");
const lite_event_1 = require("../utils/lite-event");
class VC {
    get credentialArrived() { return this.onCredentialArrived.expose(); }
    get credentialPresented() { return this.onCredentialPresented.expose(); }
    get presentationVerified() { return this.onPresentationVerified.expose(); }
    get credentialIssued() { return this.onCredentialIssued.expose(); }
    get ackCompleted() { return this.onAckCompleted.expose(); }
    get problemReport() { return this.onProblemReport.expose(); }
    ;
    get beforeSigningVC() { return this.onBeforeSigningVC.expose(); }
    ;
    get beforeSaveVC() { return this.onBeforeSaveVC.expose(); }
    ;
    get afterSaveVC() { return this.onAfterSaveVC.expose(); }
    ;
    get beforeVerifyVC() { return this.onBeforeVerifyVC.expose(); }
    ;
    get afterVerifyVC() { return this.onAfterVerifyVC.expose(); }
    ;
    constructor(opts) {
        this.verificationRules = [];
        this.onCredentialArrived = new lite_event_1.LiteEvent();
        this.onCredentialPresented = new lite_event_1.LiteEvent();
        this.onPresentationVerified = new lite_event_1.LiteEvent;
        this.onCredentialIssued = new lite_event_1.LiteEvent();
        this.onAckCompleted = new lite_event_1.LiteEvent;
        this.onProblemReport = new lite_event_1.LiteEvent;
        this.onBeforeSigningVC = new lite_event_1.LiteEvent;
        this.onBeforeSaveVC = new lite_event_1.LiteEvent;
        this.onAfterSaveVC = new lite_event_1.LiteEvent;
        this.onBeforeVerifyVC = new lite_event_1.LiteEvent;
        this.onAfterVerifyVC = new lite_event_1.LiteEvent;
        this.credentialStatusPlugins = new Array();
        this.transports = opts.transports;
        this.kms = opts.kms;
        this.resolver = opts.resolver;
        this.identity = opts.identity;
        this.agentStorage = opts.agentStorage;
        this.vcProtocols = opts.vcProtocols;
        this.vcProtocols.forEach((protocol) => {
            protocol.vcArrived.on((data) => {
                this.onCredentialArrived.trigger(data);
            });
            protocol.vcVerified.on((data) => this.onCredentialPresented.trigger({
                vcVerified: data.verified,
                presentationVerified: data.presentationVerified,
                vc: data.vc,
            }));
            protocol.presentationVerified.on((data) => this.onPresentationVerified.trigger({
                messageId: data.messageId,
                thid: data.thid,
                vcs: data.vcs,
                verified: data.verified
            }));
            protocol.credentialIssued.on((data) => this.onCredentialIssued.trigger({
                to: data.toDID,
                vc: data.vc,
                invitationId: data.invitationId
            }));
            protocol.ackCompleted.on(data => { this.onAckCompleted.trigger(data); });
            protocol.problemReport.on(data => this.onProblemReport.trigger(data));
        });
        this.vcStorage = opts.vcStorage;
        this.verificationRules = opts.verificationRules;
    }
    addCredentialStatusStrategy(credentialStatusStrategy) {
        this.credentialStatusPlugins.push(credentialStatusStrategy);
    }
    saveCredential(vc) {
        return __awaiter(this, void 0, void 0, function* () {
            this.onBeforeSaveVC.trigger({ vc: vc });
            yield this.vcStorage.add(vc.id, vc);
            this.onAfterSaveVC.trigger({ vc: vc });
        });
    }
    saveCredentialWithInfo(vc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.onBeforeSaveVC.trigger({ vc: vc });
            yield this.vcStorage.add(vc.id, { data: vc, styles: params.styles, display: params.display });
            yield this.onAfterSaveVC.trigger({ vc: vc });
        });
    }
    removeCredential(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.vcStorage.remove(id);
        });
    }
    getVerifiableCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from((yield this.vcStorage.getAll()).values());
        });
    }
    getVerifiableCredentialsWithInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from((yield this.vcStorage.getAll()).values());
        });
    }
    getVerifiableCredentialsByType(types) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getVerifiableCredentials()).filter(x => !x.type.some(y => types.some(z => z != y)));
        });
    }
    createKey(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKey = yield this.kms.create(kms_core_1.Suite.Bbsbls2020);
            const agentPbk = new agent_pbk_1.AgentPublicKey({
                name: params.name,
                description: params.description,
                publicKeyJWK: publicKey.publicKeyJWK,
            });
            this.agentStorage.add(kms_core_1.BaseConverter.convert(publicKey.publicKeyJWK, kms_core_1.Base.JWK, kms_core_1.Base.Hex), agentPbk);
            return agentPbk;
        });
    }
    getKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const bbsblsKeys = yield this.kms.getPublicKeysBySuiteType(kms_core_1.Suite.Bbsbls2020);
            const keys = new Array();
            for (let key in bbsblsKeys) {
                const apbk = new agent_pbk_1.AgentPublicKey(yield this.agentStorage.get(kms_core_1.BaseConverter.convert(bbsblsKeys[key], kms_core_1.Base.JWK, kms_core_1.Base.Hex)));
                keys.push(apbk);
            }
            return keys;
        });
    }
    getKey(jwk) {
        return __awaiter(this, void 0, void 0, function* () {
            const bbsblsKeys = yield this.getKeys();
            const searchedKey = bbsblsKeys.find(key => key.publicKeyJWK.crv == jwk.crv &&
                key.publicKeyJWK.kty == jwk.kty &&
                key.publicKeyJWK.x == jwk.x &&
                key.publicKeyJWK.y == jwk.y);
            if (!searchedKey)
                throw new Error(`Key ${JSON.stringify(jwk)} not found in KMS`);
            return searchedKey;
        });
    }
    signVC(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let publicKeys;
            let suiteType;
            if (!opts.publicKey) {
                // Try to get ES256k keys first (for BSV compatibility)
                const es256kKeys = yield this.kms.getPublicKeysBySuiteType(kms_core_1.Suite.ES256k);
                if (es256kKeys.length > 0) {
                    publicKeys = es256kKeys;
                    suiteType = kms_core_1.Suite.ES256k;
                }
                else {
                    // Fallback to BBS+ keys
                    const bbsblsKeys = yield this.kms.getPublicKeysBySuiteType(kms_core_1.Suite.Bbsbls2020);
                    if (bbsblsKeys.length == 0) {
                        throw new Error("KMS doesn't contains keys for ES256k or Bbsbls2020. You need to create this kind of keys to sign verifiable credentials");
                    }
                    publicKeys = bbsblsKeys;
                    suiteType = kms_core_1.Suite.Bbsbls2020;
                }
            }
            else {
                publicKeys = [opts.publicKey];
                // Determine suite type from the public key
                if (opts.publicKey.crv === 'secp256k1') {
                    suiteType = kms_core_1.Suite.ES256k;
                }
                else {
                    suiteType = kms_core_1.Suite.Bbsbls2020;
                }
            }
            const didDocument = yield this.resolver.resolve(opts.did || this.identity.getOperationalDID());
            // Filter verification methods based on suite type
            let validPublicKeys;
            if (suiteType === kms_core_1.Suite.ES256k) {
                // For ES256k, look for JsonWebKey2020 or EcdsaSecp256k1VerificationKey2019
                validPublicKeys = didDocument.verificationMethod.filter(x => x.type === "JsonWebKey2020" ||
                    x.type === "EcdsaSecp256k1VerificationKey2019");
            }
            else {
                // For BBS+, look for Bls12381G1Key2020
                validPublicKeys = didDocument.verificationMethod.filter(x => x.type == "Bls12381G1Key2020");
            }
            //Comienzo a comparar las claves que estan en el DID Document con las que tiene el KMS hasta encontrar un match
            const firstValidPbk = validPublicKeys.find(didDocKey => publicKeys.some(kmsKey => didDocKey.publicKeyJwk.x == kmsKey.x &&
                didDocKey.publicKeyJwk.y == kmsKey.y));
            // Si el DID Document no contiene la clave, el agente no debería firmar ya que hay un error.
            if (!firstValidPbk) {
                throw Error("There aren't public keys valid to use based on Issuer DID Document and KMS secrets");
            }
            yield this.onBeforeSigningVC.trigger({ vc: opts.credential, issuerDID: opts.did });
            for (let csPlugin of this.credentialStatusPlugins) {
                if (yield csPlugin.canHandle({ vc: opts.credential, issuerDID: opts.did })) {
                    yield csPlugin.handle({ vc: opts.credential, issuerDID: opts.did });
                    break;
                }
            }
            // Si contiene la clave, se procede a la firma
            const vc = yield this.kms.signVC(suiteType, firstValidPbk.publicKeyJwk, opts.credential, (opts.did || this.identity.getOperationalDID()).value, (opts.did || this.identity.getOperationalDID()).value + firstValidPbk.id, opts.purpose || new did_core_1.AssertionMethodPurpose());
            return vc;
        });
    }
    signPresentation(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const verificationMethod = yield this.getValidVerificationMethodSigner({
                suiteType: kms_core_1.Suite.RsaSignature2018,
                publicKey: params.publicKey,
                did: params.did || this.identity.getOperationalDID()
            });
            const signature = yield this.kms.signVCPresentation({
                did: (params.did || this.identity.getOperationalDID()).value,
                presentationObject: params.contentToSign,
                publicKeyJWK: verificationMethod.publicKeyJwk,
                purpose: params.purpose || new did_core_1.AuthenticationPurpose({ challenge: params.challenge }),
                verificationMethodId: (params.did || this.identity.getOperationalDID()).value + verificationMethod.id
            });
            return signature;
        });
    }
    sendVC(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (params.preferredTransportClassRef) {
                params.preferredTransportClassRef = dwn_transport_1.DWNTransport;
            }
            yield this.transports.sendMessage({
                to: params.to,
                message: JSON.stringify(params.vc),
            });
        });
    }
    verifyVC(params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const vcService = new vc_verifier_1.VCVerifierService({
                didDocumentResolver: (did) => this.resolver.resolve(did_1.DID.from(did)),
            });
            const result = yield vcService.verify(params.vc, params.purpose || new did_core_1.AssertionMethodPurpose());
            if (result.result) {
                for (let f of this.verificationRules) {
                    const r = yield f(params.vc);
                    if (!r.result) {
                        return {
                            result: false,
                            error: {
                                code: (_a = r.rejectDetail) === null || _a === void 0 ? void 0 : _a.code,
                                description: r.rejectDetail.description,
                                name: r.rejectDetail.name
                            }
                        };
                    }
                }
            }
            return result;
        });
    }
    verifyPresentation(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.challenge && !params.purpose) {
                throw new Error("Challenge or purpose are required for verifyPresentation");
            }
            const vcService = new vc_verifier_1.VCVerifierService({
                didDocumentResolver: (did) => this.resolver.resolve(did_1.DID.from(did)),
            });
            const result = yield vcService.verify(params.presentation, params.purpose || new did_core_1.AuthenticationPurpose({ challenge: params.challenge }));
            return result;
        });
    }
    createInvitationMessage(args, outParam) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.path)
                args.path = "didcomm";
            const oobMessage = yield this.vcProtocols[0].createInvitationMessage(args.flow, args.did || this.identity.getOperationalDID());
            const oob = (0, base_64_1.encode)(JSON.stringify(oobMessage));
            if (outParam)
                outParam.invitationId = oobMessage.id;
            return `${args.path}://?_oob=${oob}`;
        });
    }
    processMessage(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = this.vcProtocols.map((x) => __awaiter(this, void 0, void 0, function* () { return yield x.isProtocolMessage(params.message); }));
            const results = yield Promise.all(promises);
            const vcProtocol = this.vcProtocols[results.indexOf(true)];
            if (!vcProtocol) {
                throw new vc_protocol_not_found_1.VCProtocolNotFoundError();
            }
            const response = yield vcProtocol.processMessage(params.message, params.contextMessage, params.did);
            if (!params.did) {
                if (typeof params.message === "string") {
                    const oobMessage = params.message.substring(params.message.indexOf("_oob=") + 5);
                    const decodedMessage = JSON.parse((0, base_64_1.decode)(oobMessage));
                    params.did = decodedMessage.to ? did_1.DID.from(decodedMessage.to) : this.identity.getOperationalDID();
                }
                else {
                    if (!params.message.to || params.message.to.length == 0) {
                        params.did = this.identity.getOperationalDID();
                    }
                    else {
                        const did = this.identity.getDIDs().find(x => params.message.to.some(y => y == x));
                        params.did = did ? did_1.DID.from(did) : null;
                    }
                }
            }
            if (response) {
                yield this.transports.sendMessage({
                    message: response.message,
                    to: response.to,
                    from: params.did,
                    messageContext: params.contextMessage,
                    preferredTransport: params.transport
                });
            }
        });
    }
    getValidVerificationMethodSigner(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let publicKeys;
            if (!params.publicKey) {
                const bbsblsKeys = yield this.kms.getPublicKeysBySuiteType(params.suiteType);
                if (bbsblsKeys.length == 0) {
                    throw new Error("KMS doesn't contains keys for bbsbls2020. You need to create this kind of keys to sign verifiable credentials");
                }
                publicKeys = bbsblsKeys;
            }
            else {
                publicKeys = [params.publicKey];
            }
            const didDocument = yield this.resolver.resolve(params.did);
            const validPublicKeys = didDocument.verificationMethod.filter(x => x.type == (0, kms_core_1.getTypeBySuite)(params.suiteType));
            //Comienzo a comparar las claves que estan en el DID Document con las que tiene el KMS hasta encontrar un match
            const firstValidPbk = validPublicKeys.find(didDocKey => {
                const jKey = JSON.stringify(didDocKey.publicKeyJwk);
                return publicKeys.some(kmsKey => JSON.stringify(kmsKey) === jKey);
            });
            // Si el DID Document no contiene la clave, el agente no debería firmar ya que hay un error.
            if (!firstValidPbk) {
                throw Error("There aren't public keys valid to use based on Issuer DID Document and KMS secrets");
            }
            return firstValidPbk;
        });
    }
    deriveVC(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.vc)
                throw new Error("params.vc is required for deriveVC");
            if (!params.deriveProofFrame)
                throw new Error("params.deriveProofFrame is required for deriveVC");
            const derivedVc = this.kms.deriveVC({
                frame: params.deriveProofFrame,
                vc: params.vc
            });
            return derivedVc;
        });
    }
}
exports.VC = VC;
//# sourceMappingURL=vc.js.map
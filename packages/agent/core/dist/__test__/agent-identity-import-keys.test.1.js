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
// import { VerifiableCredential } from "@extrimian/vc-core";
const kms_client_1 = require("@extrimian/kms-client");
const kms_core_1 = require("@extrimian/kms-core");
const src_1 = require("../src");
const agent_1 = require("../src/agent");
const agent_registry_1 = require("../src/models/agent-registry");
const waci_protocol_1 = require("../src/vc/protocols/waci-protocol");
const config_1 = require("./config");
const memory_storage_1 = require("./mock/memory-storage");
const vc = require('./mock/vc.json');
jest.setTimeout(1000000);
let agent;
let waciProtocol;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    waciProtocol = new waci_protocol_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage()
    });
    agent = new agent_1.Agent({
        didDocumentRegistry: new agent_registry_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new memory_storage_1.MemoryStorage(),
        secureStorage: new memory_storage_1.MemoryStorage(),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [waciProtocol],
        // supportedTransports: [new DWNTransport()],
    });
    yield agent.initialize();
    const kms = new kms_client_1.KMSClient({
        lang: kms_core_1.LANG.es,
        storage: new memory_storage_1.MemoryStorage(),
    });
    const bbsKey = yield kms.create(kms_core_1.Suite.Bbsbls2020);
    const bbsKeySecrets = yield kms.export(bbsKey.publicKeyJWK);
    yield agent.identity.createNewDID({
        preventCredentialCreation: true,
        keysToImport: [{
                id: "test-key",
                publicKeyJWK: bbsKey.publicKeyJWK,
                secrets: bbsKeySecrets,
                vmKey: agent_registry_1.VMKey.VC
            }]
    });
    const awaitDIDCreation = new Promise((resolve, reject) => {
        agent.identity.didCreated.on((args) => {
            resolve();
        });
    });
    yield awaitDIDCreation;
}));
describe('Keys To Import Test', () => {
    it('Keys to use', () => __awaiter(void 0, void 0, void 0, function* () {
        const didDoc = yield agent.resolver.resolve(agent.identity.getOperationalDID());
        const vm = didDoc.verificationMethod.find(x => x.id.indexOf("test-key") > -1);
        expect(vm).not.toBeNull();
    }));
    it('Sign with Key', () => __awaiter(void 0, void 0, void 0, function* () {
        const vcSigned = yield agent.vc.signVC({
            credential: vc
        });
        expect(vcSigned.proof.verificationMethod).toContain("test-key");
        const result = yield agent.vc.verifyVC({
            vc: vcSigned
        });
        expect(result.result).toBeTruthy();
    }));
});
//# sourceMappingURL=agent-identity-import-keys.test.1.js.map
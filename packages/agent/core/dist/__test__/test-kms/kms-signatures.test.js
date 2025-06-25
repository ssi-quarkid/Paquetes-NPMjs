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
const src_1 = require("../../src");
const agent_1 = require("../../src/agent");
const agent_kms_1 = require("../../src/models/agent-kms");
const waci_protocol_1 = require("../../src/vc/protocols/waci-protocol");
const config_1 = require("../config");
const filesystem_secure_storage_1 = require("../mock/filesystem-secure-storage");
const filesystme_storage_1 = require("../mock/filesystme-storage");
const memory_storage_1 = require("../mock/memory-storage");
jest.setTimeout(1000000);
let agent;
let otherAgent;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const wp = new waci_protocol_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
    });
    agent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data-mock/kms-signature-agent-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/kms-signature-agent-secure-storage.json',
        }),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [wp],
        supportedTransports: [],
    });
    yield agent.initialize();
    otherAgent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data-mock/kms-signature-other-agent-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/kms-signature-other-agent-secure-storage.json',
        }),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [wp],
        supportedTransports: [],
    });
    yield otherAgent.initialize();
    // let ent = new Promise<void>(async (resolve, reject) => {
    //     otherAgent.identity.didCreated.on(did => { resolve() });
    // });
    // await otherAgent.identity.createNewDID({
    //     createDefaultKeys: true,
    //     keysToCreate: [
    //         { id: "es256k", vmKey: VMKey.ES256k },
    //     ],
    // });
    // await ent;
}));
afterAll(() => {
    agent.transport.transports.forEach(x => x.dispose());
});
describe('JWSignatures', () => {
    it("Signature and Verification Test", () => __awaiter(void 0, void 0, void 0, function* () {
        const content = "This is the content to sign";
        const r = yield agent.agentKMS.signMessage({ content });
        console.log(r);
        const result = yield agent.agentKMS.verifyMessage({
            content,
            verificationMethodId: r.verificationMethodId,
            signature: r.signature
        });
        expect(result.verified).toBeTruthy();
    }));
    it("Invalid Content Test", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield agent.agentKMS.signMessage({ content: "This is the content to sign" });
        console.log(r);
        const result = yield agent.agentKMS.verifyMessage({
            content: "Invalid content to verify",
            verificationMethodId: r.verificationMethodId,
            signature: r.signature
        });
        expect(result.verified).toBeFalsy();
        if (result.verified == false) {
            expect(result.result).toBe(agent_kms_1.VerifiyJWSResult.InvalidSignature);
            // expect(result.signedContent).toBe("This is the content to sign");
        }
    }));
    it("Invalid Signature Test", () => __awaiter(void 0, void 0, void 0, function* () {
        const content = "This is the content to sign";
        const r = yield agent.agentKMS.signMessage({ content });
        r.signature = r.signature.substring(0, 20) + "content" + r.signature.substring(20);
        const result = yield agent.agentKMS.verifyMessage({
            content,
            verificationMethodId: r.verificationMethodId,
            signature: r.signature
        });
        expect(result.verified).toBeFalsy();
        if (result.verified == false) {
            expect(result.result).toBe(agent_kms_1.VerifiyJWSResult.UnexpectedError);
        }
    }));
    it("Invalid Signature for other verification method id Test", () => __awaiter(void 0, void 0, void 0, function* () {
        const content = "This is the content to sign";
        const r = yield agent.agentKMS.signMessage({ content });
        const r2 = yield otherAgent.agentKMS.signMessage({ content });
        const result = yield agent.agentKMS.verifyMessage({
            content,
            verificationMethodId: r.verificationMethodId,
            signature: r2.signature
        });
        expect(result.verified).toBeFalsy();
        if (result.verified == false) {
            expect(result.result).toBe(agent_kms_1.VerifiyJWSResult.InvalidSignature);
        }
    }));
});
//# sourceMappingURL=kms-signatures.test.js.map
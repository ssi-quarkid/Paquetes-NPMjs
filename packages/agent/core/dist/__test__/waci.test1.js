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
const src_1 = require("../src");
const agent_1 = require("../src/agent");
const config_1 = require("./config");
const memory_storage_1 = require("./mock/memory-storage");
const filesystme_storage_1 = require("./mock/filesystme-storage");
const filesystem_secure_storage_1 = require("./mock/filesystem-secure-storage");
const base_64_1 = require("base-64");
const credentialToSign = require('./mock/vc.json');
// import {
//   Agent,
//   AgentModenaUniversalRegistry,
//   AgentModenaUniversalResolver,
//   VerifiableCredential,
//   WACIProtocol,
// } from '../dist';
jest.setTimeout(1000000);
let agent;
let didPublished;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
    agent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data-mock/agent-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/agent-secure-storage.json',
        }),
        vcStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data-mock/agent-vc-storage.json',
        }),
        vcProtocols: [new src_1.WACIProtocol({
                storage: new memory_storage_1.MemoryStorage(),
            })],
        supportedTransports: [],
    });
    yield agent.initialize();
}));
afterAll(() => {
    agent.transport.transports.forEach(x => x.dispose());
});
describe('WACI Test', () => {
    it('Create Issuer Invitation Message', () => __awaiter(void 0, void 0, void 0, function* () {
        // console.log("bb");
        const message = yield agent.vc.createInvitationMessage({
            flow: src_1.CredentialFlow.Issuance,
            did: src_1.DID.from("did:quarkid:zksync:EiAg5whxpppkIBbmLgzUBxssjNsF2fRZxYmO4bq6t5s-DQ"),
        });
        const decoded = (0, base_64_1.decode)(message.replace("didcomm://?_oob=", ""));
        const decodedMessage = JSON.parse(decoded);
        expect(decodedMessage.from == "did:quarkid:zksync:EiAg5whxpppkIBbmLgzUBxssjNsF2fRZxYmO4bq6t5s-DQ");
    }));
});
//# sourceMappingURL=waci.test1.js.map
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
const waci_protocol_1 = require("../../src/vc/protocols/waci-protocol");
const config_1 = require("../config");
const filesystem_secure_storage_1 = require("../mock/filesystem-secure-storage");
const filesystme_storage_1 = require("../mock/filesystme-storage");
const memory_storage_1 = require("../mock/memory-storage");
const transport_mock_1 = require("../mock/transport-mock");
const credential_presentation_1 = require("./credential-presentation");
const credential_issuance_1 = require("./credential-issuance");
const issue_for_not_operational_1 = require("./issue-for-not-operational");
const waci_protocol_helper_1 = require("../helpers/waci-protocol-helper");
jest.setTimeout(1000000);
let issuerAgent;
let holderAgent;
let waciProtocol;
let holderResolve;
const holder = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    holderResolve = resolve;
}));
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    issuerAgent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data-mock/agent-issuer-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/agent-issuer-secure-storage.json',
        }),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [(0, waci_protocol_helper_1.getIssuerWACIProtocol)()],
        supportedTransports: [new transport_mock_1.TransportMock()],
    });
    yield issuerAgent.initialize();
    const holderWaciProtocol = new waci_protocol_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
        holder: {
            credentialApplication: (inputs, selectiveDisclosure, message, issuer, credentialsToReceive) => __awaiter(void 0, void 0, void 0, function* () {
                return inputs.length == 0 || inputs[0].credentials.length == 0 ? null : [inputs[0].credentials[0].data];
            })
        },
    });
    holderAgent = new agent_1.Agent({
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
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new transport_mock_1.TransportMock()],
    });
    yield holderAgent.initialize();
}));
afterAll(() => {
    issuerAgent.transport.transports.forEach(x => x.dispose());
    holderAgent.transport.transports.forEach(x => x.dispose());
});
describe('Verifiable Credentials', () => {
    it("Credential Presentation: Holder wait and process message again", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, credential_presentation_1.credentialPresentation)(holderAgent, issuerAgent);
    })),
        it("Credential Presentation: Holder wait and process message again", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, credential_issuance_1.credentialIssuance)(holderAgent, issuerAgent);
        })),
        it("Credential Issue for not Operational DID (using other dids of agent but not the operational DIDs)", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, issue_for_not_operational_1.credentialIssueForNotOperationalDID)(holderAgent, issuerAgent);
        }));
});
//# sourceMappingURL=test-vc.index.test.js.map
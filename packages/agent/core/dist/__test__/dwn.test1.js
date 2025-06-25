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
const waci_protocol_1 = require("../src/vc/protocols/waci-protocol");
const config_1 = require("./config");
const filesystem_secure_storage_1 = require("./mock/filesystem-secure-storage");
const filesystme_storage_1 = require("./mock/filesystme-storage");
const memory_storage_1 = require("./mock/memory-storage");
jest.setTimeout(1000000);
let holderAgent;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
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
            filepath: './__test__/data-dev/dev-storage.json',
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: './__test__/data-dev/dev-secure-storage.json',
        }),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new src_1.WebsocketClientTransport()],
    });
    yield holderAgent.initialize();
    if (!holderAgent.identity.getOperationalDID()) {
        const wait = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            holderAgent.identity.didCreated.on(() => {
                resolve();
            });
        }));
        yield holderAgent.identity.createNewDID();
        yield wait;
    }
    // const wait = new Promise<void>((resolve) => {
    //     setTimeout(() => {
    //         resolve();
    //     }, 20000);
    // });
    // await wait;
}));
afterAll(() => {
    holderAgent.transport.transports.forEach(x => x.dispose());
});
describe('Verifiable Credentials', () => {
    it("Credential Presentation: Holder wait and process message again", () => __awaiter(void 0, void 0, void 0, function* () {
        const waitCredentialArrived = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            holderAgent.vc.credentialArrived.on((args) => {
                console.log(args);
                // resolve();
            });
            holderAgent.vc.ackCompleted.on((args) => {
                // args.
            });
            yield holderAgent.processMessage({
                message: "extrimian://?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNmM4MThlYjMtYjcyOS00MmVhLTk5YmMtZmJmZTk2ZWE0MzdjIiwiZnJvbSI6ImRpZDpxdWFya2lkOnprc3luYzpFaURPR3RPVW9Zb3JrZjIwZzFITnc3Yl9LMHVtMzJPSi1WeEtacS1OdGI5cWZBIiwiYm9keSI6eyJnb2FsX2NvZGUiOiJzdHJlYW1saW5lZC12YyIsImFjY2VwdCI6WyJkaWRjb21tL3YyIl19fQ=="
            });
        }));
        yield waitCredentialArrived;
    }));
});
//# sourceMappingURL=dwn.test1.js.map
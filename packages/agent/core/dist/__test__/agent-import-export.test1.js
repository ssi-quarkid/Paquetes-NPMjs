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
const agent_1 = require("../src/agent");
const src_1 = require("../src");
const memory_storage_1 = require("./mock/memory-storage");
const src_2 = require("../src");
const config_1 = require("./config");
const filesystme_storage_1 = require("./mock/filesystme-storage");
const filesystem_secure_storage_1 = require("./mock/filesystem-secure-storage");
const credentialToSign = require("./mock/vc.json");
jest.setTimeout(1000000);
let agent;
let exportedData;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    //El agente necesita preconfigurar protocolos de intercambio de credenciales. En este instante se debe configurar también las credenciales que emitirá este agente.
    //Como este agente de test no va a emitir credenciales, no es necesario configurar el WACIProtocol, por eso se deja en blanco su constructor.
    const waciProtocol = new src_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
    });
    //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
    agent = new agent_1.Agent({
        didDocumentRegistry: new src_2.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_2.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: "./__test__/data/agent-issuer-storage.json"
        }),
        secureStorage: new filesystem_secure_storage_1.FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-issuer-secure-storage.json"
        }),
        vcStorage: new memory_storage_1.MemoryStorage(),
        vcProtocols: [waciProtocol],
        supportedTransports: [new src_1.DWNTransport()]
    });
    //Siempre, en primer lugar, se debe inicializar el agente para comenzar a operar. Esto configura clases internas que son requeridas para funcionar.
    yield agent.initialize();
}));
afterAll(() => {
    agent === null || agent === void 0 ? void 0 : agent.transport.transports.forEach(x => x.dispose());
});
describe("Agent Identity", () => {
    it("Export Identity", () => __awaiter(void 0, void 0, void 0, function* () {
        //Lo primero que se debe hacer con un agente nuevo, es crear su DID. Si el agente ya se corrió en estas instancias, no es necesario crear uno nuevo.
        const did = yield agent.identity.createNewDID({});
        const createDIDResult = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                //El agente emitirá un evento cuando el DID creado esté listo para usar. Esto puede tardar un tiempo, ya que la creación del DID es asyncrónica.
                agent.identity.didCreated.on((args) => __awaiter(void 0, void 0, void 0, function* () {
                    expect(args.did).toEqual(did);
                    resolve();
                }));
            });
        });
        yield createDIDResult();
        exportedData = yield agent.identity.exportKeys({
            exportBehavior: new src_1.IdentityPlainTextDataShareBehavior()
        });
        expect(exportedData.type == "plain-text");
    })),
        it("Import Agent Data", () => __awaiter(void 0, void 0, void 0, function* () {
            const waciProtocol = new src_1.WACIProtocol({
                storage: new memory_storage_1.MemoryStorage(),
            });
            let newAgent = new agent_1.Agent({
                didDocumentRegistry: new src_2.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
                didDocumentResolver: new src_2.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
                agentStorage: new memory_storage_1.MemoryStorage(),
                secureStorage: new memory_storage_1.MemorySecureStorage(),
                vcStorage: new memory_storage_1.MemorySecureStorage(),
                vcProtocols: [waciProtocol],
            });
            yield newAgent.initialize();
            yield newAgent.identity.importKeys({
                exportResult: exportedData,
                exportBehavior: new src_1.IdentityPlainTextDataShareBehavior(),
            });
            const publicKeys = yield newAgent.kms.getAllPublicKeys();
            const otherPbks = yield agent.kms.getAllPublicKeys();
            expect(otherPbks.length).toEqual(publicKeys.length);
            expect(JSON.stringify(publicKeys)).toEqual(JSON.stringify(otherPbks));
            console.log(publicKeys);
            agent.transport.transports.forEach(x => x.dispose());
            agent = null;
            const unsignedVc = credentialToSign;
            console.log(unsignedVc);
            const vc = yield newAgent.vc.signVC({
                credential: unsignedVc
            });
            console.log(vc);
            expect(vc.proof).not.toBeNull();
            newAgent.transport.transports.forEach(x => x.dispose());
            newAgent = null;
        }));
});
//# sourceMappingURL=agent-import-export.test1.js.map
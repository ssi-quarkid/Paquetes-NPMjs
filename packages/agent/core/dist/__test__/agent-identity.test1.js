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
const did_core_1 = require("@extrimian/did-core");
const src_1 = require("../src");
const agent_1 = require("../src/agent");
const config_1 = require("./config");
const memory_storage_1 = require("./mock/memory-storage");
const index_1 = require("../../plugins/one-click/src/index");
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
    //El agente necesita preconfigurar protocolos de intercambio de credenciales. En este instante se debe configurar también las credenciales que emitirá este agente.
    //Como este agente de test no va a emitir credenciales, no es necesario configurar el WACIProtocol, por eso se deja en blanco su constructor.
    const waciProtocol = new src_1.WACIProtocol({
        storage: new memory_storage_1.MemoryStorage(),
        holder: {
            selectVcToPresent: (vcs) => __awaiter(void 0, void 0, void 0, function* () {
                return [];
            }),
        },
    });
    const didDocumentRegistry = new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl);
    //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
    agent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new memory_storage_1.MemoryStorage(),
        secureStorage: new memory_storage_1.MemoryStorage(),
        vcStorage: new memory_storage_1.MemoryStorage(),
        agentPlugins: [new index_1.OneClickPlugin()],
        // agentStorage: new FileSystemStorage({
        //     filepath: "./__test__/data/agent-issuer-storage-2.json"
        // }),
        // secureStorage: new FileSystemAgentSecureStorage({
        //     filepath: "./__test__/data/agent-issuer-secure-storage-2.json"
        // }),
        // vcStorage: new MemoryStorage(),
        vcProtocols: [waciProtocol],
    });
    //Siempre, en primer lugar, se debe inicializar el agente para comenzar a operar. Esto configura clases internas que son requeridas para funcionar.
    yield agent.initialize();
    // const wait = async () => new Promise<void>((resolve, reject) => {
    //     setTimeout(() => {
    //         resolve();
    //     }, 20000);
    // });
    // await wait();
}));
afterAll(() => {
    agent.transport.transports.forEach(x => x.dispose());
});
describe('Agent New Identity', () => {
    it('Create new Identity', () => __awaiter(void 0, void 0, void 0, function* () {
        //Lo primero que se debe hacer con un agente nuevo, es crear su DID. Si el agente ya se corrió en estas instancias, no es necesario crear uno nuevo.
        const createDIDResult = () => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                //El agente emitirá un evento cuando el DID creado esté listo para usar. Esto puede tardar un tiempo, ya que la creación del DID es asyncrónica.
                agent.identity.didCreated.on((args) => __awaiter(void 0, void 0, void 0, function* () {
                    expect(args.did).toEqual(did);
                    const didDocument = yield agent.resolver.resolve(did);
                    // expect(didDocument.service.find(x => x.serviceEndpoint == dwnUrl && x.type == "DecentralizedWebNode")).not.toBeNull();
                    expect(didDocument.verificationMethod.find((x) => x.type == did_core_1.VerificationMethodTypes.X25519KeyAgreementKey2019)).not.toBeNull();
                    expect(didDocument.verificationMethod.find((x) => x.type == did_core_1.VerificationMethodTypes.Bls12381G1Key2020)).not.toBeNull();
                    expect(didDocument.verificationMethod.find((x) => x.type == did_core_1.VerificationMethodTypes.RsaVerificationKey2018)).not.toBeNull();
                    didPublished = true;
                    // resolve();
                }));
                const did = yield agent.identity.createNewDID({
                // dwnUrl: dwnUrl
                });
                const longDID = agent.identity.getOperationalDID();
                expect(longDID.isLongDID()).toBeTruthy();
                expect(longDID.value.indexOf(did.value)).not.toEqual(-1);
                expect(agent.identity.getOperationalDID().isEqual(did));
                resolve();
            }));
        });
        yield createDIDResult();
    })),
        it('Sign VC', () => __awaiter(void 0, void 0, void 0, function* () {
            const vc = yield agent.vc.signVC({
                credential: credentialToSign,
            });
            const longDID = agent.identity.getOperationalDID();
            expect(longDID.isLongDID());
            //Mientras el DID no este publicado, se debe usar el long DID para firmar (debe estar seteado como el OperationalDID)
            expect(vc.proof.verificationMethod.indexOf(longDID.value)).not.toEqual(-1);
            const isValid = yield agent.vc.verifyVC({
                vc: vc,
            });
            //La VC debe poder ser verificada aunque se este usando el LongDID.
            expect(isValid.result).toBeTruthy();
        })),
        it('DID Published', () => __awaiter(void 0, void 0, void 0, function* () {
            if (!didPublished) {
                const waitDidPublish = new Promise((resolve, reject) => {
                    const interval = setInterval(() => {
                        if (didPublished) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 1000);
                });
                yield waitDidPublish;
            }
            //Si el DID se publica, el operationalDID debe pasar a ser el publicado
            expect(agent.identity.getOperationalDID().isLongDID()).toBeFalsy();
        }));
});
//# sourceMappingURL=agent-identity.test1.js.map
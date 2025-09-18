// import { VerifiableCredential } from "@quarkid/vc-core";
import { Agent } from "../src/agent";
import { DWNTransport, IdentityPlainTextDataShareBehavior, WACIProtocol } from "../src";
import { MemorySecureStorage, MemoryStorage } from "./mock/memory-storage";
import { VerificationMethodTypes } from "@quarkid/did-core";
import { AgentModenaUniversalRegistry, AgentModenaUniversalResolver } from "../src";
import { TestConfig } from "./config";
import { FileSystemStorage } from "./mock/filesystme-storage";
import { FileSystemAgentSecureStorage } from "./mock/filesystem-secure-storage";
const credentialToSign = require("./mock/vc.json");

jest.setTimeout(1000000);

let agent: Agent;

let exportedData: { data: string, type: string };

beforeAll(async () => {

    //El agente necesita preconfigurar protocolos de intercambio de credenciales. En este instante se debe configurar también las credenciales que emitirá este agente.
    //Como este agente de test no va a emitir credenciales, no es necesario configurar el WACIProtocol, por eso se deja en blanco su constructor.
    const waciProtocol = new WACIProtocol({
        storage: new MemoryStorage(),
    });

    //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
    agent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(TestConfig.modenaUrl, TestConfig.defaultDIDMethod),
        didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
        agentStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-issuer-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-issuer-secure-storage.json"
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [waciProtocol],
        supportedTransports: [new DWNTransport()]
    });

    //Siempre, en primer lugar, se debe inicializar el agente para comenzar a operar. Esto configura clases internas que son requeridas para funcionar.
    await agent.initialize();
});

afterAll(() => {
    agent?.transport.transports.forEach(x => x.dispose());
});

describe("Agent Identity", () => {
    it("Export Identity", async () => {
        //Lo primero que se debe hacer con un agente nuevo, es crear su DID. Si el agente ya se corrió en estas instancias, no es necesario crear uno nuevo.
        const did = await agent.identity.createNewDID({
        });

        const createDIDResult = async () => new Promise<void>((resolve, reject) => {
            //El agente emitirá un evento cuando el DID creado esté listo para usar. Esto puede tardar un tiempo, ya que la creación del DID es asyncrónica.
            agent.identity.didCreated.on(async args => {
                expect(args.did).toEqual(did);
                resolve();
            });
        });

        await createDIDResult();

        exportedData = await agent.identity.exportKeys({
            exportBehavior: new IdentityPlainTextDataShareBehavior()
        });

        expect(exportedData.type == "plain-text")
    }),

        it("Import Agent Data", async () => {
            const waciProtocol = new WACIProtocol({
                storage: new MemoryStorage(),
            });

            let newAgent = new Agent({
                didDocumentRegistry: new AgentModenaUniversalRegistry(TestConfig.modenaUrl, TestConfig.defaultDIDMethod),
                didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
                agentStorage: new MemoryStorage(),
                secureStorage: new MemorySecureStorage(),
                vcStorage: new MemorySecureStorage(),
                vcProtocols: [waciProtocol],
            });

            await newAgent.initialize();

            await newAgent.identity.importKeys({
                exportResult: exportedData,
                exportBehavior: new IdentityPlainTextDataShareBehavior(),
            });

            const publicKeys = await newAgent.kms.getAllPublicKeys();

            const otherPbks = await agent.kms.getAllPublicKeys();

            expect(otherPbks.length).toEqual(publicKeys.length);
            expect(JSON.stringify(publicKeys)).toEqual(JSON.stringify(otherPbks));

            console.log(publicKeys);

            agent.transport.transports.forEach(x => x.dispose());

            agent = null;

            const unsignedVc = credentialToSign;
            console.log(unsignedVc);

            const vc = await newAgent.vc.signVC({
                credential: unsignedVc
            });

            console.log(vc);
            expect(vc.proof).not.toBeNull();

            newAgent.transport.transports.forEach(x => x.dispose());
            newAgent = null;
        });
});

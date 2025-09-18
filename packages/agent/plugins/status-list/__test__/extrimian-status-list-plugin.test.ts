// import { VerifiableCredential } from "@quarkid/vc-core";
import { AgentModenaUniversalRegistry, AgentModenaUniversalResolver, DWNTransport, Agent, WACIProtocol, AgentModenaRegistry, AgentModenaResolver, CredentialFlow } from "@quarkid/agent";
import { MemoryStorage } from "./mock/memory-storage";
import { FileSystemStorage } from "./mock/filesystme-storage";
import { FileSystemAgentSecureStorage } from "./mock/filesystem-secure-storage";
import { ExtrimianStatusListAgentPlugin } from "../src/index";
import { getIssuerWACIProtocol } from "./helpers/waci-protocol-helper";
import { MockTransport } from "./mock/transport-mock";

jest.setTimeout(1000000);

let issuerAgent: Agent;
let holderAgent: Agent;
let waciProtocol: WACIProtocol;

beforeAll(async () => {
    waciProtocol = new WACIProtocol({
        storage: new MemoryStorage(),
    });

    const didDocumentRegistry = new AgentModenaRegistry("https://cadena-aduana-a.extrimian.com/sidetree/", "did:cadena:lacnet")
    // didDocumentRegistry.setDefaultDIDMethod("did:quarkid")

    issuerAgent = new Agent({
        didDocumentRegistry: didDocumentRegistry,
        didDocumentResolver: new AgentModenaResolver("https://cadena-aduana-a.extrimian.com/sidetree/"),
        agentStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-issuer-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-issuer-secure-storage.json"
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [getIssuerWACIProtocol()],
        supportedTransports: [new MockTransport()],
        credentialStatusPlugins: [new ExtrimianStatusListAgentPlugin({
            bitArraySC: '0xde2b7414e2918a393b59fc130bceb75c3ee52493',
            pluginStorage: new FileSystemStorage({ filepath: 'vcsl.json'}),
            vslApiURL: 'http://35.221.5.84:4242'
        })]
    });

    await issuerAgent.initialize();

    issuerAgent.vc.credentialIssued.on((args) => {
        console.log(args);
    });

    const holderWaciProtocol = new WACIProtocol({
        storage: new MemoryStorage(),
        holder: {
            credentialApplication: async (inputs,
                selectiveDisclosure,
                message?,
                issuer?,
                credentialsToReceive?) => {
                return inputs.length == 0 || inputs[0].credentials.length == 0 ? null : [inputs[0].credentials[0].data];
            }
        },
    });

    const didDocumentRegistry2 = new AgentModenaRegistry("https://cadena-aduana-a.extrimian.com/sidetree/", "did:cadena:lacnet")
    // didDocumentRegistry2.setDefaultDIDMethod("did:quarkid")


    holderAgent = new Agent({
        didDocumentRegistry: didDocumentRegistry2,
        didDocumentResolver: new AgentModenaResolver("https://cadena-aduana-a.extrimian.com/sidetree/"),

        agentStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-holder-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-holder-secure-storage.json"
        }),
        vcStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-holder-vc-storage.json",
        }),
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new MockTransport()],
    });

    await holderAgent.initialize();

    // const wait = async () => new Promise<void>((resolve, reject) => {
    //     setTimeout(() => {
    //         resolve();
    //     }, 15 * 1000);
    // });

    // await wait();
})

describe("One Click Plugin", () => {
    it("Complete Flow", async () => {
        const processMessage = async () =>
            new Promise(async (resolve, reject) => {
                holderAgent.vc.credentialArrived.on(async (vc) => {
                    await Promise.all(vc.credentials.map(async v => {
                        await holderAgent.vc.saveCredentialWithInfo(v.data, {
                            display: v.display,
                            styles: v.styles
                        });
                        expect(v?.data.id).toEqual('http://example.edu/credentials/58473');

                        const result = await holderAgent.vc.verifyVC({
                            vc: v.data,
                        });

                        expect(result.result).toBe(true);
                    }))
                });

                await holderAgent.vc.processMessage({
                    message: await issuerAgent.vc.createInvitationMessage({ flow: CredentialFlow.Issuance }),
                });
            });

        await processMessage();
    });
});



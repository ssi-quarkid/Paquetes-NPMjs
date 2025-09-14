// import { VerifiableCredential } from "@quarkid/vc-core";
import { VerifiableCredential } from "@quarkid/vc-core";
import { AgentModenaUniversalRegistry, AgentModenaUniversalResolver, DWNTransport, CredentialFlow, Agent, WACICredentialOfferSucceded, WACIProtocol } from "@quarkid/agent";
import { MemoryStorage } from "./mock/memory-storage";
import { FileSystemStorage } from "./mock/filesystme-storage";
import { FileSystemAgentSecureStorage } from "./mock/filesystem-secure-storage";
import { OneClickPlugin } from "../src/index";
import { OneClickSDK } from "@quarkid/oneclick-sdk";
import * as readline from 'readline';

jest.setTimeout(1000000);

let issuerAgent: Agent;
let holderAgent: Agent;
let waciProtocol: WACIProtocol;


function waitForYes(messageId:string , did:string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    return new Promise<boolean>((resolve) => {
      rl.question(`oob login started from: ${did} Write yes if you would like to proceed`, (answer) => {
        rl.close();
        console.log("you wrote: " , answer.trim())
        resolve(answer.trim().toLowerCase() === 'yes');
      });
    });
  }
  
  

let oneClickIssuer = new OneClickPlugin(new MemoryStorage(),
                     new MemoryStorage() , 
                     async (invitationId:string , did: string , sdk : OneClickSDK ) => false);
let oneClickHolder = new OneClickPlugin(new MemoryStorage(), new MemoryStorage(), 
async (invitationId:string , did: string , sdk :OneClickSDK ) => await waitForYes(invitationId , did)
);

beforeAll(async () => {
    waciProtocol = new WACIProtocol({
        storage: new MemoryStorage(),
    });

    const didDocumentRegistry = new AgentModenaUniversalRegistry("https://demo.extrimian.com/sidetree-proxy")
    didDocumentRegistry.setDefaultDIDMethod("did:quarkid:zksync")

    issuerAgent = new Agent({
        didDocumentRegistry: didDocumentRegistry,
        didDocumentResolver: new AgentModenaUniversalResolver("https://demo.extrimian.com/sidetree-proxy"),
        agentStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-issuer-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-issuer-secure-storage.json"
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [waciProtocol],
        supportedTransports: [new DWNTransport()],
        agentPlugins: [oneClickIssuer]
    });

    await issuerAgent.initialize();



    issuerAgent.vc.credentialIssued.on((args) => {
        console.log(args);
    });

    const holderWaciProtocol = new WACIProtocol({
        storage: new MemoryStorage(),
    });

    const didDocumentRegistry2 = new AgentModenaUniversalRegistry("https://demo.extrimian.com/sidetree-proxy")
    didDocumentRegistry.setDefaultDIDMethod("did:quarkid:zksync")


    holderAgent = new Agent({
        
        //a
        didDocumentRegistry: didDocumentRegistry2,
        didDocumentResolver: new AgentModenaUniversalResolver("https://demo.extrimian.com/sidetree-proxy"),

        agentStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-holder-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./__test__/data/agent-holder-secure-storage.json"
        }),
        
        //c
        vcStorage: new FileSystemStorage({
            filepath: "./__test__/data/agent-holder-vc-storage.json",
        }),
        vcProtocols: [holderWaciProtocol],
        
        //d
        supportedTransports: [new DWNTransport()],
        agentPlugins: [oneClickHolder]
    });

    await holderAgent.initialize();


    const wait = async () => new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 15*1000);
    });

    await wait();
})

describe("One Click Plugin", () => {
    it("Complete Flow", async () => {

        const processMessage = async () => new Promise<void>(async (resolve, reject) => {

            oneClickIssuer.loginStarted.on((data) => console.log('ISSUER: LoginStarted', data));
            oneClickIssuer.userLoggedIn.on((data) => { console.log('ISSUER: User LoggedIn', data); });

            oneClickHolder.loginStarted.on((data) => console.log('HOLDER: LoginStarted', data));
            oneClickHolder.userLoggedIn.on((data) => { console.log('HOLDER: User LoggedIn', data); resolve() });

            const message = await oneClickIssuer.createInvitationMessage();

            const valcharM = {"id":"856aa9ca-f390-4c1e-b7b8-0a46a09f8d1f","type":"extrimian/did-authentication/oob","from":"did:quarkid:zksync:EiD01POhKs6zjhXhJEW54IU9q0ox-hzwWZm_E9D8oo0Wzw","body":{"goalCode":"extrimian/did-authentication/signin"}}

            await holderAgent.processMessage({
                message: valcharM
            });
        });

        await processMessage();

        const promise = new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500000);
        })

        await promise;
    })
});



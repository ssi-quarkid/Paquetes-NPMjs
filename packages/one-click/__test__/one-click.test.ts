// import { VerifiableCredential } from "@quarkid/vc-core";
import { Agent, WACIProtocol, AgentModenaUniversalRegistry, AgentModenaUniversalResolver, DID } from "@quarkid/agent";
import { MemoryStorage } from "./mock/memory-storage";
import { FileSystemStorage } from "./mock/filesystme-storage";
import { FileSystemAgentSecureStorage } from "./mock/filesystem-secure-storage";
import { OneClickSDK } from "../src/oneclick-sdk";

// const credentialToSign = require("./mock/vc.json");

jest.setTimeout(1000000);

const dwnUrl = "http://ssi.gcba-extrimian.com:1337";
let issuerAgent: Agent;
let packedMessage;

describe("OneClick Login", () =>
    it("Flow test", async () => {
        const waciProtocol = new WACIProtocol({
            storage: new MemoryStorage(),
        });
        

        //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
        issuerAgent = new Agent({
            didDocumentRegistry: new AgentModenaUniversalRegistry("https://demo.extrimian.com/sidetree-proxy", 'did:quarkid:matic'),
            didDocumentResolver: new AgentModenaUniversalResolver("https://demo.extrimian.com/sidetree-proxy"),
            agentStorage: new FileSystemStorage({
                filepath: "./__test__/data/agent-issuer-storage.json"
            }),
            secureStorage: new FileSystemAgentSecureStorage({
                filepath: "./__test__/data/agent-issuer-secure-storage.json"
            }),
            vcStorage: new MemoryStorage(),
            vcProtocols: [waciProtocol],
            supportedTransports: []
        });

        await issuerAgent.initialize();


        const waciProtocol2 = new WACIProtocol({
            storage: new MemoryStorage(),
        });

        //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
        const holderAgent = new Agent({
            didDocumentRegistry: new AgentModenaUniversalRegistry("https://demo.extrimian.com/sidetree-proxy", 'did:quarkid:matic'),
            didDocumentResolver: new AgentModenaUniversalResolver("https://demo.extrimian.com/sidetree-proxy" ),
            agentStorage: new FileSystemStorage({
                filepath: "./__test__/data/agent-holder-storage.json"
            }),
            secureStorage: new FileSystemAgentSecureStorage({
                filepath: "./__test__/data/agent-holder-secure-storage.json"
            }),
            vcStorage: new MemoryStorage(),
            vcProtocols: [waciProtocol2],
            supportedTransports: []
        });

        await holderAgent.initialize();


        let clientStorage: any = [];
        let serverStorage: any = [];

        //step 1
        const issuerOneClickSDK = new OneClickSDK(issuerAgent.identity.getOperationalDID().value,
            (to: string, message) => issuerAgent.messaging.packMessage(
                {
                    to: DID.from(to),
                    message
                }),
            (message) => issuerAgent.messaging.unpackMessage({ message })
            ,new MemoryStorage(),new MemoryStorage());

        const oob = await issuerOneClickSDK.createInvitationMessage();

        console.log("did:" , holderAgent.identity.getOperationalDID().value)
            
        const holderOneClickSDK = new OneClickSDK(holderAgent.identity.getOperationalDID().value,
            async (to: string, message) => {
                console.log("packing message to" , to , "message:" , message) 
                return holderAgent.messaging.packMessage(
                
                {
                    to: DID.from(to),
                    message
                })
            },
            (message) => holderAgent.messaging.unpackMessage({ message }),new MemoryStorage(),new MemoryStorage());

        issuerOneClickSDK.loginStarted.on(data => {
            console.log("Login Started", data);
        });

        issuerOneClickSDK.userLoggedIn.on(data => {
            console.log("User Logged In", data);
        });

        holderOneClickSDK.userLoggedIn.on(data => {
            console.log("Holder User Logged In");
        });
        console.log("starting one click test")

        let oneClickMessage = await holderOneClickSDK.isOneClickMessage(oob);
        expect(oneClickMessage).toBe(true)

        console.log("is message1")


        let holderResponse = (await holderOneClickSDK.processMessage(oob))!.packedMessage;
        console.log("process oob")

        oneClickMessage = await issuerOneClickSDK.isOneClickMessage(holderResponse);
        console.log("is message2")

        expect(oneClickMessage).toBe(true)


        let issuerResponse = (await issuerOneClickSDK.processMessage(holderResponse))!.packedMessage;
        console.log("process response")

        oneClickMessage = await holderOneClickSDK.isOneClickMessage(issuerResponse);
        expect(oneClickMessage).toBe(true)
        console.log("is message3")

        holderResponse = (await holderOneClickSDK.processMessage(issuerResponse))!.packedMessage;
        console.log("process response")

        oneClickMessage = await issuerOneClickSDK.isOneClickMessage(holderResponse);
        expect(oneClickMessage).toBe(true)
        console.log("is message4")

        issuerResponse = (await issuerOneClickSDK.processMessage(holderResponse))!.packedMessage;
        console.log("process response")

        oneClickMessage = await holderOneClickSDK.isOneClickMessage(issuerResponse);
        expect(oneClickMessage).toBe(true)
        console.log("is message5")

        const final = (await holderOneClickSDK.processMessage(issuerResponse));
        console.log("process response")

        expect(final).toBeNull();

        // let holderResponse = (await holderOneClickSDK.processMessage(oob))!.packedMessage;
        // let issuerResponse = (await issuerOneClickSDK.processMessage(holderResponse))!.packedMessage;
        // holderResponse = (await holderOneClickSDK.processMessage(issuerResponse))!.packedMessage;
        // issuerResponse = (await issuerOneClickSDK.processMessage(holderResponse))!.packedMessage;
        // const finalResponse = (await issuerOneClickSDK.processMessage(issuerResponse));

        // expect(finalResponse).toBeNull();
    })
);
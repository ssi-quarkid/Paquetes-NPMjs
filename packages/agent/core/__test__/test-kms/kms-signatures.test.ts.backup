import { Suite } from '@extrimian/kms-core';
import { AgentModenaUniversalRegistry, AgentModenaUniversalResolver, DID } from '../../src';
import { Agent } from '../../src/agent';
import { VerifiyJWSResult } from '../../src/models/agent-kms';
import { VMKey } from '../../src/models/agent-registry';
import { WACIProtocol } from '../../src/vc/protocols/waci-protocol';
import { TestConfig } from '../config';
import { FileSystemAgentSecureStorage } from '../mock/filesystem-secure-storage';
import { FileSystemStorage } from '../mock/filesystme-storage';
import { MemoryStorage } from '../mock/memory-storage';

jest.setTimeout(1000000);

let agent: Agent;
let otherAgent: Agent;

beforeAll(async () => {
    const wp = new WACIProtocol({
        storage: new MemoryStorage(),
    });

    agent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
            TestConfig.modenaUrl,
            TestConfig.defaultDIDMethod
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
        agentStorage: new FileSystemStorage({
            filepath: './__test__/data-mock/kms-signature-agent-storage.json',
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/kms-signature-agent-secure-storage.json',
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [wp],
        supportedTransports: [],
    });

    await agent.initialize();

    otherAgent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
            TestConfig.modenaUrl,
            TestConfig.defaultDIDMethod
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
        agentStorage: new FileSystemStorage({
            filepath: './__test__/data-mock/kms-signature-other-agent-storage.json',
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/kms-signature-other-agent-secure-storage.json',
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [wp],
        supportedTransports: [],
    });

    await otherAgent.initialize();

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
});

afterAll(() => {
    agent.transport.transports.forEach(x => x.dispose());
});

describe('JWSignatures', () => {
    it("Signature and Verification Test", async () => {
        const content = "This is the content to sign";
        const r = await agent.agentKMS.signMessage({ content });
        console.log(r);

        const result = await agent.agentKMS.verifyMessage({
            content,
            verificationMethodId: r.verificationMethodId,
            signature: r.signature
        });

        expect(result.verified).toBeTruthy();
    })

    it("Invalid Content Test", async () => {
        const r = await agent.agentKMS.signMessage({ content: "This is the content to sign" });
        console.log(r);

        const result = await agent.agentKMS.verifyMessage({
            content: "Invalid content to verify",
            verificationMethodId: r.verificationMethodId,
            signature: r.signature
        });

        expect(result.verified).toBeFalsy();

        if (result.verified == false) {
            expect(result.result).toBe(VerifiyJWSResult.InvalidSignature);
            // expect(result.signedContent).toBe("This is the content to sign");
        }
    })

    it("Invalid Signature Test", async () => {
        const content = "This is the content to sign";

        const r = await agent.agentKMS.signMessage({ content });

        r.signature = r.signature.substring(0, 20) + "content" + r.signature.substring(20);

        const result = await agent.agentKMS.verifyMessage({
            content,
            verificationMethodId: r.verificationMethodId,
            signature: r.signature
        });

        expect(result.verified).toBeFalsy();

        if (result.verified == false) {
            expect(result.result).toBe(VerifiyJWSResult.UnexpectedError);
        }
    })

    it("Invalid Signature for other verification method id Test", async () => {
        const content = "This is the content to sign";

        const r = await agent.agentKMS.signMessage({ content });
        const r2 = await otherAgent.agentKMS.signMessage({content})

        const result = await agent.agentKMS.verifyMessage({
            content,
            verificationMethodId: r.verificationMethodId,
            signature: r2.signature
        });

        expect(result.verified).toBeFalsy();

        if (result.verified == false) {
            expect(result.result).toBe(VerifiyJWSResult.InvalidSignature);
        }
    })
});
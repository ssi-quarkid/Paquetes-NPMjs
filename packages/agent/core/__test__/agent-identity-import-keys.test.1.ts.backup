// import { VerifiableCredential } from "@extrimian/vc-core";
import { KMSClient } from '@extrimian/kms-client';
import { LANG, Suite } from '@extrimian/kms-core';
import {
    AgentModenaRegistry,
    AgentModenaUniversalResolver,
} from '../src';
import { Agent } from '../src/agent';
import { AgentModenaUniversalRegistry, VMKey } from '../src/models/agent-registry';
import {
    WACIProtocol,
} from '../src/vc/protocols/waci-protocol';
import { TestConfig } from './config';
import { MemoryStorage } from './mock/memory-storage';
const vc = require('./mock/vc.json');

jest.setTimeout(1000000);


let agent: Agent;
let waciProtocol: WACIProtocol;

beforeAll(async () => {
    waciProtocol = new WACIProtocol({
        storage: new MemoryStorage()
    });

    agent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
            TestConfig.modenaUrl, TestConfig.defaultDIDMethod
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
        agentStorage: new MemoryStorage(),
        secureStorage: new MemoryStorage(),
        vcStorage: new MemoryStorage(),
        vcProtocols: [waciProtocol],
        // supportedTransports: [new DWNTransport()],
    });
    await agent.initialize();

    const kms = new KMSClient({
        lang: LANG.es,
        storage: new MemoryStorage(),
    });

    const bbsKey = await kms.create(Suite.Bbsbls2020);
    const bbsKeySecrets = await kms.export(bbsKey.publicKeyJWK);

    await agent.identity.createNewDID({
        preventCredentialCreation: true,
        keysToImport: [{
            id: "test-key",
            publicKeyJWK: bbsKey.publicKeyJWK,
            secrets: bbsKeySecrets,
            vmKey: VMKey.VC
        }]
    });

    const awaitDIDCreation = new Promise<void>((resolve, reject) => {
        agent.identity.didCreated.on((args) => {
            resolve();
        });
    });

    await awaitDIDCreation;
});

describe('Keys To Import Test', () => {
    it('Keys to use', async () => {
        const didDoc = await agent.resolver.resolve(agent.identity.getOperationalDID());

        const vm = didDoc.verificationMethod.find(x => x.id.indexOf("test-key") > -1);

        expect(vm).not.toBeNull();
    });

    it('Sign with Key', async () => {
        const vcSigned = await agent.vc.signVC({
            credential: vc
        });

        expect(vcSigned.proof.verificationMethod).toContain("test-key");

        const result = await agent.vc.verifyVC({
            vc: vcSigned
        });

        expect(result.result).toBeTruthy();
    });
});
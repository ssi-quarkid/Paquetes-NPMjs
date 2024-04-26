import { AgentModenaUniversalRegistry, AgentModenaUniversalResolver } from '../../src';
import { Agent } from '../../src/agent';
import { WACIProtocol } from '../../src/vc/protocols/waci-protocol';
import { TestConfig } from '../config';
import { FileSystemAgentSecureStorage } from '../mock/filesystem-secure-storage';
import { FileSystemStorage } from '../mock/filesystme-storage';
import { MemoryStorage } from '../mock/memory-storage';
import { TransportMock } from '../mock/transport-mock';
import { credentialPresentation } from './credential-presentation';
import { credentialIssuance } from './credential-issuance';
import { credentialIssueForNotOperationalDID } from './issue-for-not-operational';
import { getIssuerWACIProtocol } from '../helpers/waci-protocol-helper';

jest.setTimeout(1000000);

let issuerAgent: Agent;
let holderAgent: Agent;
let waciProtocol: WACIProtocol;

let holderResolve: () => void;

const holder = new Promise<void>(async (resolve, reject) => {
    holderResolve = resolve;
});


beforeAll(async () => {
    issuerAgent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
            TestConfig.modenaUrl,
            TestConfig.defaultDIDMethod
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
        agentStorage: new FileSystemStorage({
            filepath: './__test__/data-mock/agent-issuer-storage.json',
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/agent-issuer-secure-storage.json',
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [getIssuerWACIProtocol()],
        supportedTransports: [new TransportMock()],
    });
    await issuerAgent.initialize();

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

    holderAgent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
            TestConfig.modenaUrl,
            TestConfig.defaultDIDMethod
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
        agentStorage: new FileSystemStorage({
            filepath: './__test__/data-mock/agent-storage.json',
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: './__test__/data-mock/agent-secure-storage.json',
        }),
        vcStorage: new FileSystemStorage({
            filepath: './__test__/data-mock/agent-vc-storage.json',
        }),
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new TransportMock()],
    });

    await holderAgent.initialize();
});

afterAll(() => {
    issuerAgent.transport.transports.forEach(x => x.dispose());
    holderAgent.transport.transports.forEach(x => x.dispose());
});

describe('Verifiable Credentials', () => {
        it("Credential Presentation: Holder wait and process message again", async () => {
            await credentialPresentation(holderAgent, issuerAgent);
        }),
        it("Credential Presentation: Holder wait and process message again", async () => {
            await credentialIssuance(holderAgent, issuerAgent);
        }),
        it("Credential Issue for not Operational DID (using other dids of agent but not the operational DIDs)", async () => {
            await credentialIssueForNotOperationalDID(holderAgent, issuerAgent);
        })
});
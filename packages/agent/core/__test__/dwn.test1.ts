import { AgentModenaResolver, AgentModenaUniversalRegistry, AgentModenaUniversalResolver, DWNTransport, WebsocketClientTransport } from '../src';
import { Agent } from '../src/agent';
import { WACIProtocol } from '../src/vc/protocols/waci-protocol';
import { TestConfig } from './config';
import { FileSystemAgentSecureStorage } from './mock/filesystem-secure-storage';
import { FileSystemStorage } from './mock/filesystme-storage';
import { MemoryStorage } from './mock/memory-storage';
import { ResolverMock } from './mock/resolver-mock';

jest.setTimeout(1000000);

let holderAgent: Agent;

beforeAll(async () => {
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
            filepath: './__test__/data-dev/dev-storage.json',
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: './__test__/data-dev/dev-secure-storage.json',
        }),
        vcStorage: new MemoryStorage(),
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new WebsocketClientTransport()],
    });

    await holderAgent.initialize();

    if (!holderAgent.identity.getOperationalDID()) {
        const wait = new Promise<void>(async (resolve, reject) => {
            holderAgent.identity.didCreated.on(() => {
                resolve();
            });
        });

        await holderAgent.identity.createNewDID();

        await wait;
    }

    // const wait = new Promise<void>((resolve) => {
    //     setTimeout(() => {
    //         resolve();
    //     }, 20000);
    // });

    // await wait;

});

afterAll(() => {
    holderAgent.transport.transports.forEach(x => x.dispose());
});

describe('Verifiable Credentials', () => {
    it("Credential Presentation: Holder wait and process message again", async () => {
        const waitCredentialArrived = new Promise<void>(async (resolve, reject) => {
            holderAgent.vc.credentialArrived.on((args) => {
                console.log(args);
                // resolve();
            });

            holderAgent.vc.ackCompleted.on((args) => {
                // args.
            })

            await holderAgent.processMessage({
                message: "extrimian://?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNmM4MThlYjMtYjcyOS00MmVhLTk5YmMtZmJmZTk2ZWE0MzdjIiwiZnJvbSI6ImRpZDpxdWFya2lkOnprc3luYzpFaURPR3RPVW9Zb3JrZjIwZzFITnc3Yl9LMHVtMzJPSi1WeEtacS1OdGI5cWZBIiwiYm9keSI6eyJnb2FsX2NvZGUiOiJzdHJlYW1saW5lZC12YyIsImFjY2VwdCI6WyJkaWRjb21tL3YyIl19fQ=="
            });
        });

        await waitCredentialArrived;
    })
});
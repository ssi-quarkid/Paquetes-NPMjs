// import { VerifiableCredential } from "@extrimian/vc-core";
import { VerificationMethodTypes } from '@extrimian/did-core';
import {
  AgentModenaUniversalRegistry,
  AgentModenaUniversalResolver,
  CredentialFlow,
  DID,
  WACIProtocol,
} from '../src';
import { Agent } from '../src/agent';
import { TestConfig } from './config';
import { MemoryStorage } from './mock/memory-storage';
import { FileSystemStorage } from './mock/filesystme-storage';
import { FileSystemAgentSecureStorage } from './mock/filesystem-secure-storage';
import { decode } from 'base-64';
const credentialToSign = require('./mock/vc.json');

// import {
//   Agent,
//   AgentModenaUniversalRegistry,
//   AgentModenaUniversalResolver,
//   VerifiableCredential,
//   WACIProtocol,
// } from '../dist';

jest.setTimeout(1000000);

let agent: Agent;
let didPublished;

beforeAll(async () => {
  //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
  agent = new Agent({
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
    vcProtocols: [new WACIProtocol({
      storage: new MemoryStorage(),
    })],
    supportedTransports: [],
  });

  await agent.initialize();
});

afterAll(() => {
  agent.transport.transports.forEach(x => x.dispose());
});

describe('WACI Test', () => {
  it('Create Issuer Invitation Message', async () => {
    // console.log("bb");
    const message = await agent.vc.createInvitationMessage({
      flow: CredentialFlow.Issuance,
      did: DID.from("did:quarkid:zksync:EiAg5whxpppkIBbmLgzUBxssjNsF2fRZxYmO4bq6t5s-DQ"),
    });
    
    const decoded = decode(message.replace("didcomm://?_oob=", ""));
    const decodedMessage = JSON.parse(decoded);
    
    expect(decodedMessage.from == "did:quarkid:zksync:EiAg5whxpppkIBbmLgzUBxssjNsF2fRZxYmO4bq6t5s-DQ");
  });
});

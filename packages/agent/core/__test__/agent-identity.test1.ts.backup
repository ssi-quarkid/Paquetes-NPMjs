// import { VerifiableCredential } from "@extrimian/vc-core";
import { VerificationMethodTypes } from '@extrimian/did-core';
import {
  AgentModenaUniversalRegistry,
  AgentModenaUniversalResolver,
  VerifiableCredential,
  WACIProtocol,
} from '../src';
import { Agent } from '../src/agent';
import { TestConfig } from './config';
import { MemorySecureStorage, MemoryStorage } from './mock/memory-storage';
import { OneClickPlugin } from "../../plugins/one-click/src/index";
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
  //El agente necesita preconfigurar protocolos de intercambio de credenciales. En este instante se debe configurar también las credenciales que emitirá este agente.
  //Como este agente de test no va a emitir credenciales, no es necesario configurar el WACIProtocol, por eso se deja en blanco su constructor.
  const waciProtocol = new WACIProtocol({
    storage: new MemoryStorage(),
    holder: {
      selectVcToPresent: async (vcs: VerifiableCredential[]) => {
        return [];
      },
    },
  });

  const didDocumentRegistry = new AgentModenaUniversalRegistry(
    TestConfig.modenaUrl
  );

  //Crear una nueva instancia del agente, se deben pasar los protocolos a usar para la generación de VC (WACIProtocol)
  agent = new Agent({
    didDocumentRegistry: new AgentModenaUniversalRegistry(TestConfig.modenaUrl, TestConfig.defaultDIDMethod),
    didDocumentResolver: new AgentModenaUniversalResolver(TestConfig.modenaUrl),
    agentStorage: new MemoryStorage(),
    secureStorage: new MemoryStorage(),
    vcStorage: new MemoryStorage(),
    agentPlugins: [new OneClickPlugin() as any],
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
  await agent.initialize();

  // const wait = async () => new Promise<void>((resolve, reject) => {
  //     setTimeout(() => {
  //         resolve();
  //     }, 20000);
  // });

  // await wait();
});

afterAll(() => {
  agent.transport.transports.forEach(x => x.dispose());
});

describe('Agent New Identity', () => {
  it('Create new Identity', async () => {
    //Lo primero que se debe hacer con un agente nuevo, es crear su DID. Si el agente ya se corrió en estas instancias, no es necesario crear uno nuevo.

    const createDIDResult = async () =>
      new Promise<void>(async (resolve, reject) => {
        //El agente emitirá un evento cuando el DID creado esté listo para usar. Esto puede tardar un tiempo, ya que la creación del DID es asyncrónica.
        agent.identity.didCreated.on(async (args) => {
          expect(args.did).toEqual(did);

          const didDocument = await agent.resolver.resolve(did);

          // expect(didDocument.service.find(x => x.serviceEndpoint == dwnUrl && x.type == "DecentralizedWebNode")).not.toBeNull();
          expect(
            didDocument.verificationMethod.find(
              (x) => x.type == VerificationMethodTypes.X25519KeyAgreementKey2019
            )
          ).not.toBeNull();
          expect(
            didDocument.verificationMethod.find(
              (x) => x.type == VerificationMethodTypes.Bls12381G1Key2020
            )
          ).not.toBeNull();
          expect(
            didDocument.verificationMethod.find(
              (x) => x.type == VerificationMethodTypes.RsaVerificationKey2018
            )
          ).not.toBeNull();

          didPublished = true;
          // resolve();
        });

        const did = await agent.identity.createNewDID({
          // dwnUrl: dwnUrl
        });

        const longDID = agent.identity.getOperationalDID();

        expect(longDID.isLongDID()).toBeTruthy();
        expect(longDID.value.indexOf(did.value)).not.toEqual(-1);
        expect(agent.identity.getOperationalDID().isEqual(did));

        resolve();
      });

    await createDIDResult();
  }),
    it('Sign VC', async () => {
      const vc = await agent.vc.signVC({
        credential: credentialToSign,
      });

      const longDID = agent.identity.getOperationalDID();

      expect(longDID.isLongDID());

      //Mientras el DID no este publicado, se debe usar el long DID para firmar (debe estar seteado como el OperationalDID)
      expect(vc.proof.verificationMethod.indexOf(longDID.value)).not.toEqual(
        -1
      );

      const isValid = await agent.vc.verifyVC({
        vc: vc,
      });

      //La VC debe poder ser verificada aunque se este usando el LongDID.
      expect(isValid.result).toBeTruthy();
    }),
    it('DID Published', async () => {
      if (!didPublished) {
        const waitDidPublish = new Promise<void>((resolve, reject) => {
          const interval = setInterval(() => {
            if (didPublished) {
              clearInterval(interval);
              resolve();
            }
          }, 1000);
        });

        await waitDidPublish;
      }

      //Si el DID se publica, el operationalDID debe pasar a ser el publicado
      expect(agent.identity.getOperationalDID().isLongDID()).toBeFalsy();
    });
});

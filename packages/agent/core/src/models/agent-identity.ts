import {
  AssertionMethodPurpose,
  AuthenticationPurpose,
  KeyAgreementPurpose,
} from '@extrimian/did-core';
import { Base, BaseConverter, IJWK, IKeyPair, IKMS, Suite } from '@quarkid/kms-core';
import {
  IdentityDataShareBehavior,
  IdentityExportResult,
} from '../data-share-behaviours/identity-data-share-behavior';
import { LiteEvent } from '../utils/lite-event';
import {
  CreateDIDSidetreeResponse,
  IAgentRegistry,
  KeyDefinition,
  ServiceDefinition,
  VMKey,
} from './agent-registry';
import { IAgentResolver } from './agent-resolver';
import { IAgentStorage } from './agent-storage';
import { DID } from './did';
import { UpdateCommitmentUtils } from "@extrimian/modena-sdk";

const AGENT_DID_KEY = 'agent-did';
const OPERATIONAL_DID_KEY = 'operational-did';

export class AgentIdentity {
  private agentStorage: IAgentStorage;
  private kms: IKMS;
  private resolver: IAgentResolver;
  private registry: IAgentRegistry;

  private _dids: string[] = new Array<string>();

  private _did: DID;

  private _onOperationalDIDChanged = new LiteEvent<{ did: DID }>();
  public get operationalDIDChanged() {
    return this._onOperationalDIDChanged.expose();
  }

  private _onIdentityInitialized = new LiteEvent<void>();
  public get identityInitialized() {
    return this._onIdentityInitialized.expose();
  }

  private readonly onDidCreated = new LiteEvent<{ did: DID }>();
  public get didCreated() {
    return this.onDidCreated.expose();
  }

  constructor(params: {
    agentStorage?: IAgentStorage;
    resolver: IAgentResolver;
    registry: IAgentRegistry;
    kms: IKMS;
  }) {
    this.agentStorage = params.agentStorage;
    this.kms = params.kms;
    this.resolver = params.resolver;
    this.registry = params.registry;
  }

  private _initialized: boolean;

  public get initialized() {
    return this._initialized;
  }

  public async initialize(params?: {
    operationalDID?: DID;
    resolver: IAgentResolver;
    registry: IAgentRegistry;
  }) {
    this.resolver = params.resolver;
    this.registry = params.registry;

    this._dids =
      (await this.agentStorage.get(AGENT_DID_KEY)) || new Array<string>();

    if (params.operationalDID) {
      if (this._dids.indexOf(params.operationalDID.value) == -1) {
        throw new Error(
          `Operational DID ${params.operationalDID} not exists on agent. You must import the did with its private keys`
        );
      }
      await this.setOperationalDID(params.operationalDID);
    } else {
      const did = (await this.agentStorage.get(OPERATIONAL_DID_KEY)) as string;
      this._did = did != null ? DID.from(did) : null;

      if (!this._did && this._dids && this._dids.length > 0) {
        await this.setOperationalDID(DID.from(this._dids[0]));
      } else if (this._did) {
        await this.setOperationalDID(this._did);
      }

      if (this._did?.isLongDID()) {
        const shortDID = this.getDIDs().map(x => DID.from(x)).find(x => this._did.isLongDIDFor(x));

        if (shortDID) {
          const result = await this.checkDIDPublished(shortDID, true);

          if (!result) {
            this.waitForDIDPublish(shortDID, true);
          }
        }
      }
    }

    this._initialized = true;
    this._onIdentityInitialized.trigger();
  }

  public async addDID(params: { did: DID }) {
    if (!this._did) {
      this._did = params.did;
    }

    if (!this._dids[params.did.value]) {
      this._dids.push(params.did.value);
      await this.agentStorage.add(AGENT_DID_KEY, this._dids);
    }
  }

  public async setOperationalDID(did: DID) {
    if (!did) {
      throw new Error("Operational DID to set can't be null or undefined.");
    }
    if (this._dids.indexOf(did.value) == -1) {
      throw new Error(
        'Operational DID to set must be defined on dids of the identity. You must import the did with its private keys'
      );
    }

    const auxDid = this._did;
    this._did = did;

    await this.agentStorage.add(OPERATIONAL_DID_KEY, this._did.value);

    if (auxDid != did) {
      this._onOperationalDIDChanged.trigger({ did });
    }
  }

  public getOperationalDID(): DID {
    return this._did;
  }

  public getDIDs(): string[] {
    return [...this._dids];
  }

  async createNewDID(): Promise<DID>;
  async createNewDID(params: {
    preventCredentialCreation?: boolean;
    dwnUrl?: string | string[]
    services?: ServiceDefinition[];
    keysToCreate?: KeyDefinition[];
    createDefaultKeys?: boolean,
    keysToImport?: {
      id: string,
      vmKey: VMKey,
      publicKeyJWK: IJWK,
      secrets: IKeyPair,
    }[];
    didMethod?: string;
  }): Promise<DID>;

  async createNewDID(params?: {
    preventCredentialCreation?: boolean,
    dwnUrl?: string | string[],
    services?: ServiceDefinition[],
    keysToCreate?: KeyDefinition[],
    createDefaultKeys?: boolean,
    keysToImport?: {
      id: string,
      vmKey: VMKey,
      publicKeyJWK: IJWK,
      secrets: IKeyPair,
    }[],
    didMethod?: string,
  }): Promise<DID> {
    params = params || {};

    if (!params.keysToCreate || params.createDefaultKeys) {
      if (!params.keysToCreate) {
        params.keysToCreate = new Array<KeyDefinition>();
      }

      if (!params.preventCredentialCreation) {
        params.keysToCreate.push({ id: 'vc-bbsbls', vmKey: VMKey.VC });
      }

      params.keysToCreate.push({ id: 'didcomm', vmKey: VMKey.DIDComm });
      params.keysToCreate.push({ id: 'rsa', vmKey: VMKey.RSA });
    }

    const updateKey = await this.kms.create(Suite.ES256k);
    const recoveryKey = await this.kms.create(Suite.ES256k);

    if (params.keysToImport) {
      for (let ktu of params.keysToImport) {
        await this.kms.import({
          publicKeyHex: BaseConverter.convert(ktu.publicKeyJWK, Base.JWK, Base.Hex, ktu.secrets.keyType),
          secret: ktu.secrets,
        });
      }
    }

    const didCommKeys = [...await Promise.all(
      params.keysToCreate
        .filter((x) => x.vmKey == VMKey.DIDComm)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.DIDCommV2),
        }))
    ), ...(params.keysToImport || [])?.filter(x => x.vmKey == VMKey.DIDComm).map(x => ({
      id: x.id,
      pbk: { publicKeyJWK: x.publicKeyJWK }
    }))];

    const bbsbls2020Keys = [...await Promise.all(
      params.keysToCreate
        .filter((x) => x.vmKey == VMKey.VC)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.Bbsbls2020),
        }))
    ),
    ...(params.keysToImport || [])?.filter(x => x.vmKey == VMKey.VC).map(x => ({
      id: x.id,
      pbk: { publicKeyJWK: x.publicKeyJWK }
    }))];

    const rsaKeys = [...await Promise.all(
      params.keysToCreate
        .filter((x) => x.vmKey == VMKey.RSA)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.RsaSignature2018),
        }))
    ),
    ...(params.keysToImport || [])?.filter(x => x.vmKey == VMKey.RSA).map(x => ({
      id: x.id,
      pbk: { publicKeyJWK: x.publicKeyJWK }
    }))];

    const ecdskeys = [...await Promise.all(
      params.keysToCreate
        .filter((x) => x.vmKey == VMKey.ES256k)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.ES256k),
        }))
    ),
    ...(params.keysToImport || [])?.filter(x => x.vmKey == VMKey.ES256k).map(x => ({
      id: x.id,
      pbk: { publicKeyJWK: x.publicKeyJWK }
    }))];

    if (!params.services) {
      params.services = new Array<ServiceDefinition>();
    }

    if (params.dwnUrl) {
      params.services.push({
        id: 'dwn-default',
        type: 'DecentralizedWebNode',
        serviceEndpoint: {
          nodes:
            typeof params.dwnUrl === 'string' ? [params.dwnUrl] : params.dwnUrl,
        },
      });
    }

    const response = await this.registry.createDID({
      didMethod: params.didMethod,
      recoveryKeys: [recoveryKey.publicKeyJWK],
      updateKeys: [updateKey.publicKeyJWK],
      services: params.services,
      verificationMethods: didCommKeys
        .map((x) => ({
          id: x.id,
          publicKeyJwk: x.pbk.publicKeyJWK,
          purpose: [new KeyAgreementPurpose()],
          type: 'X25519KeyAgreementKey2019',
          controller: this.getOperationalDID(),
        }))
        .concat(
          bbsbls2020Keys
            .map((x) => ({
              id: x.id,
              publicKeyJwk: x.pbk.publicKeyJWK,
              purpose: [new AssertionMethodPurpose()],
              type: 'Bls12381G1Key2020',
              controller: this.getOperationalDID(),
            }))
            .concat(
              rsaKeys.map((x) => ({
                id: x.id,
                publicKeyJwk: x.pbk.publicKeyJWK,
                purpose: [new AuthenticationPurpose()],
                type: 'RsaSignature2018',
                controller: this.getOperationalDID(),
              }))
            )
            .concat(
              ecdskeys.map((x) => ({
                id: x.id,
                publicKeyJwk: x.pbk.publicKeyJWK,
                purpose: [new AuthenticationPurpose()],
                type: 'EcdsaSecp256k1VerificationKey2019',
                controller: this.getOperationalDID(),
              }))
            )
        )
    });

    if ('longDid' in response) {
      const sidetreeResponse = response as CreateDIDSidetreeResponse;
      this.addDID({ did: DID.from(sidetreeResponse.longDid) });

      const h = (args: { did: DID }) => {
        if (args.did.value == response.did) {
          this.onDidCreated.off(h);
          if (
            this.getOperationalDID().isEqual(DID.from(sidetreeResponse.longDid))
          ) {
            this.setOperationalDID(args.did);
          }
        }
      };

      await this.setOperationalDID(DID.from(sidetreeResponse.longDid));

      this.onDidCreated.on(h);
    }

    this.addDID({ did: DID.from(response.did) });

    this.waitForDIDPublish(DID.from(response.did));


    return DID.from(response.did);
  }

  async checkDIDPublished(shortDid: DID, setAsOperationalAfterDIDPublish: boolean = false): Promise<boolean> {
    const didDocument = await this.resolver.resolve(shortDid);

    if (didDocument) {
      if (setAsOperationalAfterDIDPublish) {
        this.setOperationalDID(shortDid);
      }

      this.onDidCreated.trigger({ did: shortDid });
      return true;
    }

    return false;
  }

  async waitForDIDPublish(shortDid: DID, setAsOperationalAfterDIDPublish: boolean = false) {
    let interval = null;

    const pollFunc = () => new Promise<void>(async (resolve, reject) => {
      if (await this.checkDIDPublished(shortDid, setAsOperationalAfterDIDPublish)) {
        if (interval) {
          clearInterval(interval);
        }
      }
      resolve();
    });

    const result = await this.checkDIDPublished(shortDid, setAsOperationalAfterDIDPublish);

    if (result) return;

    interval = setInterval(async () => {
      await pollFunc();
    }, 5000);
  }

  async updateDID(params?: {
    did?: DID,
    dwnUrl?: { id?: string, url: string }[];
    idsOfServiceToRemove?: string[],
    controllersToAdd?: IJWK[],
    servicesToAdd?: ServiceDefinition[],
    verificationMethodsToAdd?: KeyDefinition[],
    updateKeysToRemove?: {
      publicKeys?: IJWK[];
      updateCommitment?: string[];
    }
    idsOfVerificationMethodsToRemove?: string[],
  }): Promise<void> {

    params.did = params.did || this.getOperationalDID();
    const didDoc = await this.resolver.resolveWithMetdata(params.did);

    const keys = (await this.kms.getPublicKeysBySuiteType(Suite.ES256k)).map(jwk => ({
      jwk,
      updateCommitmentHash: UpdateCommitmentUtils.getUpdateCommitmentHash(jwk),
    }))

    const updateKey = keys.find(x => didDoc.didDocumentMetadata.method.updateCommitment.some(y => y == x.updateCommitmentHash));

    const newUpdateKey = await this.kms.create(Suite.ES256k);

    params.verificationMethodsToAdd = params.verificationMethodsToAdd || [];

    const didCommKeys = await Promise.all(
      params.verificationMethodsToAdd
        .filter((x) => x.vmKey == VMKey.DIDComm)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.DIDCommV2),
        }))
    );

    const bbsbls2020Keys = await Promise.all(
      params.verificationMethodsToAdd
        .filter((x) => x.vmKey == VMKey.VC)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.Bbsbls2020),
        }))
    );

    const rsaKeys = await Promise.all(
      params.verificationMethodsToAdd
        .filter((x) => x.vmKey == VMKey.RSA)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.RsaSignature2018),
        }))
    );

    const es256kKeys = await Promise.all(
      params.verificationMethodsToAdd
        .filter((x) => x.vmKey == VMKey.ES256k)
        .map(async (x) => ({
          id: x.id!,
          pbk: await this.kms.create(Suite.ES256k),
        }))
    );

    let time = Date.now();

    if (params.dwnUrl) {
      for (let dwn of params.dwnUrl) {
        dwn.id = dwn.id || `dwn-service-${time++}`;

        params.servicesToAdd = params.servicesToAdd || new Array<ServiceDefinition>;

        params.servicesToAdd.push({
          id: dwn.id,
          type: 'DecentralizedWebNode',
          serviceEndpoint: {
            nodes:
              typeof params.dwnUrl === 'string' ? [params.dwnUrl] : params.dwnUrl,
          } as any,
        });
      }
    }

    await this.registry.updateDIDDocument({
      did: params.did,
      updatePublicKey: updateKey.jwk,
      kms: this.kms,
      documentMetadata: didDoc.didDocumentMetadata,
      newUpdateKeys: [...(params.controllersToAdd || []), newUpdateKey.publicKeyJWK],
      servicesToAdd: params.servicesToAdd,
      idsOfServiceToRemove: params.idsOfServiceToRemove,
      idsOfVerificationMethodsToRemove: params.idsOfVerificationMethodsToRemove,
      updateKeysToRemove: params.updateKeysToRemove,
      verificationMethodsToAdd: didCommKeys
        .map((x) => ({
          id: x.id,
          publicKeyJwk: x.pbk.publicKeyJWK,
          purpose: [new KeyAgreementPurpose()],
          type: 'X25519KeyAgreementKey2019',
          controller: this.getOperationalDID(),
        }))
        .concat(
          bbsbls2020Keys
            .map((x) => ({
              id: x.id,
              publicKeyJwk: x.pbk.publicKeyJWK,
              purpose: [new AssertionMethodPurpose()],
              type: 'Bls12381G1Key2020',
              controller: this.getOperationalDID(),
            }))
            .concat(
              rsaKeys.map((x) => ({
                id: x.id,
                publicKeyJwk: x.pbk.publicKeyJWK,
                purpose: [new AuthenticationPurpose()],
                type: 'RsaSignature2018',
                controller: this.getOperationalDID(),
              }))
            )
            .concat(
              es256kKeys.map((x) => ({
                id: x.id,
                publicKeyJwk: x.pbk.publicKeyJWK,
                purpose: [new AuthenticationPurpose()],
                type: 'EcdsaSecp256k1VerificationKey2019',
                controller: this.getOperationalDID(),
              }))
            )),
      // verificationMethodsToAdd: didCommKeys
      //   .map((x) => ({
      //     id: x.id,
      //     publicKeyJwk: x.pbk.publicKeyJWK,
      //     purpose: [new KeyAgreementPurpose()],
      //     type: 'X25519KeyAgreementKey2019',
      //     controller: this.getOperationalDID(),
      //   }))
      //   .concat(
      //     bbsbls2020Keys
      //       .map((x) => ({
      //         id: x.id,
      //         publicKeyJwk: x.pbk.publicKeyJWK,
      //         purpose: [new AssertionMethodPurpose()],
      //         type: 'Bls12381G1Key2020',
      //         controller: this.getOperationalDID(),
      //       }))
      //       .concat(
      //         rsaKeys.map((x) => ({
      //           id: x.id,
      //           publicKeyJwk: x.pbk.publicKeyJWK,
      //           purpose: [new AuthenticationPurpose()],
      //           type: 'RsaSignature2018',
      //           controller: this.getOperationalDID(),
      //         }))
      //       )
      //   ),
    });
  }

  async exportKeys(params: {
    exportBehavior: IdentityDataShareBehavior;
  }): Promise<IdentityExportResult> {
    const keys = await this.kms.getAllPublicKeys();

    const exportResult = await params.exportBehavior.export({
      dids: this._dids,
      operationalDID: this.getOperationalDID().value,
      keys: await Promise.all(
        keys.map(async (x) => ({
          publicKeyHex: BaseConverter.convert(x, Base.JWK, Base.Hex, x.kty),
          secret: await this.kms.export(x),
        }))
      ),
    });

    return exportResult;
  }

  async importKeys(params: {
    exportResult: IdentityExportResult;
    exportBehavior: IdentityDataShareBehavior;
  }) {
    const importResult = await params.exportBehavior.import(
      params.exportResult
    );

    if (importResult.dids.length == 0)
      throw new Error(
        'agent importKeys requires at least one did in exportResult'
      );

    await Promise.all(
      importResult.keys.map(async (key) =>
        this.kms.import({
          publicKeyHex: key.publicKeyHex,
          secret: key.secret,
        })
      )
    );

    this._dids = importResult.dids;

    await this.agentStorage.add(AGENT_DID_KEY, this._dids);
    await this.setOperationalDID(
      DID.from(importResult.operationalDID || this._dids[0])
    );
  }
}

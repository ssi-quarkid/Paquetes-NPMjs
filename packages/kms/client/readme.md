# Extrimian - KMS Client
KMS comes from the English key management system and is the component in charge of creating key pairs, encrypting, decrypting and signing content.
The current Extrimian KMS implementation supports the ES256k, DIDComm, and BBSBLS2020 algorithms.

##  KMS Constructor
```
constructor(
  config: {
        lang: LANG;
        storage: KMSStorage;
        didResolver ?: (did: string) => Promise<DIDDocument>;
        mobile ?: boolean
    }
)
```

* lang: The preferred language for the creation of ES256k keys mnemonic.
* storage: The reference to an object that satisfies the KMSStorage interface is needed, which will store the generated key pairs, and which is accessed to make use of the keys either for signature operations or to export them, using the public component as an index.
* didResolver: Optionally, a callback can be defined that provides the functionality to resolve a DID. If this parameter is not defined, the functionality of signing verifiable credentials will not be available.
* mobile: Optionally, a flag can be set to indicate whether the KMSClient instance will work on a mobile platform or not. By default this option is false. In case this option is true, the Bbsbls2020 suite will not be available.

## KMS Storage
KMS applies dependency inversion concepts so it requires send a KMSStorage by its constructor.

```
interface KMSStorage {
  add(key: string, data: any): Promise<void>;
  get(key: string): Promise<any>;
  getAll(): Promise<Map<string, any>>;
  update(key: string, data: any);
  remove(key: string);
}
```

### Example of KMS Storage Implementation
This is a mock implementation example

```
import { KMSStorage } from "@extrimian/kms-core";

export class SecureStorage implements KMSStorage {
    map = new Map<string, any>();

    async add(key: string, data: any): Promise<void> {
        this.map.set(key, data);
    }

    async get(key: string): Promise<any> {
        return this.map.get(key);
    }

    async getAll(): Promise<Map<string, any>> {
        return this.map;
    }

    async update(key: string, data: any) {
        this.map.set(key, data);
    }

    async remove(key: string) {
        this.map.delete(key);
    }
}
```

## Example to create Keys
```
const updateKey = await kms.create(Suite.ES256k);
const recoveryKey = await kms.create(Suite.ES256k);
const didComm = await kms.create(Suite.DIDComm);
const bbsbls = await kms.create(Suite.Bbsbls2020);
```

##  Sign Content
```
sign(
  suite: Suite,
    publicKeyJWK: IJWK,
    content: any
): Promise<string>
```

### Example signing using ES256k Suite
```
return await kms.sign(Suite.ES256k, updateKey, content)
```

## Sign VC
It is used to sign a verifiable credential.

* suite: Suite to use for the signature.
* publicKeyJWK: Public component of the key pair to use as signer, in JWK format.
* vc: Credential to sign.
* did: DID of the issuer of the credential.
* verificationMethodId: Identifier of the Verification Method to use to verify.
* purpose: Indicates the Verification Relationship corresponding to the Verification Method to be used.

```
signVC(
    suite: Suite,
    publicKeyJWK: IJWK,
    vc: any,
    did: string,
    verificationMethodId: string,
    purpose: Purpose
): Promise<VerifiableCredential>
```

## DIDComm Pack and Unpack
```
pack(
    publicKeyJWK: IJWK,
    toHexPublicKeys: string[],
    contentToSign: string
): Promise<string>
```

```
unpack(
  publicKeyJWK: IJWK,
    packedContent: string
): Promise<string>
```

## Export private keys
```
export(
  publicKeyJWK: IJWK
): Promise<any>
```

## Get public keys by specific suite
```
getPublicKeysBySuiteType(
  suite: Suite
): Promise<IJWK[]>
```

## Get All public keys
```
getAllPublicKeys(): Promise<IJWK[]>
```

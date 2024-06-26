# DID Registry
This package exposes the functionality to create and publish DIDs using Modena Registry.

To create a new DID, you need to provide some public keys. You can use Extrimian KMS to generate the private keys. 

The next example shows how to create a new DID using Extrimian Registry and Extrimian KMS.

```
import { KMSClient } from "@extrimian/kms-client";
import { Did } from "@extrimian/did-registry";
import { AssertionMethodPurpuse, KeyAgreementPurpose } from "@extrimian/did-core";
import { LANG, Suite } from "@extrimian/kms-core";

const kms = new KMSClient({
    lang: LANG.en,
    storage: new SecureStorage(),
});

const updateKey = await kms.create(Suite.ES256k);
const recoveryKey = await kms.create(Suite.ES256k);

const didComm = await kms.create(Suite.DIDComm);
const bbsbls = await kms.create(Suite.Bbsbls2020);

const didService = new Did();

const longDID = await didService.createDID({
    updateKey: updateKey.publicKeyJWK,
    recoveryKey: recoveryKey.publicKeyJWK,
    verificationMethods: [{
        id: "bbsbls",
        type: "Bls12381G1Key2020",
        publicKeyJwk: bbsbls.publicKeyJWK,
        purpose: [new AssertionMethodPurpuse()]
    },
    {
        id: "didComm",
        type: "X25519KeyAgreementKey2019",
        publicKeyJwk: didComm.publicKeyJWK,
        purpose: [new KeyAgreementPurpose()]
    }],
})
```

KMS applies dependency inversion concepts so it requires send a SecureStorage by its constructor.

To learn more about the Extrimian KMS read the documentation:
@extrimian/kms-client

createDID request returns a CreateDIDResponse

```
export interface CreateDIDResponse {
    recoveryKey: IJWK;
    updateKey: IJWK;
    document: IonDocumentModel;
    longDid: string;
    didUniqueSuffix: string;
}
```

Then you could publish your LongDID using the CreateDIDResponse:

```
const registry = new Did();

return await registry.publishDID({
    modenaApiURL: getModenaApiURL(),
    createDIDResponse: createDID,
});
```

Publish a did requires a Modena API URL, which represents a modena node running as a service.

You can provide your own Modena node or use a public node.
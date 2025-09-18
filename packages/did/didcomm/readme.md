# DID Registry

This package exposes the functionality to pack and unpack messages using DIDComm.

To pack a message, you need to provide a recipient DID and the content to be encrypted.
Internally, this service uses Extrimian KMS Client to retrieve the sender DIDComm keys and also uses
Extrimian Modena resolver to fetch the sender DID Document and get its DIDComm public keys.

To unpack a message, you need to provide the content to be decrypted. This uses Extrimian KMS
Client to retrieve the recipient DIDComm keys.

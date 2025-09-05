# BSV Extensions for QuarkID Packages

This document outlines the modifications made to QuarkID packages to support Bitcoin SV (BSV) blockchain integration.

## Modified Packages

### 1. @quarkid/agent (Core)

**Location:** `Paquetes-NPMjs/packages/agent/core/src/vc/verifiable-credential.ts`

**Changes:**
- Modified VC signing to support both BBS+ and ES256k key types
- Added automatic key type detection and selection
- Prioritizes ES256k for BSV compatibility, falls back to BBS+

**Key Code:**
```typescript
// Check available key types in KMS
const availableKeys = await this.kms.getAllPublicKeys();
const es256kKeys = availableKeys.filter(key => key.crv === 'secp256k1');
const bbsKeys = availableKeys.filter(key => key.kty === 'EC' && key.crv === 'BLS12381_G1');

// Prefer ES256k for BSV compatibility, fallback to BBS+
const signingKey = es256kKeys.length > 0 ? es256kKeys[0] : bbsKeys[0];
```

### 2. @quarkid/kms-core

**Location:** `Paquetes-NPMjs/packages/kms/core/src/BsvWalletKMS.ts`

**Changes:**
- Added `BsvWalletKMS` class implementing `IKMS` interface
- Generates ES256k keys compatible with BSV transactions
- Stores keys in JWK format for QuarkID compatibility
- Provides key creation and management for BSV operations

**Key Code:**
```typescript
export class BsvWalletKMS implements IKMS {
  async create(suite: Suite): Promise<{ publicKeyJWK: IJWK }> {
    const privateKey = PrivateKey.fromRandom();
    const publicKey = privateKey.toPublicKey();
    
    const jwk: IJWK = {
      kty: 'EC',
      crv: 'secp256k1',
      x: Utils.toBase64(publicKey.getX().toArray()),
      y: Utils.toBase64(publicKey.getY().toArray())
    };
    
    return { publicKeyJWK: jwk };
  }
}
```

### 3. @quarkid/kms-suite-vc-es256k

**Location:** `Paquetes-NPMjs/packages/kms/suite/vc/es256k/src/ES256kVCSuite.ts`

**Changes:**
- New package providing ES256k Verifiable Credential signing
- Implements `IVCSuite` interface for QuarkID compatibility
- Uses BSV SDK for cryptographic operations
- Supports WIF format private keys

**Key Code:**
```typescript
export class ES256kVCSuite implements IVCSuite {
  async sign(
    documentToSign: any,
    did: string,
    verificationMethodId: string,
    purpose: Purpose
  ): Promise<VerifiableCredential> {
    const privKey = PrivateKey.fromWif(this.keyPair.privateKey);
    const messageBuffer = Buffer.from(message, 'utf8');
    const signature = privKey.sign(Array.from(messageBuffer));
    
    return {
      ...documentToSign,
      proof: {
        type: 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        proofPurpose: purpose.name || 'assertionMethod',
        verificationMethod: verificationMethodId,
        jws: signature.toDER('hex')
      }
    };
  }
}
```

### 4. @quarkid/vc-core

**Location:** `Paquetes-NPMjs/packages/vc/core/src/models/verifiable-credential.ts`

**Changes:**
- Extended `VerifiableCredential` interface to support BSV-specific proof types
- Added support for ES256k signature verification
- Maintains W3C Verifiable Credentials compliance

**Key Code:**
```typescript
export interface BSVVerifiableCredential extends VerifiableCredential {
  proof?: {
    type: 'EcdsaSecp256k1Signature2019';
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}
```

### 5. @quarkid/did-core

**Location:** `Paquetes-NPMjs/packages/did/core/src/models/did-document.ts`

**Changes:**
- Added BSV-specific DID document types
- Extended verification method types for ES256k keys
- Support for both hex and JWK public key formats
- Maintains W3C DID specification compliance

**Key Code:**
```typescript
export interface BSVDIDDocument extends DIDDocument {
  verificationMethod: BSVVerificationMethod[];
}

export interface BSVVerificationMethod extends VerificationMethod {
  type: 'EcdsaSecp256k1VerificationKey2019';
  publicKeyHex?: string;
  publicKeyJwk?: IJWK;
}
```

## Integration Points

### Agent Integration

The QuarkID Agent automatically detects and uses BSV-compatible components:

1. **KMS Replacement**: Agent replaces default KMS with `BsvWalletKMS`
2. **VC Signing**: Uses ES256k keys for VC signing when available
3. **DID Creation**: Creates DIDs with ES256k verification methods
4. **Key Management**: Manages ES256k keys through BSV-compatible KMS

### BSV Blockchain Integration

The modified packages integrate with BSV blockchain through:

1. **Transaction Creation**: Uses BSV SDK for transaction creation
2. **Key Generation**: Generates ES256k keys compatible with BSV
3. **Signature Verification**: Verifies signatures using BSV cryptographic primitives
4. **DID Resolution**: Resolves DIDs through BSV overlay services

## Usage

### Basic Setup

```typescript
import { Agent } from '@quarkid/agent';
import { BsvWalletKMS } from '@quarkid/kms-core';
import { ES256kVCSuite } from '@quarkid/kms-suite-vc-es256k';

// Initialize BSV-compatible KMS
const bsvKms = new BsvWalletKMS(walletClient);

// Create agent with BSV KMS
const agent = new Agent({
  kms: bsvKms,
  // ... other configurations
});

// Use ES256k VC suite
const vcSuite = new ES256kVCSuite();
vcSuite.setKMS(bsvKms);
```

### VC Signing

```typescript
// Create credential
const credential = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  id: 'urn:uuid:123',
  type: ['VerifiableCredential', 'PrescriptionCredential'],
  issuer: 'did:bsv:tm_did:abc123',
  credentialSubject: {
    id: 'did:bsv:tm_did:def456',
    prescription: { medication: 'Aspirin' }
  }
};

// Sign with ES256k
const signedVC = await agent.vc.signVC({
  credential,
  did: DID.from('did:bsv:tm_did:abc123'),
  purpose: 'assertionMethod'
});
```

## Benefits

1. **BSV Compatibility**: Full integration with Bitcoin SV blockchain
2. **Standards Compliance**: Maintains W3C DID and VC standards
3. **Backward Compatibility**: Supports existing BBS+ credentials
4. **Performance**: ES256k signing is faster than BBS+
5. **Interoperability**: Works with existing QuarkID ecosystem

## Migration Notes

- Existing BBS+ credentials continue to work
- New credentials default to ES256k when available
- Automatic fallback to BBS+ when ES256k keys are not available
- No breaking changes to existing QuarkID APIs 
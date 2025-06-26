# BSV Extensions for QuarkID

This document describes the Bitcoin SV (BSV) specific extensions and modifications made to the QuarkID framework to enable BSV blockchain integration for decentralized identity and verifiable credentials.

## Overview

The BSV extensions enable QuarkID to work with the BSVblockchain by:

- Supporting ES256k (secp256k1) cryptographic keys for BSV compatibility
- Implementing BSV wallet integration for key management
- Adding BSV overlay registry and resolver support
- Creating custom KMS (Key Management System) for BSV wallets

## Modified QuarkID Packages

### 1. @quarkid/agent - Modified VC Module

**File Modified:** `Paquetes-NPMjs/packages/agent/core/src/vc/vc.ts`

**Changes Made:**

- **Enhanced Key Support**: Modified the `signVC` method to support both ES256k and BBS+ keys
- **Key Type Detection**: Added logic to automatically detect and use ES256k keys for BSV compatibility
- **Fallback Mechanism**: Implemented fallback from ES256k to BBS+ keys if ES256k keys are not available
- **Suite Selection**: Added dynamic suite selection based on key type (ES256k vs BBS+)

**Key Code Changes:**

```typescript
// Before: Only supported BBS+ keys
const bbsblsKeys = await this.kms.getPublicKeysBySuiteType(Suite.Bbsbls2020);

// After: Supports both ES256k and BBS+ keys
if (!opts.publicKey) {
    // Try to get ES256k keys first (for BSV compatibility)
    const es256kKeys = await this.kms.getPublicKeysBySuiteType(Suite.ES256k);
    
    if (es256kKeys.length > 0) {
        publicKeys = es256kKeys;
        suiteType = Suite.ES256k;
    } else {
        // Fallback to BBS+ keys
        const bbsblsKeys = await this.kms.getPublicKeysBySuiteType(Suite.Bbsbls2020);
        // ... fallback logic
    }
}
```

**Impact:**

- Enables BSV-compatible verifiable credential signing
- Maintains backward compatibility with existing BBS+ implementations
- Allows seamless integration with BSV wallets

### 2. @quarkid/kms-core - BsvWalletKMS Implementation

**New File Created:** `register/back/src/plugins/BsvWalletKMS.ts`

**Purpose:**

- Implements the `IKMS` interface from `@quarkid/kms-core`
- Bridges BSV wallet functionality with QuarkID's expected KMS interface
- Manages ES256k key pairs for BSV operations

**Key Features:**

```typescript
export class BsvWalletKMS implements IKMS {
    private walletClient: WalletClient;
    private keyStore: Map<string, { privateKey: string; publicKey: string; jwk: IJWK; keyId: string }>;

    // Creates ES256k key pairs using BSV SDK
    async createKeyPair(suite: Suite): Promise<IVCJsonLDKeyPair>
    
    // Signs data using ES256k keys
    async sign(suite: Suite, publicKeyJWK: IJWK, content: any): Promise<string>
    
    // Verifies signatures
    async verifySignature(publicKeyJWK: IJWK, originalContent: string, signature: string): Promise<boolean>
}
```

**Key Methods:**

- `create()`: Creates new ES256k key pairs
- `sign()`: Signs data using ES256k cryptography
- `verifySignature()`: Verifies ES256k signatures
- `export()`: Exports keys in JWK format
- `import()`: Imports existing keys

**Integration:**

- Replaces the default QuarkID KMS in the agent
- Provides ES256k key management for DID and VC operations
- Integrates with BSV wallet for key storage and management

### 3. @quarkid/vc-core - VerifiableCredential Types

**Usage:** Used throughout the BSV extensions for type definitions

**Key Types Used:**

```typescript
import { VerifiableCredential } from '@quarkid/vc-core';
import { IVCSuite, IVCJsonLDKeyPair } from '@quarkid/kms-core';
```

**Custom Extensions:**

- **ES256kVCSuite**: Custom VC suite implementation for ES256k keys
- **BSV-specific credential formats**: Support for BSV-compatible credential structures

**New File Created:** `register/back/src/suites/ES256kVCSuite.ts`

```typescript
export class ES256kVCSuite implements IVCSuite {
    private static kmsInstance: any;
    
    // Creates ES256k key pairs for VC operations
    async create(): Promise<IVCJsonLDKeyPair>
    
    // Signs verifiable credentials with ES256k
    async sign(credential: VerifiableCredential, keyPair: IVCJsonLDKeyPair): Promise<VerifiableCredential>
}
```

### 4. @quarkid/did-core - DID-Related Types and Interfaces

**Usage:** Used for DID document structures and verification methods

**Key Types Used:**

```typescript
import { DIDDocument, Purpose, DIDCommMessage } from '@quarkid/did-core';
```

**BSV-Specific Extensions:**

**New File Created:** `register/back/src/plugins/BsvOverlayRegistryAdapter.ts`

```typescript
export class BsvOverlayRegistryAdapter extends IAgentRegistry {
    // Integrates with BSV overlay for DID operations
    async createDID(createRequest: CreateDIDRequest): Promise<CreateDIDResponse>
    
    // Uses BSV wallet for key management
    getKMS(): IKMS
}
```

**New File Created:** `register/back/src/plugins/BsvOverlayResolver.ts`

```typescript
export class BsvOverlayResolver implements IAgentResolver {
    // Resolves DIDs from BSV overlay
    async resolve(did: string): Promise<DIDDocument>
}
```

## Additional BSV Components

### BSV Wallet Integration

**File:** `register/back/src/plugins/BsvWalletKMS.ts`

- Integrates with `@bsv/sdk` for key generation and management
- Uses `@bsv/wallet-toolbox-client` for wallet operations
- Manages ES256k key pairs in a secure key store

### BSV Overlay Integration

**Files:**

- `register/back/src/plugins/BsvOverlayRegistry.ts`
- `register/back/src/plugins/BsvOverlayRegistryAdapter.ts`
- `register/back/src/plugins/BsvOverlayResolver.ts`

**Purpose:**

- Provides BSV blockchain integration for DID operations
- Uses BSV overlay for DID registration and resolution
- Integrates with BSV wallet for transaction signing

## Usage Examples

### Creating a DID with BSV Keys

```typescript
import { QuarkIdAgentService } from './services/quarkIdAgentService';

const agentService = new QuarkIdAgentService(config);
await agentService.initialize();

// Create DID using BSV keys
const did = await agentService.createDID({
    services: [/* your services */]
});
```

### Signing Verifiable Credentials

```typescript
// The agent automatically uses ES256k keys for BSV compatibility
const signedVC = await agentService.signVC({
    credential: verifiableCredential,
    did: issuerDID
});
```

## Key Benefits

1. **BSV Compatibility**: Full integration with Bitcoin SV blockchain
2. **ES256k Support**: Native support for secp256k1 keys used in BSV
3. **Wallet Integration**: Seamless integration with BSV wallets
4. **Backward Compatibility**: Maintains compatibility with existing QuarkID implementations
5. **Overlay Support**: Integration with BSV overlay for DID operations

## Technical Details

### Key Management

- Uses `@bsv/sdk` for ES256k key generation
- Implements QuarkID's `IKMS` interface
- Stores keys in a secure in-memory key store
- Supports key import/export operations

### Cryptographic Operations

- ES256k (secp256k1) signature generation and verification
- JWK (JSON Web Key) format support
- BSV-compatible key derivation [BRC42](https://bsv.brc.dev/key-derivation/0042)

### DID Operations

- BSV overlay integration for DID registration
- BSV-compatible DID resolution
- ES256k verification method support

## Troubleshooting

### Common Issues

1. **KMS Keys Not Found**: Ensure `setup-env` has been run to generate keys
2. **Platform Funding**: Use `npm run fund-platform` to fund the platform address
3. **Overlay Connection**: Verify overlay service is running on port 8080

### Debug Logging

The BSV extensions include extensive debug logging. Check console output for:

- Key creation and storage status
- KMS replacement confirmation
- DID creation and resolution details

## Contributing

When modifying BSV extensions:

1. Maintain compatibility with QuarkID interfaces
2. Add comprehensive logging for debugging
3. Update this documentation
4. Test with both ES256k and BBS+ keys

---

**Note**: These extensions are specifically designed for Bitcoin SV integration and may not be compatible with other blockchain networks.

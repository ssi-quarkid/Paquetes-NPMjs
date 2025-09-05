import { DIDDocument, Purpose, VerificationMethod, VerificationMethodJwk } from "@quarkid/did-core";
import { VerifiableCredential } from "@quarkid/vc-core";
import { VCVerifier } from "../../vc-verifier";
import { InjectVerifier } from "../../../decorators/inject-verifier-decorator";
import { VerificationMethodNotFound } from "../../../errors/error-code";
import { PublicKey, Signature } from "@bsv/sdk";

// ES256k specific proof type
interface ES256kProof {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws?: string; // DER signature in hex format
}

/**
 * EcdsaSecp256k1Signature2019 verifier for ES256k signed VCs using BSV SDK
 */
@InjectVerifier("EcdsaSecp256k1Signature2019")
export class EcdsaSecp256k1Signature2019Verifier implements VCVerifier {
    
    async verify(
        vc: VerifiableCredential, 
        purpose: Purpose, 
        didDocumentResolver: (did: string) => Promise<DIDDocument>
    ): Promise<{ result: boolean, errors?: string[] }> {
        const errors: string[] = [];
        
        try {
            // Validate the VC structure
            if (!vc.proof) {
                errors.push("No proof found in VC");
                return { result: false, errors };
            }
            
            // Cast to ES256k proof for type safety
            const proof = vc.proof as unknown as ES256kProof;
            
            if (proof.type !== "EcdsaSecp256k1Signature2019") {
                errors.push(`Invalid proof type: expected EcdsaSecp256k1Signature2019, got ${proof.type}`);
                return { result: false, errors };
            }
            
            if (!proof.verificationMethod) {
                errors.push("No verification method found in proof");
                return { result: false, errors };
            }
            
            if (!proof.jws) {
                errors.push("No signature (jws) found in proof");
                return { result: false, errors };
            }
            
            // Extract DID from verification method
            const verificationMethodId = proof.verificationMethod;
            const did = verificationMethodId.includes("#") 
                ? verificationMethodId.substring(0, verificationMethodId.indexOf("#"))
                : verificationMethodId;
            
            // Resolve DID document
            const didDocument = await didDocumentResolver(did);
            if (!didDocument) {
                errors.push(`DID document can't be resolved for ${did}`);
                return { result: false, errors };
            }
            
            // Find the verification method
            const verificationMethod = this.findVerificationMethod(didDocument, verificationMethodId);
            if (!verificationMethod) {
                errors.push(`Verification method ${verificationMethodId} not found in DID document`);
                return { result: false, errors };
            }
            
            // Check if verification method is valid for the purpose
            if (!this.isVerificationMethodValidForPurpose(didDocument, verificationMethod, purpose)) {
                errors.push(`Verification method ${verificationMethodId} is not valid for purpose ${purpose.name}`);
                return { result: false, errors };
            }
            
            // Extract public key
            const publicKey = this.extractPublicKey(verificationMethod);
            if (!publicKey) {
                errors.push(`Could not extract public key from verification method ${verificationMethodId}`);
                return { result: false, errors };
            }
            
            // Create the message to verify (VC without proof)
            const vcWithoutProof = { ...vc };
            delete vcWithoutProof.proof;
            const message = JSON.stringify(vcWithoutProof);
            
            // Verify the signature
            const isValid = this.verifySignature(message, proof.jws, publicKey);
            
            return { result: isValid, errors: isValid ? [] : ["Invalid signature"] };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(`Verification error: ${errorMessage}`);
            return { result: false, errors };
        }
    }
    
    /**
     * Find verification method in DID document
     */
    private findVerificationMethod(didDocument: DIDDocument, verificationMethodId: string): VerificationMethod | null {
        // First check the verificationMethod array
        let verificationMethod = didDocument.verificationMethod?.find(vm => vm.id === verificationMethodId);
        if (verificationMethod) {
            return verificationMethod;
        }
        
        // Check for relative references (fragment only)
        if (verificationMethodId.includes("#")) {
            const fragment = verificationMethodId.substring(verificationMethodId.indexOf("#"));
            verificationMethod = didDocument.verificationMethod?.find(vm => 
                vm.id === verificationMethodId || vm.id.endsWith(fragment)
            );
            if (verificationMethod) {
                return verificationMethod;
            }
        }
        
        // Check other arrays that might contain verification methods
        const methodArrays = ['authentication', 'assertionMethod', 'keyAgreement', 'capabilityInvocation', 'capabilityDelegation'];
        
        for (const arrayName of methodArrays) {
            const array = didDocument[arrayName];
            if (Array.isArray(array)) {
                for (const item of array) {
                    if (typeof item === 'object' && item.id === verificationMethodId) {
                        return item;
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * Check if verification method is valid for the given purpose
     */
    private isVerificationMethodValidForPurpose(
        didDocument: DIDDocument, 
        verificationMethod: VerificationMethod, 
        purpose: Purpose
    ): boolean {
        const purposeMapping = {
            'authentication': 'authentication',
            'assertionMethod': 'assertionMethod',
            'keyAgreement': 'keyAgreement',
            'capabilityInvocation': 'capabilityInvocation',
            'capabilityDelegation': 'capabilityDelegation'
        };
        
        const purposeArray = purposeMapping[purpose.name];
        if (!purposeArray) {
            // If purpose not recognized, default to true
            return true;
        }
        
        const methodArray = didDocument[purposeArray];
        if (!Array.isArray(methodArray)) {
            return false;
        }
        
        // Check if verification method ID is referenced in the purpose array
        return methodArray.some(item => {
            if (typeof item === 'string') {
                return item === verificationMethod.id;
            } else if (typeof item === 'object') {
                return item.id === verificationMethod.id;
            }
            return false;
        });
    }
    
    /**
     * Extract public key from verification method
     */
    private extractPublicKey(verificationMethod: VerificationMethod): PublicKey | null {
        try {
            // Handle JsonWebKey2020 and EcdsaSecp256k1VerificationKey2019
            if (verificationMethod.type === "JsonWebKey2020" || 
                verificationMethod.type === "EcdsaSecp256k1VerificationKey2019") {
                
                const vmJwk = verificationMethod as VerificationMethodJwk;
                
                // Try publicKeyJwk format first
                if (vmJwk.publicKeyJwk && vmJwk.publicKeyJwk.crv === 'secp256k1') {
                    const jwk = vmJwk.publicKeyJwk;
                    if (jwk.x && jwk.y) {
                        // Convert JWK to uncompressed point format for BSV
                        const xBuffer = Buffer.from(jwk.x, 'base64');
                        const yBuffer = Buffer.from(jwk.y, 'base64');
                        
                        // Create uncompressed public key (0x04 + x + y)
                        const uncompressedKey = Buffer.concat([
                            Buffer.from([0x04]), // Uncompressed prefix
                            xBuffer,
                            yBuffer
                        ]);
                        
                        return PublicKey.fromString(uncompressedKey.toString('hex'));
                    }
                }
                
                // Try publicKeyHex format (BSV extension)
                if ((vmJwk as any).publicKeyHex) {
                    const hex = (vmJwk as any).publicKeyHex;
                    return PublicKey.fromString(hex);
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting public key:', error);
            return null;
        }
    }
    
    /**
     * Verify signature using BSV SDK
     */
    private verifySignature(message: string, signatureHex: string, publicKey: PublicKey): boolean {
        try {
            // Convert message to buffer
            const messageBuffer = Buffer.from(message, 'utf8');
            
            // Parse DER signature
            const signature = Signature.fromDER(signatureHex, 'hex');
            
            // Verify using BSV SDK
            return publicKey.verify(Array.from(messageBuffer), signature);
            
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }
}
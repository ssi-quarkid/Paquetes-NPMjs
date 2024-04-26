import { Issuer, UnsignedCredential, VerifiableCredential } from "@extrimian/vc-core";
import {
    Actor, ClaimFormat, CredentialFulfillment, CredentialManifest, CredentialManifestStyles,
    DisplayMappingObject, GoalCode, InputDescriptor, OutputDescriptor, PresentationDefinition,
    PresentationDefinitionFrame, WACIInterpreter, WACIMessage, WACIMessageType, validateVcByInputDescriptor,
    OfferCredentialMessageParams
} from "@extrimian/waci";
import { decode } from "base-64";
import * as jsonpath from 'jsonpath';
import * as jsonschema from 'jsonschema';
import { Agent } from "../../agent";
import { IStorage } from "../../models/agent-storage";
import { DID } from "../../models/did";
import { getSearchParam } from "../../utils";
import { CredentialFlow } from "../models/credentia-flow";
import { ActorRole, VCProtocol, VCProtocolResponse } from "./vc-protocol";

export class WACIProtocol extends VCProtocol<WACIMessage>{
    private waciInterpreter: WACIInterpreter;
    private storage: IStorage;

    issueCredentials: (waciInvitationId: string, holderDID: string) => Promise<WACICredentialOfferResponse>;
    issuerVerificationRules?: (waciInvitationId: string, holdedDID: string) => Promise<IssuerVerificationRuleResult>;
    selectVcToPresent?: (vcs: VerifiableCredential[]) => Promise<VerifiableCredential[]>;
    presentationDefinition?: (invitationId: string) => Promise<{ inputDescriptors: InputDescriptor[], frame?: PresentationDefinitionFrame }>;
    credentialApplication?: (inputs: { descriptor: InputDescriptor, credentials: VerifiableCredentialWithInfo[] }[], selectiveDisclosure?: SelectiveDisclosure, message?: WACIMessage, issuer?: (Issuer | CredentialManifestStyles), credentialsToReceive?: VerifiableCredentialWithInfo[]) => Promise<VerifiableCredential[]>;

    constructor(params?: {
        issuer?: {
            issueCredentials?: (waciInvitationId: string, holderDID: string) => Promise<WACICredentialOfferResponse>,
            issuerVerificationRules?: (waciInvitationId: string, holdedDID: string) => Promise<IssuerVerificationRuleResult>,
        },
        holder?: {
            selectVcToPresent?: (vcs: VerifiableCredential[],) => Promise<VerifiableCredential[]>,
            credentialApplication?: (inputs:
                {
                    descriptor: InputDescriptor,
                    credentials: VerifiableCredentialWithInfo[]
                }[],
                selectiveDisclosure: SelectiveDisclosure,
                message?: WACIMessage,
                issuer?: (Issuer | CredentialManifestStyles),
                credentialsToReceive?: {
                    data: VerifiableCredential,
                    styles: CredentialManifestStyles, display: CredentialDisplay
                }[]) => Promise<VerifiableCredential[]>,
        },
        verifier?: {
            presentationDefinition?: (invitationId: string) => Promise<{ inputDescriptors: InputDescriptor[], frame?: PresentationDefinitionFrame }>,

        }
        storage: IStorage,
    }) {
        super();
        this.issueCredentials = params?.issuer?.issueCredentials;
        this.issuerVerificationRules = params?.issuer?.issuerVerificationRules;
        this.selectVcToPresent = params?.holder?.selectVcToPresent;
        this.presentationDefinition = params?.verifier?.presentationDefinition;
        this.credentialApplication = params?.holder?.credentialApplication;
        this.storage = params?.storage;
    }

    initialize(params: {
        agent: Agent
    }) {
        this.agent = params.agent;

        this.waciInterpreter = new WACIInterpreter();
        if (this.issueCredentials) {
            this.waciInterpreter.setUpFor<Actor.Issuer>({
                getCredentialManifest: async (p: { invitationId: string, holderDid: string, message: WACIMessage }): Promise<OfferCredentialMessageParams> => {
                    const result = await this.issueCredentials(p.invitationId, p.holderDid);
                    if (result.result == WACICredentialOfferResult.Succeded) {

                        const currentDID = !p.message ? null : this.agent.identity.getDIDs().find(x => x == p.message.to as any ||
                            (Array.isArray(p.message.to) && p.message.to.some(y => y == x)));

                        return {
                            issuerDid: currentDID,
                            issuerName: result.credentialManifest.issuer.name,
                            output: result.credentialManifest.credentials.map(x => ({
                                outputDescriptor: x.outputDescriptor,
                                verifiableCredential: x.credential,
                                format: "ldp_vc"
                            })),
                            issuerStyles: result.credentialManifest.issuer.styles,
                            input: result.credentialManifest.inputDescriptors,
                            frame: result.credentialManifest.frame,
                        }
                    } else if (result.result == WACICredentialOfferResult.Failed) {
                        throw new Error(result.rejectMsg);
                    }
                },
                signCredential: async (args: { vc: any, message: WACIMessage }) => {
                    const data = await this.storage.get(args.message.thid);

                    let invitationId: string = data && data.length > 0 && data[0].pthid ? data[0].pthid : null;

                    const currentDID = !args?.message ? null : this.agent.identity.getDIDs().find(x => x == args.message.to as any ||
                        (Array.isArray(args.message.to) && args.message.to.some(y => y == x)));

                    const vc = await this.agent.vc.signVC({
                        credential: args.vc,
                        did: currentDID ? DID.from(currentDID) : null
                    });

                    this.onCredentialIssued.trigger({ vc: vc, toDID: DID.from(vc.credentialSubject.id), invitationId });

                    return vc;
                },
                credentialVerificationResult: async (p: { result: boolean, error?: any, thid: string, vcs: any[], message: WACIMessage }) => {
                    const data = await this.storage.get(p.thid);
                    const m = data[0];
                    const invitationId = data[0].pthid;

                    let issuerVerification: IssuerVerificationRuleResult = null;

                    if (this.issuerVerificationRules) {
                        issuerVerification = await this.issuerVerificationRules(invitationId, m.from);
                    }

                    const verified = (!issuerVerification && p.result) || (issuerVerification.verified && p.result);

                    if (p.vcs && p.vcs.length > 0) {
                        this.onPresentationVerified.trigger({
                            invitationId: invitationId,
                            rejectMsg: verified ? null : (p.error || issuerVerification.rejectMsg),
                            verified: verified,
                            thid: p.thid,
                            vcs: p.vcs,
                            messageId: p.message.id,
                        });
                    }
                },
                verifyCredential: async (vc) => await this.agent.vc.verifyVC({
                    vc: vc
                }),
                handleIssuanceAck: async (p: { status: any, from: string, pthid: string, thid: string, message: WACIMessage }) => {
                    const data = await this.storage.get(p.thid);
                    const m = data[0];
                    const invitationId = data[0].pthid;

                    this.onAckCompleted.trigger({
                        invitationId,
                        status: p.status,
                        messageId: p.message.id,
                        role: ActorRole.Issuer,
                        thid: p.thid,
                    })
                },
                verifyPresentation: async (vc) => await this.agent.vc.verifyPresentation({
                    challenge: vc.challenge,
                    presentation: vc.presentation
                }),
            }, Actor.Issuer);
        }

        if (this.credentialApplication || this.selectVcToPresent) {
            this.waciInterpreter.setUpFor<Actor.Holder>({
                getHolderDID: async (p: { message: WACIMessage }) => {
                    const currentDID = !p.message ? null : this.agent.identity.getDIDs().find(x => x == p.message.to as any ||
                        (Array.isArray(p.message.to) && p.message.to.some(y => y == x)));

                    return currentDID || this.agent.identity.getOperationalDID().value;
                },
                getCredentialApplication: async (p: {
                    manifest: CredentialManifest,
                    fulfillment: CredentialFulfillment
                    message?: WACIMessage;
                }) => {

                    if (this.credentialApplication) {
                        // Map the credential descriptors to the actual credentials
                        const credential_manifests = await this.storage.get<CredentialManifestData[]>(InternalStorageEnum.CredentialManifests);
                        if (!credential_manifests?.find(x => x.id == p.manifest.data.json.credential_manifest.id)) {
                            await this.storage.add(InternalStorageEnum.CredentialManifests, credential_manifests ? [...credential_manifests, p.manifest.data.json.credential_manifest] : [p.manifest.data.json.credential_manifest]);
                        }

                        // Map the credential descriptors to the actual credentials
                        const credentialsToReceive = p.manifest.data.json.credential_manifest.output_descriptors.map((descriptor) => {
                            const credentialDescriptor = p.fulfillment.data.json.credential_fulfillment.descriptor_map.find(
                                (map) => map.id === descriptor.id
                            );
                            return {
                                data: jsonpath.value(p.fulfillment.data.json, credentialDescriptor.path) as VerifiableCredential,
                                styles: descriptor.styles,
                                display: descriptor.display
                            };
                        })

                        // Get the credentials from the agent
                        const credentials = await this.agent.vc.getVerifiableCredentialsWithInfo();

                        // Filter the credentials based on the input descriptors
                        const inputs = (p.manifest.data.json.credential_manifest.presentation_definition?.input_descriptors || []).map((descriptor) => {
                            return {
                                descriptor,
                                credentials: (credentials || []).reduce((acc: {
                                    data: VerifiableCredential<any>;
                                    styles: CredentialManifestStyles;
                                    display: CredentialDisplay;
                                }[], credential) => {
                                    if (this.validateSchema(credential.data, descriptor)) {
                                        acc.push(credential);
                                    }
                                    return acc;
                                }, [])
                            };
                        });

                        const cs = inputs.flat();
                        const output_descriptors = cs.map(x => x.credentials).flat()

                        const selectiveDisclosure =
                            !p.manifest.data.json.credential_manifest.presentation_definition?.frame
                                && p.manifest.data.json.credential_manifest.output_descriptors ? null :
                                SelectiveDisclosure.from(p.manifest.data.json.credential_manifest.presentation_definition.frame,
                                    output_descriptors.map(x => x));

                        // Apply the credential application
                        let credentialsToPresent = await this.credentialApplication(inputs,
                            selectiveDisclosure,
                            p.message,
                            p.manifest.data.json.credential_manifest.issuer,
                            credentialsToReceive,
                        );

                        if (p.manifest.data.json.credential_manifest.presentation_definition?.frame) {
                            const derivedVc = new Array<VerifiableCredential>();

                            //Recorro todas las credenciales a presentar y las derivo (Se aplica selective disclosure)
                            for (let vc of credentialsToPresent) {
                                derivedVc.push(await this.agent.vc.deriveVC({
                                    vc: vc,
                                    deriveProofFrame: p.manifest.data.json.credential_manifest.presentation_definition?.frame
                                }))
                            }

                            credentialsToPresent = derivedVc;
                        }

                        return {
                            credentialsToPresent: credentialsToPresent,
                            presentationProofTypes: ["JsonWebSignature2020", "EcdsaSecp256k1Signature2019"],
                        }
                    } else {

                        if (!(p.manifest.data.json.credential_manifest?.presentation_definition?.input_descriptors)) {
                            return {
                                credentialsToPresent: [],
                                presentationProofTypes: ["JsonWebSignature2020", "EcdsaSecp256k1Signature2019"]
                            };
                        }

                        let credentials = await this.agent.vc.getVerifiableCredentials();


                        credentials = credentials.filter(vc => validateVcByInputDescriptor(vc,
                            p.manifest.data.json.credential_manifest?.presentation_definition?.input_descriptors[0]))

                        const credentialsToPresent = await this.selectVcToPresent(credentials);

                        return {
                            credentialsToPresent: credentialsToPresent,
                            presentationProofTypes: ["JsonWebSignature2020", "EcdsaSecp256k1Signature2019"],
                        }

                    }
                },
                getCredentialPresentation: async (p: { inputDescriptors: InputDescriptor[], frame: PresentationDefinitionFrame, message?: WACIMessage }) => {

                    if (this.credentialApplication) {

                        // Get the credentials from the agent
                        const credentials = await this.agent.vc.getVerifiableCredentialsWithInfo();

                        // Filter the credentials based on the input descriptors
                        const inputs = (p.inputDescriptors || []).map((descriptor) => {
                            return {
                                descriptor,
                                credentials: (credentials || []).reduce((acc, credential) => {
                                    if (this.validateSchema(credential.data, descriptor)) {
                                        acc.push(credential);
                                    }
                                    return acc;
                                }, [])
                            };
                        });

                        const cs = inputs.flat();
                        const output_descriptors = cs.map(x => x.credentials).flat()

                        const selectiveDisclosure =
                            !p?.frame ? null :
                                SelectiveDisclosure.from(p.frame,
                                    output_descriptors.map(x => x));

                        let credentialsToPresent = await this.credentialApplication(inputs, selectiveDisclosure, p.message);

                        if (p.frame) {
                            const derivedVc = new Array<VerifiableCredential>();

                            //Recorro todas las credenciales a presentar y las derivo (Se aplica selective disclosure)
                            for (let vc of credentialsToPresent) {
                                derivedVc.push(await this.agent.vc.deriveVC({
                                    vc: vc,
                                    deriveProofFrame: p?.frame
                                }))
                            }

                            credentialsToPresent = derivedVc;
                        }

                        return {
                            credentialsToPresent: credentialsToPresent,
                        }
                    } else {
                        let credentials = await this.agent.vc.getVerifiableCredentials();
                        credentials = credentials.filter(vc => validateVcByInputDescriptor(vc, p.inputDescriptors[0]))
                        const credentialsToPresent = await this.selectVcToPresent(credentials);

                        return {
                            credentialsToPresent: credentialsToPresent,
                        }
                    }
                },
                handleCredentialFulfillment: async (p: { credentialFulfillment: CredentialFulfillment[], message: WACIMessage }) => {

                    const credentialManifests = await this.storage.get<CredentialManifestData[]>(InternalStorageEnum.CredentialManifests);
                    const credentialManifest = credentialManifests.find(x => x.id === p.credentialFulfillment[0].data.json.credential_fulfillment.manifest_id);
                    await this.storage.add(InternalStorageEnum.CredentialManifests, credentialManifests.filter(x => x.id !== p.credentialFulfillment[0].data.json.credential_fulfillment.manifest_id));

                    const credentials = credentialManifest.output_descriptors.map(
                        (descriptor) => {
                            const credentialDescriptor =
                                p.credentialFulfillment[0].data.json.credential_fulfillment.descriptor_map.find(
                                    (map) => map.id === descriptor.id
                                );
                            return {
                                data: jsonpath.value(p.credentialFulfillment[0].data.json, credentialDescriptor.path) as VerifiableCredential,
                                styles: descriptor.styles,
                                display: descriptor.display,
                            };
                        }
                    )

                    this.onVcArrived.trigger({ credentials, issuer: credentialManifest.issuer, messageId: p.message?.id })

                    return true;
                },
                handlePresentationAck: async (p: { status: any, message: WACIMessage }) =>
                    this.onAckCompleted.trigger({
                        status: p.status,
                        role: ActorRole.Holder,
                        messageId: p.message.id,
                        thid: p.message.thid,
                    }),
                signPresentation: async (p: { contentToSign: string, challenge: string, domain: string, message: WACIMessage }) => {
                    const signature = await this.agent.vc.signPresentation({
                        contentToSign: p.contentToSign,
                        challenge: p.challenge,
                        domain: p.domain,
                    });

                    return signature;
                },
            }, Actor.Holder);
        }

        if (this.presentationDefinition) {
            this.waciInterpreter.setUpFor<Actor.Verifier>({
                getPresentationDefinition: async (p: { invitationId: string }) => {
                    const pDef = await this.presentationDefinition(p.invitationId);
                    return {
                        inputDescriptors: pDef.inputDescriptors,
                        frame: pDef.frame
                    };
                    // return this.presentationDefinition(p.invitationId);
                },
                credentialVerificationResult: async (p: { result: boolean, error?: any, thid: string, vcs: any[], message: WACIMessage }) => {
                    const data = await this.storage.get(p.thid);

                    const invitationId = data[0].pthid;

                    this.onPresentationVerified.trigger({
                        invitationId: invitationId,
                        verified: p.result,
                        thid: p.thid,
                        vcs: p.vcs,
                        messageId: p.message?.id
                    });
                },
                verifyCredential: async (vc: VerifiableCredential) => {
                    const result = await this.agent.vc.verifyVC({ vc: vc });

                    this.onVcVerified.trigger({
                        verified: result.result,
                        presentationVerified: true,
                        vc: vc,
                    });

                    return result;
                },
                verifyPresentation: async (p) => {
                    const result = await this.agent.vc.verifyPresentation({
                        presentation: p.presentation,
                        challenge: p.challenge
                    });

                    if (!result) {
                        this.onVcVerified.trigger({
                            verified: false,
                            presentationVerified: false,
                            vc: p.presentation,
                        })
                    }

                    return result;
                },
            }, Actor.Verifier);
        }
    }

    async processMessage(message: WACIMessage | string, context?: any, did?: DID): Promise<VCProtocolResponse | void> {

        if (typeof message == "string" && getSearchParam('_oob', message)) {
            const oob = this.decodeMessage(getSearchParam('_oob', message));

            if (typeof oob === "string") {
                message = JSON.parse(oob);
            }
        }

        const waciMessage = message as WACIMessage;

        let messages = waciMessage.thid ? await this.storage.get<WACIMessage[]>(waciMessage.thid) || new Array<WACIMessage>() : new Array<WACIMessage>();
        messages.push(waciMessage);

        const response = await this.waciInterpreter.processMessage(messages);

        if (response && response.message.type == "https://didcomm.org/present-proof/3.0/propose-presentation") {
            this.storage.add(response.message.id, [response.message])
        }

        if (response) {
            response.message.from = (did?.value) || response.message.from;

            if (response?.message.thid) {
                messages.push(response.message);
                this.storage.update(response.message.thid, messages);
            }

            return {
                to: DID.from(response.target),
                message: (await this.agent.messaging.packMessage({
                    message: response.message as any,
                    to: DID.from(response.target),
                    messageManagerCompatible: context?.messageManagerCompatible,
                })).packedMessage
            };
        }

        if (messages[messages.length - 1].type == WACIMessageType.ProblemReport) {
            const problemReportMessage = messages[messages.length - 1];

            this.onProblemReport.trigger({
                did: DID.from(problemReportMessage.from),
                code: problemReportMessage.body?.code,
                messageId: waciMessage.id,
                invitationId: problemReportMessage.thid,
            });
        }

    }


    async createOBBInvitation(goalCode: GoalCode, did: DID) {
        if (!did) throw new Error("You need set a did to createOOBInvitation")
        return await this.waciInterpreter.createOOBInvitation(did.value, goalCode);
    }

    async createInvitationMessage(flow: CredentialFlow, did: DID): Promise<WACIMessage> {
        return await this.createOBBInvitation(flow == CredentialFlow.Issuance ? GoalCode.Issuance : GoalCode.Presentation, did);
    }

    async isProtocolMessage(message: any): Promise<boolean> {
        if (typeof message == "string" && getSearchParam('_oob', message)) {
            const oob = this.decodeMessage(getSearchParam('_oob', message));
            if (typeof oob === "string") {
                message = JSON.parse(oob);
            }
        }
        return this.waciInterpreter.isWACIMessage(message);
    }

    private decodeMessage(message: string) {
        try {

            return decode(message);
        } catch (error) {
            return null;
        }
    }


    private validateSchema = (vc: VerifiableCredential, inputDescriptor: InputDescriptor) => {
        for (const field of inputDescriptor.constraints.fields) {
            const fieldValues = field.path?.map((path) => {
                return jsonpath.value(vc, path);
            });

            for (const value of fieldValues) {
                if (!value) return false;
                if (field.filter) {
                    const { errors } = jsonschema.validate(value, field.filter);
                    if (errors.length) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
}

export enum WACIRequest {
    CredentialManifestRequested,
}

export enum InternalStorageEnum {
    CredentialManifests = 'CredentialManifests',
}

export type VerifiableCredentialWithInfo = {
    data: VerifiableCredential;
    styles?: CredentialManifestStyles;
    display?: CredentialDisplay;
}

export class SelectiveDisclosure {
    allFieldsToReveal: string[];
    credentialSubjectFieldsToReveal: string[];

    constructor() {

    }

    static from(frame: any, outputDescriptors: any[]): SelectiveDisclosure {
        const allFieldsToReveal: string[] = [];
        const credentialSubjectFieldsToReveal: string[] = [];

        // Para allFieldsToReveal
        for (const key in frame) {
            if (key !== '@context' && key !== 'credentialSubject') {
                allFieldsToReveal.push(key);
            }
        }

        // Para credentialSubjectFieldsToReveal
        for (const key in frame.credentialSubject) {
            if (key !== '@explicit' && key !== 'type') {
                const descriptor = outputDescriptors.find(descriptor =>
                    descriptor.display?.properties?.some(prop => prop.path.includes(`$.credentialSubject.${key}`))
                );

                if (descriptor) {
                    const property = descriptor.display.properties.find(prop => prop.path.includes(`$.credentialSubject.${key}`));
                    credentialSubjectFieldsToReveal.push(property.label);
                } else {
                    credentialSubjectFieldsToReveal.push(key);  // usar la key directamente si no encontramos la descripción
                }
            }
        }

        const sd = new SelectiveDisclosure();

        sd.allFieldsToReveal = allFieldsToReveal;
        sd.credentialSubjectFieldsToReveal = credentialSubjectFieldsToReveal;

        return sd;
    }
}

export type SelectiveDisclosureField = {
    id: string;
}

export type CredentialManifestData = {
    id: string;
    version: string;
    issuer: IssuerData;
    format?: ClaimFormat;
    output_descriptors: OutputDescriptor[];
    presentation_definition?: PresentationDefinition;
}

export type IssuerData = {
    id: string;
    name: string;
    styles?: CredentialManifestStyles;
}

export type CredentialDisplay = {
    title?: DisplayMappingObject;
    subtitle?: DisplayMappingObject;
    description?: DisplayMappingObject;
    properties?: (DisplayMappingObject & {
        label?: string;
    })[];
}

export class WACIEventArg {
    request: WACIRequest
}

export class CredentialRequestedEventArg extends WACIEventArg {
    waciInvitationId: string;
    fromDid: string;
}

export type IssuerVerificationRuleResult = {
    verified: boolean;
    rejectMsg: string;
}

export type WACICredentialOfferResponse = WACICredentialOfferWaitForResponse | WACICredentialOfferRejected | WACICredentialOfferSucceded;

export enum WACICredentialOfferResult {
    Succeded,
    Failed,
    AsyncProcess,
}

export interface WACICredentialOfferWaitForResponse {
    result: WACICredentialOfferResult.AsyncProcess;
}

export class WACICredentialOfferRejected {
    result: WACICredentialOfferResult.Failed = WACICredentialOfferResult.Failed;
    rejectMsg: string;
}

export class WACICredentialOfferSucceded {
    result: WACICredentialOfferResult.Succeded = WACICredentialOfferResult.Succeded;

    credentialManifest: {
        options?: {
            challenge: string,
            domain: string,
        };
        issuer: {
            name: string,
            styles: CredentialManifestStyles;
        };
        credentials: {
            credential: UnsignedCredential;
            outputDescriptor: OutputDescriptor;
        }[];
        inputDescriptors?: InputDescriptor[];
        frame?: PresentationDefinitionFrame
    }

    constructor(credentialManifest: {
        options?: {
            challenge: string,
            domain: string,
        };
        issuer: {
            name: string,
            styles: CredentialManifestStyles;
        };
        credentials: {
            credential: UnsignedCredential;
            outputDescriptor: OutputDescriptor;
        }[];
        inputDescriptors?: InputDescriptor[];
        frame?: PresentationDefinitionFrame,
    }) {
        this.credentialManifest = credentialManifest;
    }
}
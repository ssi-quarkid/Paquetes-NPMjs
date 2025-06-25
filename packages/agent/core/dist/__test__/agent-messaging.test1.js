"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const agent_1 = require("../src/agent");
const waci_protocol_1 = require("../src/vc/protocols/waci-protocol");
const config_1 = require("./config");
const filesystme_storage_1 = require("./mock/filesystme-storage");
const credentialToSign = require("./mock/vc.json");
jest.setTimeout(1000000);
let agent;
let packedMessage;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const waciProtocol = new waci_protocol_1.WACIProtocol({
        storage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-holder-waci-secure-storage.json',
        }),
        holder: {
            credentialApplication: (inputs) => __awaiter(void 0, void 0, void 0, function* () {
                return inputs.map((input) => {
                    if (!input.credentials.length)
                        throw Error('No credentials found for input descriptor');
                    return input.credentials[0].data;
                });
            }),
        },
    });
    agent = new agent_1.Agent({
        didDocumentRegistry: new src_1.AgentModenaUniversalRegistry(config_1.TestConfig.modenaUrl, config_1.TestConfig.defaultDIDMethod),
        didDocumentResolver: new src_1.AgentModenaUniversalResolver(config_1.TestConfig.modenaUrl),
        agentStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-holder-storage.json',
        }),
        secureStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-holder-secure-storage.json',
        }),
        vcStorage: new filesystme_storage_1.FileSystemStorage({
            filepath: './__test__/data/agent-holder-secure-storage.json',
        }),
        vcProtocols: [waciProtocol],
    });
    yield agent.initialize();
    yield agent.identity.createNewDID({
        dwnUrl: config_1.TestConfig.dwnUrl
    });
    const createDIDResult = () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            agent.identity.didCreated.on((args) => __awaiter(void 0, void 0, void 0, function* () {
                resolve();
            }));
        });
    });
    yield createDIDResult();
}));
afterAll(() => {
    agent.transport.transports.forEach(x => x.dispose());
});
describe("Agent Messaging", () => {
    it("DIDComm Pack", () => __awaiter(void 0, void 0, void 0, function* () {
        const credentialArrived = new Promise((resolve, reject) => {
            agent.vc.credentialArrived.on((args) => {
                // resolve();
            });
        });
        yield credentialArrived;
    }));
});
// agent.messaging.sendMessage({
//     message: {
//         type: 'https://didcomm.org/out-of-band/2.0/invitation',
//         id: 'ab9f60f3-a9fc-4374-bbb8-524317163b5b',
//         from: 'did:quarkid:zksync:EiBRUG8G7eqjiIL-tYsLf-ILQQ2iahXAIM8uM_CtBHwLpw:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJkaWRjb21tIiwicHVibGljS2V5SndrIjp7ImNydiI6IkVkMjU1MTkiLCJrdHkiOiJFQyIsIngiOiJlaGxVNjJqWTY2Smw1TFNIZl9oZF9RIiwieSI6Ilg0MVA1TGJzZzF0Vm42UmxJTmd5elEifSwicHVycG9zZXMiOlsia2V5QWdyZWVtZW50Il0sInR5cGUiOiJYMjU1MTlLZXlBZ3JlZW1lbnRLZXkyMDE5In0seyJpZCI6InZjLWJic2JscyIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJCbHMxMjM4MUcyS2V5MjAyMCIsImt0eSI6IkVDIiwieCI6Imo3cHFfRVRpRjVQSTBXU0Z5XzYxdl9jNjZtcE1lQkJHV0UxT09IY1dyeVVMWDF5YUt5a1NjcDdGT0lzVlJDeEkiLCJ5IjoiRURIVHFna1Jhc3hVQXY4Wk5NM1B5eEd6dW1zM3BfakJqSGJMVjRBci1CX3NDZlRNUEFZVGs4TmtrVGpLR1dreiJ9LCJwdXJwb3NlcyI6WyJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkJsczEyMzgxRzFLZXkyMDIwIn0seyJpZCI6InJzYSIsInB1YmxpY0tleUp3ayI6eyJlIjoiQVFBQiIsImt0eSI6IlJTQSIsIm4iOiIxbzVXSDlOdTlDSUt4dWc2VFFrbnpHR29zQUpqTUQtTXlzY01VQXQxcmhTNjVJWFgxVFRycDJfOGJOMnRON2dhYzA5Zjl1ZkpuV0dkTnlNUFEyX2JGbmt5VDJEZ1dWMFZHX2ZCX212OHp2U3FreWxiNktHQ3YzU3B0OVZEVVpiRHZ1RTJTV3BMZ040Z3lkWi1ZeW1PWmZOR011cHpTVEhxMWVITXF4bVVPLUxNRkNtenlfZlY4WVhKaHF1c1VnakVtaFZQMlhXUHFoWmQyZjJyZC1sRDdSRlpRdy1PMmJ6akVjMHY4NEE3OXpiT1pueVNfQjExcVo5bUhSYnQ2ZjdTYlhKQkthTVg0bHZqendxejQtOFNzN3Npb2g5X1FKa01zTEwwc3E3NUtmRXVSd0VBYTBZbW5MVzE5ZDhLS1NIeTJfNmdTQWVFeC1kZllMNFpRRkFYclEifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iXSwidHlwZSI6IlJzYVNpZ25hdHVyZTIwMTgifV0sInNlcnZpY2VzIjpbeyJpZCI6ImR3bi1kZWZhdWx0Iiwic2VydmljZUVuZHBvaW50Ijp7Im5vZGVzIjpbImh0dHBzOi8vZGVtby5leHRyaW1pYW4uY29tL2R3bi8iXX0sInR5cGUiOiJEZWNlbnRyYWxpemVkV2ViTm9kZSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6WyJFaUFqQTBQMUtZMDF3a3Y2eUY5WlpFZ3VMczlpMnpGNHFCb3F2bk1HVjJFdThnIl19LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpQnJRTkFaVk53XzdNdGk0WXBOeUtaVFloY293SzlvRnJsZDVyOFhuSVJqbGciLCJyZWNvdmVyeUNvbW1pdG1lbnQiOlsiRWlDb2pTYnVnYnJIZjViSC13VS1QWVhrQ1V6aXpWbEUtalJTRUlUWnpwaVI2USJdfX0',
//         body: { goal_code: 'streamlined-vc', accept: ['didcomm/v2'] }
//     },
//     to: DID.from("did:quarkid:zksync:EiDZyFIbYZ5t7cFqCmlYXSWmY8zv7Txkku-mDCrrcPmlSQ"),
// });
//     packedMessage = (await agent.messaging.packMessage({
//         to: agent.identity.getOperationalDID(),
//         message: credentialToSign,
//     })).packedMessage;
//     console.log(packedMessage);
// }),
//     it("DIDComm Unpack", async () => {
//         const unpacked = await agent.messaging.unpackMessage({
//             message: packedMessage
//         });
//         console.log(unpacked);
//     });
// });
//# sourceMappingURL=agent-messaging.test1.js.map
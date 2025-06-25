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
exports.credentialIssueForNotOperationalDID = void 0;
const src_1 = require("../../src");
const credentialIssueForNotOperationalDID = (holderAgent, issuerAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const processMessage = () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            holderAgent.vc.credentialArrived.on((vc) => __awaiter(void 0, void 0, void 0, function* () {
                yield Promise.all(vc.credentials.map((v) => __awaiter(void 0, void 0, void 0, function* () {
                    yield holderAgent.vc.saveCredentialWithInfo(v.data, {
                        display: v.display,
                        styles: v.styles
                    });
                    expect(v === null || v === void 0 ? void 0 : v.data.id).toEqual('http://example.edu/credentials/58473');
                    const result = yield holderAgent.vc.verifyVC({
                        vc: v.data,
                    });
                    expect(result.result).toBe(true);
                    expect(vc.credentials[0].data.proof.verificationMethod.indexOf("did:quarkid:zksync:EiAJcbMpo4OPpisPfqtv8O5_d7ABI1D23ehx2quLhqqIdw") > -1);
                    resolve(null);
                })));
            }));
            issuerAgent.vc.ackCompleted.on((args) => {
                console.log(args);
            });
            issuerAgent.vc.presentationVerified.on((args) => {
                console.log(args);
            });
            yield holderAgent.vc.processMessage({
                did: src_1.DID.from("did:quarkid:zksync:EiAg5whxpppkIBbmLgzUBxssjNsF2fRZxYmO4bq6t5s-DQ"),
                message: yield issuerAgent.vc.createInvitationMessage({
                    flow: src_1.CredentialFlow.Issuance,
                    did: src_1.DID.from("did:quarkid:zksync:EiAJcbMpo4OPpisPfqtv8O5_d7ABI1D23ehx2quLhqqIdw")
                }),
            });
        }));
    });
    yield processMessage();
});
exports.credentialIssueForNotOperationalDID = credentialIssueForNotOperationalDID;
//# sourceMappingURL=issue-for-not-operational.js.map
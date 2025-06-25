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
exports.credentialIssuance = void 0;
const src_1 = require("../../src");
const credentialIssuance = (holderAgent, issuerAgent) => __awaiter(void 0, void 0, void 0, function* () {
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
                })));
            }));
            issuerAgent.vc.ackCompleted.on((args) => {
                console.log(args);
                resolve(null);
            });
            issuerAgent.vc.presentationVerified.on((args) => {
                console.log(args);
            });
            yield holderAgent.vc.processMessage({
                message: yield issuerAgent.vc.createInvitationMessage({ flow: src_1.CredentialFlow.Issuance }),
            });
        }));
    });
    yield processMessage();
});
exports.credentialIssuance = credentialIssuance;
//# sourceMappingURL=credential-issuance.js.map
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarkIDCredentialStatusType = exports.PersistanceType = exports.QuarkIDCredentialStatus = void 0;
var vc_core_1 = require("@quarkid/vc-core");
var QuarkIDCredentialStatus = /** @class */ (function (_super) {
    __extends(QuarkIDCredentialStatus, _super);
    function QuarkIDCredentialStatus() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QuarkIDCredentialStatus;
}(vc_core_1.CredentialStatus));
exports.QuarkIDCredentialStatus = QuarkIDCredentialStatus;
var PersistanceType;
(function (PersistanceType) {
    PersistanceType["IPFS"] = "IPFS";
})(PersistanceType = exports.PersistanceType || (exports.PersistanceType = {}));
var QuarkIDCredentialStatusType;
(function (QuarkIDCredentialStatusType) {
    QuarkIDCredentialStatusType["BitArrayStatusEntry"] = "bitArrayStatusEntry";
    QuarkIDCredentialStatusType["RevocationList2020Status"] = "RevocationList2020Status";
    QuarkIDCredentialStatusType["CredentialStatusList2017"] = "CredentialStatusList2017";
})(QuarkIDCredentialStatusType = exports.QuarkIDCredentialStatusType || (exports.QuarkIDCredentialStatusType = {}));
//# sourceMappingURL=quarkid-credential-status.js.map
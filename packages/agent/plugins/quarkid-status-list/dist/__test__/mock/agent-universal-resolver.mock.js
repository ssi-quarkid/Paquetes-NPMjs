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
exports.AgentUniversalRegistryMock = exports.AgentUniversalResolverMock = void 0;
var agent_1 = require("@quarkid/agent");
var AgentUniversalResolverMock = /** @class */ (function () {
    function AgentUniversalResolverMock() {
    }
    AgentUniversalResolverMock.prototype.resolve = function (did) {
        throw new Error("Method not implemented.");
    };
    AgentUniversalResolverMock.prototype.resolveWithMetdata = function (did) {
        throw new Error("Method not implemented.");
    };
    return AgentUniversalResolverMock;
}());
exports.AgentUniversalResolverMock = AgentUniversalResolverMock;
var AgentUniversalRegistryMock = /** @class */ (function (_super) {
    __extends(AgentUniversalRegistryMock, _super);
    function AgentUniversalRegistryMock() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AgentUniversalRegistryMock.prototype.initialize = function (params) {
        throw new Error("Method not implemented.");
    };
    AgentUniversalRegistryMock.prototype.createDID = function (createRequest) {
        throw new Error("Method not implemented.");
    };
    AgentUniversalRegistryMock.prototype.updateDIDDocument = function (updateRequest) {
        throw new Error("Method not implemented.");
    };
    return AgentUniversalRegistryMock;
}(agent_1.IAgentRegistry));
exports.AgentUniversalRegistryMock = AgentUniversalRegistryMock;
//# sourceMappingURL=agent-universal-resolver.mock.js.map
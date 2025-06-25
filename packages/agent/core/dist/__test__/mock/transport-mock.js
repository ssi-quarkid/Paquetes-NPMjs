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
exports.TransportMock = void 0;
const src_1 = require("../../src");
const lite_event_1 = require("../../src/utils/lite-event");
const transportMessages = new Array();
const messageArrived = new lite_event_1.LiteEvent();
class TransportMock {
    constructor() {
        this.messageArrived = new lite_event_1.LiteEvent();
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    transportSupportedByTarget(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    send(params) {
        transportMessages.push(params);
        messageArrived.trigger({
            context: params,
            from: src_1.DID.from(this.currentDID),
            data: params.data.message || params.data
        });
    }
    get onMessageArrived() { return this.messageArrived; }
    initialize(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.agent = params.agent;
            this.currentDID = params.agent.identity.getOperationalDID().value;
            messageArrived.on((message) => {
                if (params.agent.identity.getDIDs().some(y => y == message.context.to.value)) {
                    this.onMessageArrived.trigger(message);
                    this.agent.transport.handleMessage(message, this);
                }
            });
        });
    }
}
exports.TransportMock = TransportMock;
//# sourceMappingURL=transport-mock.js.map
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
exports.LiteEvent = void 0;
class LiteEvent {
    constructor() {
        this.handlers = [];
    }
    on(handler) {
        this.handlers.push({
            h: handler,
            once: false
        });
    }
    off(handler) {
        this.handlers = this.handlers.filter(h => h.h !== handler);
    }
    trigger(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ejecutar los manejadores "once" y eliminarlos
            const onceHandlers = this.handlers.filter(x => x.once).slice(0);
            yield Promise.all(onceHandlers.map((h) => __awaiter(this, void 0, void 0, function* () { return yield h.h(data); })));
            this.handlers = this.handlers.filter(x => !x.once);
            // Ejecutar los manejadores regulares
            const handlers = this.handlers.slice(0);
            yield Promise.all(handlers.map((h) => __awaiter(this, void 0, void 0, function* () { return yield h.h(data); })));
        });
    }
    once(handler) {
        this.handlers.push({
            h: handler,
            once: true
        });
    }
    expose() {
        return this;
    }
}
exports.LiteEvent = LiteEvent;
//# sourceMappingURL=lite-event.js.map
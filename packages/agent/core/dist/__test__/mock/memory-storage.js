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
exports.MemorySecureStorage = exports.MemoryStorage = void 0;
class MemoryStorage {
    constructor() {
        this.mapper = new Map();
    }
    add(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapper.set(key, value);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mapper.get(key);
        });
    }
    update(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapper.set(key, value);
        });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mapper;
        });
    }
    remove(key) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapper.delete(key);
        });
    }
}
exports.MemoryStorage = MemoryStorage;
class MemorySecureStorage {
    constructor() {
        this.mapper = new Map();
    }
    add(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapper.set(key, value);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mapper.get(key);
        });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mapper;
        });
    }
    update(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapper.set(key, value);
        });
    }
    remove(key) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapper.delete(key);
        });
    }
}
exports.MemorySecureStorage = MemorySecureStorage;
//# sourceMappingURL=memory-storage.js.map
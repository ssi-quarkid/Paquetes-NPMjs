export class VCProtocolNotFoundError extends Error {
    constructor() {
        super();

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, VCProtocolNotFoundError.prototype);
    }
}
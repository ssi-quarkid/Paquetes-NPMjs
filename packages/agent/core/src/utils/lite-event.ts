export interface ILiteEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler: { (data?: T): void }): void;
    once(handler: { (data?: T): void });
}

export class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { h: { (data?: T): void }, once: boolean }[] = [];

    public on(handler: { (data?: T): void }): void {
        this.handlers.push({
            h: handler,
            once: false
        });
    }

    public off(handler: { (data?: T): void }): void {
        this.handlers = this.handlers.filter(h => h.h !== handler);
    }

    public trigger(data?: T) {
        this.handlers.filter(x => x.once).slice(0).forEach(h => h.h(data));
        this.handlers = this.handlers.filter(x => !x.once)
        this.handlers.slice(0).forEach(h => h.h(data));
    }

    public once(handler: { (data?: T): void }) {
        this.handlers.push({
            h: handler,
            once: true
        });
    }

    public expose(): ILiteEvent<T> {
        return this;
    }
}
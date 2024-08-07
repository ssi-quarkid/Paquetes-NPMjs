export interface ILiteEvent<T> {
    on(handler: { (data?: T): void | Promise<void> }): void;
    off(handler: { (data?: T): void | Promise<void> }): void;
    once(handler: { (data?: T): void | Promise<void> });
}

export class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { h: { (data?: T): void | Promise<void> }, once: boolean }[] = [];

    public on(handler: { (data?: T): void | Promise<void> }): void {
        this.handlers.push({
            h: handler,
            once: false
        });
    }

    public off(handler: { (data?: T): void | Promise<void> }): void {
        this.handlers = this.handlers.filter(h => h.h !== handler);
    }

    public async trigger(data?: T) {
        // Ejecutar los manejadores "once" y eliminarlos
        const onceHandlers = this.handlers.filter(x => x.once).slice(0);
        await Promise.all(onceHandlers.map(async h => await h.h(data)));
        this.handlers = this.handlers.filter(x => !x.once);

        // Ejecutar los manejadores regulares
        const handlers = this.handlers.slice(0);
        await Promise.all(handlers.map(async h => await h.h(data)));
    }

    public once(handler: { (data?: T): void | Promise<void> }) {
        this.handlers.push({
            h: handler,
            once: true
        });
    }

    public expose(): ILiteEvent<T> {
        return this;
    }
}
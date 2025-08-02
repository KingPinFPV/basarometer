// Logger - Comprehensive logging for Discovery Engine
export class Logger {
    private context: string

    constructor(context: string) {
        this.context = context
    }

    info(message: string, ...args: unknown[]): void {
        console.log(`[${new Date().toISOString()}] [${this.context}] INFO: ${message}`, ...args)
    }

    warn(message: string, ...args: unknown[]): void {
        console.warn(`[${new Date().toISOString()}] [${this.context}] WARN: ${message}`, ...args)
    }

    error(message: string, error?: unknown): void {
        console.error(`[${new Date().toISOString()}] [${this.context}] ERROR: ${message}`, error)
    }

    debug(message: string, ...args: unknown[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${new Date().toISOString()}] [${this.context}] DEBUG: ${message}`, ...args)
        }
    }
}
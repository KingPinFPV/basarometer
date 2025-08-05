// Logger - Comprehensive logging for Discovery Engine
export class Logger {
    private context: string

    constructor(context: string) {
        this.context = context
    }

    info(message: string, ...args: any[]): void {
        // Debug:(`[${new Date().toISOString()}] [${this.context}] INFO: ${message}`, ...args)
    }

    warn(message: string, ...args: any[]): void {
        // Warning:(`[${new Date().toISOString()}] [${this.context}] WARN: ${message}`, ...args)
    }

    error(message: string, error?: any): void {
        // Error:(`[${new Date().toISOString()}] [${this.context}] ERROR: ${message}`, error)
    }

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${new Date().toISOString()}] [${this.context}] DEBUG: ${message}`, ...args)
        }
    }
}
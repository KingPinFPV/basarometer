// Rate Limiter - Prevent overwhelming external services
export class RateLimiter {
    private requests: Date[] = []
    private maxRequestsPerMinute: number = 10
    private minDelayMs: number = 2000

    constructor(maxRequestsPerMinute: number = 10, minDelayMs: number = 2000) {
        this.maxRequestsPerMinute = maxRequestsPerMinute
        this.minDelayMs = minDelayMs
    }

    async waitForSlot(): Promise<void> {
        // Clean old requests (older than 1 minute)
        const oneMinuteAgo = new Date(Date.now() - 60000)
        this.requests = this.requests.filter(req => req > oneMinuteAgo)

        // If we're at the limit, wait
        if (this.requests.length >= this.maxRequestsPerMinute) {
            const oldestRequest = this.requests[0]
            const waitTime = oneMinuteAgo.getTime() - oldestRequest.getTime() + 1000
            if (waitTime > 0) {
                await this.delay(waitTime)
            }
        }

        // Always enforce minimum delay
        if (this.requests.length > 0) {
            const lastRequest = this.requests[this.requests.length - 1]
            const timeSinceLastRequest = Date.now() - lastRequest.getTime()
            if (timeSinceLastRequest < this.minDelayMs) {
                await this.delay(this.minDelayMs - timeSinceLastRequest)
            }
        }

        // Record this request
        this.requests.push(new Date())
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    getStatus(): { requestsInLastMinute: number; maxRequests: number } {
        const oneMinuteAgo = new Date(Date.now() - 60000)
        const recentRequests = this.requests.filter(req => req > oneMinuteAgo)
        
        return {
            requestsInLastMinute: recentRequests.length,
            maxRequests: this.maxRequestsPerMinute
        }
    }
}
import axios from 'axios';

class CaptchaSolver {
    constructor(options = {}) {
        this.capmonsterUrl = options.capmonsterUrl || process.env.CAPMONSTER_URL || 'http://localhost:8081';
        this.apiKey = options.apiKey || process.env.CAPMONSTER_API_KEY || 'demo';
        this.timeout = options.timeout || 120000; // 2 minutes
        this.pollInterval = options.pollInterval || 2000; // 2 seconds
    }

    /**
     * Solve reCAPTCHA v2
     */
    async solveRecaptchaV2(websiteURL, websiteKey, options = {}) {
        try {
            const taskData = {
                type: 'NoCaptchaTaskProxyless',
                websiteURL,
                websiteKey,
                ...options
            };

            const taskId = await this.createTask(taskData);
            const result = await this.waitForResult(taskId);
            
            console.log('✅ reCAPTCHA v2 solved successfully');
            return result.solution.gRecaptchaResponse;
        } catch (error) {
            console.error('❌ Failed to solve reCAPTCHA v2:', error.message);
            throw error;
        }
    }

    /**
     * Solve reCAPTCHA v3
     */
    async solveRecaptchaV3(websiteURL, websiteKey, action = 'submit', minScore = 0.3) {
        try {
            const taskData = {
                type: 'RecaptchaV3TaskProxyless',
                websiteURL,
                websiteKey,
                action,
                minScore
            };

            const taskId = await this.createTask(taskData);
            const result = await this.waitForResult(taskId);
            
            console.log('✅ reCAPTCHA v3 solved successfully');
            return result.solution.gRecaptchaResponse;
        } catch (error) {
            console.error('❌ Failed to solve reCAPTCHA v3:', error.message);
            throw error;
        }
    }

    /**
     * Solve hCaptcha
     */
    async solveHCaptcha(websiteURL, websiteKey) {
        try {
            const taskData = {
                type: 'HCaptchaTaskProxyless',
                websiteURL,
                websiteKey
            };

            const taskId = await this.createTask(taskData);
            const result = await this.waitForResult(taskId);
            
            console.log('✅ hCaptcha solved successfully');
            return result.solution.gRecaptchaResponse;
        } catch (error) {
            console.error('❌ Failed to solve hCaptcha:', error.message);
            throw error;
        }
    }

    /**
     * Solve image-based CAPTCHA with Hebrew support
     */
    async solveImageCaptcha(imageBase64, options = {}) {
        try {
            const taskData = {
                type: 'ImageToTextTask',
                body: imageBase64,
                CapMonsterModule: 'ZennoLab.universal',
                recognizingThreshold: options.threshold || 70,
                Case: options.caseSensitive || false,
                numeric: options.numeric || 0, // 0 = no requirements
                math: options.math || false,
                minLength: options.minLength || 1,
                maxLength: options.maxLength || 20,
                ...options
            };

            const taskId = await this.createTask(taskData);
            const result = await this.waitForResult(taskId);
            
            console.log('✅ Image CAPTCHA solved successfully');
            return result.solution.text;
        } catch (error) {
            console.error('❌ Failed to solve image CAPTCHA:', error.message);
            throw error;
        }
    }

    /**
     * Create a task in CapMonster
     */
    async createTask(taskData) {
        try {
            const response = await axios.post(`${this.capmonsterUrl}/createTask`, {
                clientKey: this.apiKey,
                task: taskData,
                softId: 0
            });

            if (response.data.errorId !== 0) {
                throw new Error(`CapMonster error: ${response.data.errorDescription}`);
            }

            console.log(`📝 Task created with ID: ${response.data.taskId}`);
            return response.data.taskId;
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('CapMonster service not available. Please start Docker container.');
            }
            throw error;
        }
    }

    /**
     * Wait for task result
     */
    async waitForResult(taskId) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < this.timeout) {
            try {
                const response = await axios.post(`${this.capmonsterUrl}/getTaskResult`, {
                    clientKey: this.apiKey,
                    taskId
                });

                if (response.data.errorId !== 0) {
                    throw new Error(`CapMonster error: ${response.data.errorDescription}`);
                }

                if (response.data.status === 'ready') {
                    return response.data;
                } else if (response.data.status === 'processing') {
                    console.log('⏳ CAPTCHA solving in progress...');
                    await this.sleep(this.pollInterval);
                } else {
                    throw new Error(`Unexpected status: ${response.data.status}`);
                }
            } catch (error) {
                if (error.message.includes('CapMonster error')) {
                    throw error;
                }
                console.log('⏳ Waiting for result...');
                await this.sleep(this.pollInterval);
            }
        }

        throw new Error('CAPTCHA solving timeout');
    }

    /**
     * Get account balance
     */
    async getBalance() {
        try {
            const response = await axios.post(`${this.capmonsterUrl}/getBalance`, {
                clientKey: this.apiKey
            });

            if (response.data.errorId !== 0) {
                throw new Error(`CapMonster error: ${response.data.errorDescription}`);
            }

            return response.data.balance;
        } catch (error) {
            console.error('Failed to get balance:', error.message);
            return null;
        }
    }

    /**
     * Test connection to CapMonster
     */
    async testConnection() {
        try {
            const balance = await this.getBalance();
            console.log(`✅ CapMonster connected. Balance: ${balance}`);
            return true;
        } catch (error) {
            console.error('❌ CapMonster connection failed:', error.message);
            return false;
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default CaptchaSolver;
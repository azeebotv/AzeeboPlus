"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerOpenError = exports.CircuitBreaker = exports.CircuitState = void 0;
exports.createCircuitBreaker = createCircuitBreaker;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    state = CircuitState.CLOSED;
    failures = 0;
    successes = 0;
    lastFailure;
    lastSuccess;
    nextAttempt;
    failureThreshold;
    resetTimeout;
    halfOpenRequests;
    halfOpenRequestCount = 0;
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold ?? 5;
        this.resetTimeout = options.resetTimeout ?? 60000;
        this.halfOpenRequests = options.halfOpenRequests ?? 3;
    }
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            if (this.nextAttempt && new Date() >= this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
                this.halfOpenRequestCount = 0;
            }
            else {
                throw new CircuitBreakerOpenError(`Circuit breaker is OPEN. Next attempt at: ${this.nextAttempt?.toISOString()}`);
            }
        }
        if (this.state === CircuitState.HALF_OPEN) {
            if (this.halfOpenRequestCount >= this.halfOpenRequests) {
                throw new CircuitBreakerOpenError('Circuit breaker is HALF_OPEN. Max requests reached.');
            }
            this.halfOpenRequestCount++;
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.successes++;
        this.lastSuccess = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            if (this.halfOpenRequestCount >= this.halfOpenRequests) {
                this.reset();
            }
        }
        else {
            this.failures = 0;
        }
    }
    onFailure() {
        this.failures++;
        this.lastFailure = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            this.tripCircuit();
        }
        else if (this.failures >= this.failureThreshold) {
            this.tripCircuit();
        }
    }
    tripCircuit() {
        this.state = CircuitState.OPEN;
        this.nextAttempt = new Date(Date.now() + this.resetTimeout);
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = undefined;
        this.halfOpenRequestCount = 0;
    }
    getStats() {
        return {
            failures: this.failures,
            successes: this.successes,
            state: this.state,
            lastFailure: this.lastFailure,
            lastSuccess: this.lastSuccess,
            nextAttempt: this.nextAttempt,
        };
    }
    getState() {
        return this.state;
    }
    isOpen() {
        return this.state === CircuitState.OPEN;
    }
    resetCircuit() {
        this.reset();
    }
}
exports.CircuitBreaker = CircuitBreaker;
class CircuitBreakerOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitBreakerOpenError';
    }
}
exports.CircuitBreakerOpenError = CircuitBreakerOpenError;
function createCircuitBreaker(options) {
    return new CircuitBreaker(options);
}
//# sourceMappingURL=circuit-breaker.js.map
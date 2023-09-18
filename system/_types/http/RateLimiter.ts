export type RateLimitEvent = {
    hits: number;

    nextReset: number;

    resetTimeout: number;
};

export type RateLimitOptions = {
    maxRequests: number;

    timeout: number;

    preserveRate?: boolean;

    message?: string;
};
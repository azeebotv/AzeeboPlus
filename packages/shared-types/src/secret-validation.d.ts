export declare function validateStartup(env: Record<string, string | undefined>, service: string, options?: {
    requireAll?: boolean;
}): void;
export declare function isPlaceholderSecret(value: string): boolean;
export declare function validateNoPlaceholders(env: Record<string, string | undefined>, secretKeys: string[]): string[];

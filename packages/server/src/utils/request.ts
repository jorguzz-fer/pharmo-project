/**
 * Safely extracts a string parameter from Express request params/query
 * Handles the Express 5 change where params can be string | string[]
 */
export function getStringParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] || '';
    }
    return value || '';
}

/**
 * Safely extracts a required string parameter from Express request params/query
 * Throws error if parameter is missing
 */
export function getRequiredStringParam(value: string | string[] | undefined, paramName: string): string {
    const result = getStringParam(value);
    if (!result) {
        throw new Error(`Missing required parameter: ${paramName}`);
    }
    return result;
}

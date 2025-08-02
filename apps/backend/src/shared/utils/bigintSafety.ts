/**
 * PostgreSQL bigint range: -9223372036854775808 to 9223372036854775807
 * JavaScript's Number.MAX_SAFE_INTEGER is 9007199254740991
 * We'll use the PostgreSQL bigint max as our limit
 */
const POSTGRES_BIGINT_MAX = 9223372036854775807n;
const POSTGRES_BIGINT_MIN = -9223372036854775808n;

/**
 * Ensures a number value is within PostgreSQL bigint range
 * If the value exceeds the range, it returns the max/min allowed value
 * @param value The number to check
 * @param fieldName Optional field name for logging
 * @returns A safe bigint value
 */
export function ensureBigintSafe(value: number | null | undefined, fieldName?: string): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    // Convert to bigint for comparison
    try {
        const bigValue = BigInt(Math.floor(value));
        
        if (bigValue > POSTGRES_BIGINT_MAX) {
            console.warn(`Value ${value} exceeds PostgreSQL bigint max for field ${fieldName || 'unknown'}. Capping to max.`);
            return Number(POSTGRES_BIGINT_MAX);
        }
        
        if (bigValue < POSTGRES_BIGINT_MIN) {
            console.warn(`Value ${value} is below PostgreSQL bigint min for field ${fieldName || 'unknown'}. Capping to min.`);
            return Number(POSTGRES_BIGINT_MIN);
        }
        
        return value;
    } catch (error) {
        console.error(`Failed to convert value ${value} to bigint for field ${fieldName || 'unknown'}:`, error);
        return null;
    }
}

/*
* Sources:
* - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
* - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
* - https://www.postgresql.org/docs/current/datatype-numeric.html
* - https://sequelize.org/docs/v6/core-concepts/model-basics/#data-types
*/
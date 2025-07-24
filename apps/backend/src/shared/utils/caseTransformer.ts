/**
* Utility functions for transforming between snake_case and camelCase
*/


/**
* Converts a snake_case string to camelCase
*/
export function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
* Converts a camelCase string to snake_case
*/
export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
* Recursively transforms all keys in an object from snake_case to camelCase
*/
export function transformKeysSnakeToCamel(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (obj instanceof Date) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => transformKeysSnakeToCamel(item));
    }

    if (typeof obj === 'object') {
        const transformed: any = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const camelKey = snakeToCamel(key);
                transformed[camelKey] = transformKeysSnakeToCamel(obj[key]);
            }
        }
        
        return transformed;
    }

    return obj;
}

/**
* Recursively transforms all keys in an object from camelCase to snake_case
*/
export function transformKeysCamelToSnake(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (obj instanceof Date) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => transformKeysCamelToSnake(item));
    }

    if (typeof obj === 'object') {
        const transformed: any = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const snakeKey = camelToSnake(key);
                transformed[snakeKey] = transformKeysCamelToSnake(obj[key]);
            }
        }
        
        return transformed;
    }

    return obj;
}

/**
* Transform Sequelize model instance to plain object with camelCase keys
*/
export function modelToResponse(model: any): any {
    if (!model) return model;
    
    // If it's a Sequelize model instance, convert to plain object first
    const plainObject = model.toJSON ? model.toJSON() : model;
    
    // Transform keys to camelCase
    return transformKeysSnakeToCamel(plainObject);
}

/**
* Transform request body from camelCase to snake_case for database operations
*/
export function requestToModel(data: any): any {
    return transformKeysCamelToSnake(data);
}
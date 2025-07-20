import React from "react";

export function isCharacterKey(e: React.KeyboardEvent): boolean {
    return e.key.length === 1 && !e.ctrlKey && !e.metaKey;
}

export function isNumberKey(e: React.KeyboardEvent): boolean {
    return e.key.length === 1 && /^[0-9]$/.test(e.key);
}
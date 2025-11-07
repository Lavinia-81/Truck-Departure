"use client";

import { useState, useEffect } from 'react';

function getStorageValue<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
        return defaultValue;
    }
    const saved = localStorage.getItem(key);
    try {
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
        console.error("Failed to parse JSON from localStorage", e);
        return defaultValue;
    }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Failed to set item in localStorage", e);
        }
    }, [key, value]);

    return [value, setValue];
}

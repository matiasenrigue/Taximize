"use client" 

import React, {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import api from "../../lib/axios";

export interface User {
    id: string;
    username: string;
    email: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Check if user is authenticated based on the presence of user data
    const isAuthenticated = user !== null;
    // Refresh user data from the API
    const refreshUser = async () => {
        try {
            const response = await api.get("/users/me");
            if (response.data.success)
                setUser(response.data.data);
            else
                setUser(null);
        } catch (error) {
            console.warn("Failed to fetch user data:", error);
            setUser(null);
        }
    };
    // Initial fetch of user data when the context is created
    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isAuthenticated, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within a UserProvider");
  return ctx;
};
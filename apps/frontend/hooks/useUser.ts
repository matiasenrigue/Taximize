import { SetStateAction, useEffect, useState } from "react";
import  api  from "../lib/axios";
import { MessageType } from "../components/Message/Message";
import { clearAllTokens } from "../lib/token";
import { useUserContext } from "../contexts/UserContext/UserContext";


export const useUser = () => {
    const { user, setUser, refreshUser } = useUserContext();
    const [error, setError] = useState(null);


    // sign out the user
    const signOut = async () => {
        try {
            // Clear all tokens (access and refresh)
            clearAllTokens();
            setUser(null);
            
            // Redirect to signin page
            window.location.href = '/signin';
            
            return { type: 'success' as MessageType, message: 'Signed out successfully' };
        } catch (err: any) {
            const errorMessage = 'Failed to sign out';
            setError({ ...err, message: errorMessage });
            return { type: 'error' as MessageType, message: errorMessage };
        }
    }

    // delete the user
    const deleteUser = async () => {
        try {
            if (!user?.id) { 
                await refreshUser();
                if (!user?.id) { throw new Error('User not found'); }
             }
            const res = await api.delete(`/user/${user.id}`);
            setUser(null);
            return { type: 'success' as MessageType, message: res?.data?.message || 'User deleted successfully' };
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || 'Failed to delete user';
            setError({ ...err, message: errorMessage });
            return { type: 'error' as MessageType, message: errorMessage || 'Failed to delete user' };
        }
    }
       
    

    // update the user email
    // const updateUserEmail = async (email :string) => {
    //     try {
    //         const res = await api.put('/user/email', { email });
    //         return { type: 'success' as MessageType, message: res?.data?.message || 'User email updated successfully' };
    //     } catch (err: any) {
    //         const errorMessage = err?.response?.data?.error || 'Failed to update user email';
    //         setError({ ...err, message: errorMessage });
    //         return { type: 'error' as MessageType, message: errorMessage || 'Failed to update user email' };
    //     }
    // }

    // update the username
    const updateUsername = async (username: string) => {
        try {
            if (!user?.id) { 
                await refreshUser();
                if (!user?.id) { throw new Error('User not found'); }
             }
            const res = await api.put(`/user/${user.id}/username`, { username });
            return { type: 'success' as MessageType, message: res?.data?.message || 'User username updated successfully' };
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || 'Failed to update user username';
            setError({ ...err, message: errorMessage });
            return { type: 'error' as MessageType, message: errorMessage || 'Failed to update user username' };
        }
    }

    // update the user password
    const updateUserPassword = async(password: string) => {
        try {
            if (!user?.id) { 
                await refreshUser();
                if (!user?.id) { throw new Error('User not found'); }
             }
            const res = await api.put(`/user/${user.id}/password`, { password });
            return { type: 'success' as MessageType, message: res?.data?.message || 'User password updated successfully' };
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || 'Failed to update user password';
            setError({ ...err, message: errorMessage });
            return { type: 'error' as MessageType, message: errorMessage || 'Failed to update user password' };
        }
    }   

    return { user, error, signOut, deleteUser, updateUsername, updateUserPassword, refreshUser };
}
import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

const MyFilesHelperContext = createContext();
{/**
        const loadFiles = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/api/files/my-files/${user.ownerId}`);
            if (response.ok) {
                const userFiles = await response.json();
                setFiles(userFiles);
            } else {
                setError('Failed to load user files');
            }
        } catch (err) {
            setError('Network error while loading user files');
            console.error('Error loading user files:', err);
        } finally {
            setLoading(false);
        }
    };
 */}
export const MyfilesHelperProvider = ({children})=>{
    const [myFilesFromHelper, setMyFilesFromHelper] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    const [currentUserId, setCurrentUserId] = useState(null);


    const userData = localStorage.getItem('currentUser');
    // set user id
    useEffect(()=>{
        if(userData){
            setCurrentUserId(JSON.parse(userData));
            loadFiles();
        }
    },[userData]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/api/files/my-files/${JSON.parse(userData).ownerId}`);
            if (response.ok) {
                const userFiles = await response.json();
                setMyFilesFromHelper(userFiles);
            } else {
                setError('Failed to load user files');
            }
        } catch (err) {
            setError('Network error while loading user files');
            console.error('Error loading user files:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MyFilesHelperContext.Provider value={{myFilesFromHelper, setMyFilesFromHelper, loadFiles, loading, error, currentUserId }}>
            {children}
        </MyFilesHelperContext.Provider>
    )
}
const useMyFilesHelper = () => useContext(MyFilesHelperContext);
export default useMyFilesHelper;
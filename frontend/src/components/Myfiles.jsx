import React, { useState, useEffect } from 'react';

const Myfiles = ({ user }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

    // Load files on component mount
    useEffect(() => {
        loadFiles();
    }, []);

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

    const handleFileDownload = async (fileId, filename) => {
        try {
            setError('');
            setSuccess('');
            const response = await fetch(`${API_BASE_URL}/api/files/download/${fileId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setSuccess(`Downloaded ${filename} successfully!`);
            } else {
                setError('Failed to download file');
            }
        } catch (err) {
            setError('Network error during download');
            console.error('Download error:', err);
        }
    };

    const handleFileDelete = async (fileId, filename) => {
        if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
            return; // User cancelled the deletion
        }

        try {
            setError('');
            setSuccess('');
            const response = await fetch(`${API_BASE_URL}/api/files/delete/${fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess(`File "${filename}" deleted successfully!`);
                // Remove the deleted file from the local state
                setFiles(files.filter(file => file.id !== fileId));
            } else {
                const errorText = await response.text();
                setError(`Failed to delete file: ${errorText}`);
            }
        } catch (err) {
            setError('Network error during file deletion');
            console.error('Delete error:', err);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="container">
            <h1>My Files</h1>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <div className="card">
                <h2>Your Files</h2>
                {loading ? (
                    <div className="loading">Loading your files...</div>
                ) : files.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        No files uploaded yet.
                    </p>
                ) : (
                    <div className="file-list">
                        {files.map((file) => (
                            <div key={file.id} className="file-item">
                                <div className="file-info">
                                    <div className="file-name">{file.filename}</div>
                                    <div className="file-meta">
                                        Size: {formatFileSize(file.size)} |
                                        Type: {file.contentType || 'Unknown'} |
                                        Uploaded: {new Date(file.createdAt || Date.now()).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="file-actions">
                                    <button
                                        onClick={() => handleFileDownload(file.id, file.filename)}
                                        className="btn btn-secondary"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleFileDelete(file.id, file.filename)}
                                        className="btn btn-danger"
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Myfiles;
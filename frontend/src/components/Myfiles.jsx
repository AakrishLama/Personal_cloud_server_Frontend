import React, { useState, useEffect } from 'react';

const Myfiles = ({ user }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fileContent, setFileContent] = useState(''); // Unified state for content
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewedFilename, setViewedFilename] = useState('');
    const [viewedContentType, setViewedContentType] = useState('');
    
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

    useEffect(() => {
        if (user && user.ownerId) {
            loadFiles();
        }
    }, [user]);

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

    const handleFileView = async (fileId, contentType, filename) => {
        try {
            setError('');
            setSuccess('');
            setFileContent(''); // Reset content
            setViewedFilename(filename);
            setViewedContentType(contentType);
            setIsViewerOpen(true);

            const response = await fetch(`${API_BASE_URL}/api/files/download/${fileId}`);
            if (!response.ok) {
                setError('Failed to fetch file content for viewing');
                setFileContent('');
                return;
            }

            if (contentType.startsWith('text/')) {
                const text = await response.text();
                setFileContent(text);
            } else {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                setFileContent(url);
            }
        } catch (err) {
            setError('Network error during file viewing');
            console.error('View error:', err);
            setIsViewerOpen(false); 
        }
    };

    const handleViewerClose = () => {
        setIsViewerOpen(false);
        if (viewedContentType && !viewedContentType.startsWith('text/') && fileContent) {
            window.URL.revokeObjectURL(fileContent);
        }
        setFileContent('');
        setViewedFilename('');
        setViewedContentType('');
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
            return;
        }

        try {
            setError('');
            setSuccess('');
            const response = await fetch(`${API_BASE_URL}/api/files/delete/${fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess(`File "${filename}" deleted successfully!`);
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

    const renderViewerContent = () => {
        if (!fileContent) {
            return <p>Loading file content...</p>;
        }
        if (viewedContentType.startsWith('image/')) {
            return <img src={fileContent} alt={viewedFilename} style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
        }
        if (viewedContentType === 'application/pdf') {
            return (
                <iframe 
                    src={fileContent} 
                    title={viewedFilename} 
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                ></iframe>
            );
        }
        if (viewedContentType.startsWith('text/')) {
            return (
                <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {fileContent}
                    </pre>
                </div>
            );
        }
        
        return <p>Preview not available for this file type.</p>;
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
                                        Uploaded: {new Date(file.uploadDate || Date.now()).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="file-actions">
                                    <button
                                        onClick={() => handleFileView(file.id, file.contentType, file.filename)}
                                        className="btn btn-primary"
                                    >
                                        View
                                    </button>
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

            {isViewerOpen && (
                <div className="modal-backdrop" onClick={handleViewerClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Viewing: {viewedFilename}</h2>
                            <button className="close-btn" onClick={handleViewerClose}>&times;</button>
                        </div>
                        <div className="modal-content">
                            {renderViewerContent()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Myfiles;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user, onLogout }) => {
  const [files, setFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]); // New state for all files
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Load user's files and all files on component mount
  useEffect(() => {
    loadFiles();
    loadAllFiles(); // Call the new function
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/my-files/${user.ownerId}`);
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

  const loadAllFiles = async () => {
    try {
      const response = await fetch(`/api/files/all-files`);
      if (response.ok) {
        const allFilesData = await response.json();
        setAllFiles(allFilesData);
      } else {
        setError('Failed to load all files');
      }
    } catch (err) {
      setError('Network error while loading all files');
      console.error('Error loading all files:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setError('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('ownerId', user.ownerId);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('File uploaded successfully!');
        setSelectedFile(null);
        document.getElementById('fileInput').value = '';
        loadFiles();
        loadAllFiles(); // Reload all files after a successful upload
      } else {
        const errorText = await response.text();
        setError(errorText || 'Upload failed');
      }
    } catch (err) {
      setError('Network error during upload');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`/api/files/download/${fileId}`);
      
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

  const handleLogout = () => {
    onLogout();
    navigate('/login');
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
      <div className="nav">
        <h1>Personal Cloud Server</h1>
        <div className="nav-buttons">
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="welcome-message">
        <h3>Welcome, {user.email}!</h3>
        <p>Upload and manage your files in your personal cloud storage.</p>
      </div>

      <div className="card">
        <h2>Upload New File</h2>
        <form onSubmit={handleFileUpload}>
          <div className="upload-area">
            <input
              type="file"
              id="fileInput"
              onChange={handleFileSelect}
              className="upload-input"
              disabled={uploading}
            />
            <label htmlFor="fileInput" className="upload-label">
              {selectedFile ? selectedFile.name : 'Click to select a file'}
            </label>
            <p style={{ marginTop: '10px', color: '#666' }}>
              {selectedFile && `Selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
            </p>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button 
            type="submit" 
            className="btn btn-success" 
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>
      
      <div className="card">
        <h2>Your Files</h2>
        {loading ? (
          <div className="loading">Loading your files...</div>
        ) : files.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No files uploaded yet. Upload your first file above!
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
                <button
                  onClick={() => handleFileDownload(file.id, file.filename)}
                  className="btn btn-secondary"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>All Files on Server</h2>
        {loading ? (
          <div className="loading">Loading all files...</div>
        ) : allFiles.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No files on the server yet.
          </p>
        ) : (
          <div className="file-list">
            {allFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.filename}</div>
                  <div className="file-meta">
                    Owner: {file.ownerId} |
                    Size: {formatFileSize(file.size)} | 
                    Type: {file.contentType || 'Unknown'} |
                    Uploaded: {new Date(file.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleFileDownload(file.id, file.filename)}
                  className="btn btn-secondary"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import "../ChatUi.css";
import useMyFilesHelper from '../context/MyFilesHelper';

export default function ChatUi() {
    const { myFilesFromHelper, loading, error, currentUserId } = useMyFilesHelper();
    const location = useLocation();
    const { friendUser } = location.state || {};

    const [currentUser, setCurrentUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [chatRoomData, setChatRoomData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFileId, setSelectedFileId] = useState('');

    const API_BASE_URL = 'http://localhost:8080';
    const messagesEndRef = useRef(null);
    const stompClientRef = useRef(null);

    useEffect(() => {
        if (myFilesFromHelper) {
            console.log("myFilesFromHelper:", myFilesFromHelper);
        }
        if (selectedFileId) {
            console.log("selectedFileId:", selectedFileId);
        }
    }, [selectedFileId, myFilesFromHelper]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        setIsLoading(false);
    }, []);

    const getOrCreateChatRoom = async (sender, receiver) => {
        try {
            const response = await fetch(`${API_BASE_URL}/room/${sender}/${receiver}`);
            if (response.ok) {
                const room = await response.json();
                return room;
            } else {
                throw new Error(`Failed to get/create room: ${response.status}`);
            }
        } catch (error) {
            console.error("Couldn't connect to backend", error);
            throw error;
        }
    }

    const loadChatHistory = async (user1, user2) => {
        try {
            const response = await fetch(`${API_BASE_URL}/history/${user1}/${user2}`);
            if (response.ok) {
                const chatHistory = await response.json();
                if (chatHistory) {
                    setMessages(chatHistory);
                }
            }
        } catch (error) {
            console.error("Error loading chatHistory", error);
        }
    }

    useEffect(() => {
        const initializeChat = async () => {
            if (currentUser?.email && friendUser?.email) {
                try {
                    setIsLoading(true);
                    const room = await getOrCreateChatRoom(currentUser.email, friendUser.email);
                    setChatRoomData(room);
                    await loadChatHistory(currentUser.email, friendUser.email);
                } catch (error) {
                    console.error("Error initializing chat:", error);
                } finally {
                    setIsLoading(false);
                    scrollToBottom();
                }
            }
        };

        initializeChat();
    }, [currentUser, friendUser]);

    useEffect(() => {
        if (!currentUser?.email || !friendUser?.email || !chatRoomData?.id) {
            return;
        }

        if (stompClientRef.current?.connected) {
            return;
        }

        console.log("Creating WebSocket connection for room:", chatRoomData.id);

        const socket = new SockJS(`${API_BASE_URL}/ws`);
        const client = Stomp.over(socket);

        client.onConnect = () => {
            console.log("WebSocket connected successfully");
            setIsConnected(true);
            stompClientRef.current = client;

            const chatTopic = `/topic/${chatRoomData.id}`;
            client.subscribe(chatTopic, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    console.log("Real-time message received", body);
                    setMessages((prevMessages) => [...prevMessages, body]);
                    scrollToBottom();
                } catch (error) {
                    console.error("Error parsing message:", error);
                }
            });

            console.log("Subscribed to topic:", chatTopic);
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error:', frame.headers['message'], frame.body);
            setIsConnected(false);
        };

        client.onWebSocketError = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        client.activate();

        return () => {
            if (client && client.connected) {
                console.log("Disconnecting WebSocket");
                client.deactivate();
                setIsConnected(false);
            }
        };
    }, [chatRoomData?.id, currentUser?.email, friendUser?.email]);

    const sendTextMessage = () => {
        if (messageInput.trim() === '' || !friendUser || !stompClientRef.current?.connected || !currentUser) {
            return;
        }

        const newMessage = {
            content: messageInput,
            sender: currentUser.email,
            receiver: friendUser.email,
            messageType: "TEXT"
        };

        stompClientRef.current.send("/app/chat.sendMessage", {}, JSON.stringify(newMessage));
        setMessageInput('');
    };

    const sendFileMessage = () => {
        if (!selectedFileId || !friendUser || !stompClientRef.current?.connected || !currentUser) {
            alert("Please select a file to share");
            return;
        }

        // Find the selected file to get its filename for the message content
        const selectedFile = myFilesFromHelper.find(file => file.id === selectedFileId);
        
        const fileMessage = {
            content: `Shared file: ${selectedFile ? selectedFile.filename : 'File'}`,
            sender: currentUser.email,
            receiver: friendUser.email,
            messageType: "FILE",
            fileId: selectedFileId,
            fileName: selectedFile ? selectedFile.filename : '',
            fileOwnerId: currentUser.email,
            pathOfFile: selectedFile ? selectedFile.storagePath : ''
        };

        console.log("Sending file message:", fileMessage);
        stompClientRef.current.send("/app/chat.sendMessage", {}, JSON.stringify(fileMessage));
        setSelectedFileId('');
    };

    const handleSendMessage = () => {
        if (selectedFileId) {
            sendFileMessage();
        } else {
            sendTextMessage();
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (isLoading) {
        return <div className="chat-container">Loading chat...</div>;
    }

    if (!currentUser) {
        return <div className="chat-container">Please log in to use the chat.</div>;
    }

    return (
        <div className="chat-container">
            <div className="chat-main">
                {/* Chat Header */}
                <div className="chat-header">
                    <div className="chat-header-content">
                        <div className="user-avatar">
                            {friendUser?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <h2>{friendUser ? friendUser.username : 'No user selected'}</h2>
                            <p className="connection-status">
                                {isConnected ? '🟢 Online' : '🔴 Offline'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="no-messages">
                            <div className="no-messages-icon">💬</div>
                            <p>No messages yet</p>
                            <p className="subtext">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        <div className="messages-container">
                            {messages.map((msg, index) => {
                                const isSender = msg.sender === currentUser.email;
                                const isFileMessage = msg.messageType === "FILE";
                                
                                return (
                                    <div
                                        key={index}
                                        className={`message-bubble ${isSender ? 'sent' : 'received'} ${isFileMessage ? 'file-message' : ''}`}
                                    >
                                        <div className="message-content">
                                            {isFileMessage ? (
                                                <div className="file-message-content">
                                                    <div className="file-icon">📎</div>
                                                    <div className="file-info">
                                                        <p className="file-name">{msg.fileName || 'File'}</p>
                                                        <p className="file-meta">
                                                            File shared • {msg.content}
                                                        </p>
                                                        <div className="file-metadata-debug">
                                                            <small>File ID: {msg.fileId}</small>
                                                            <small>Path: {msg.pathOfFile}</small>
                                                            <small>Owner: {msg.fileOwnerId}</small>
                                                            <small>Type: {msg.messageType}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                            <span className="message-time">
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Now'}
                                            </span>
                                        </div>
                                        {!isSender && (
                                            <div className="message-sender">
                                                {msg.sender === friendUser.email ? friendUser.username : msg.sender}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {friendUser && (
                    <div className="chat-input-area">
                        <div className="input-container">
                            <textarea
                                className="message-input"
                                placeholder='Type your message...'
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                disabled={!isConnected}
                                rows={1}
                            />
                            
                            {/* File selection dropdown */}
                            <select 
                                value={selectedFileId} 
                                onChange={(e) => setSelectedFileId(e.target.value)}
                                className="file-selector"
                            >
                                <option value="">Select file to share</option>
                                {myFilesFromHelper && myFilesFromHelper.map((file) => (
                                    <option key={file.id} value={file.id}>
                                        📎 {file.filename} ({file.contentType})
                                    </option>
                                ))}
                            </select>

                            <button
                                className="send-button"
                                onClick={handleSendMessage}
                                disabled={!isConnected || (messageInput.trim() === '' && !selectedFileId)}
                                title={selectedFileId ? "Share selected file" : "Send message"}
                            >
                                {selectedFileId ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        
                        {/* Debug info */}
                        <div className="debug-info">
                            <small>
                                {selectedFileId ? `Selected file: ${selectedFileId}` : 'Type a message or select a file'}
                            </small>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
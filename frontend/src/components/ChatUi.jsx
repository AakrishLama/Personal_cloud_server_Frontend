import React, { useEffect, useState, useRef, useContext} from 'react';
import { useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import "../ChatUi.css";

// import myfileshelper context
import useMyFilesHelper from '../context/MyFilesHelper';

export default function ChatUi() {
    //! myfiles from context to share .
    const { myFilesFromHelper, loading, error, currentUserId } = useMyFilesHelper();
    const location = useLocation();
    const { friendUser } = location.state || {};

    // Safely get currentUser from localStorage with null check
    const [currentUser, setCurrentUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [chatRoomData, setChatRoomData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [file, setFile]= useState(null);
    const [messageAndFile, setMessageAndFile] = useState(null);

    const API_BASE_URL = 'http://localhost:8080';
    const messagesEndRef = useRef(null);
    const stompClientRef = useRef(null);

    useEffect(()=>{
        if(myFilesFromHelper){
            console.log("myFilesFromhelper:", myFilesFromHelper);
            // for (const file of myFilesFromHelper ){
            //     console.log("file:", file.filename);
            // }
        }
        if(file){
            console.log("file selected:", file);
        }
    },[file]);



    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load current user from localStorage on component mount
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

    // Get or create chat room
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

    // Load chat history
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

    // Initialize chat room and load history when users are available
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

    // WebSocket connection and subscription
    useEffect(() => {
        // Don't connect if missing required data
        if (!currentUser?.email || !friendUser?.email || !chatRoomData?.id) {
            return;
        }

        // Don't reconnect if already connected
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

            // Subscribe to the topic using the chat room ID
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
            
            // Debug subscription to see all messages
            client.subscribe(`/**`, (message) => {
                console.log("DEBUG - All messages - Destination:", message.headers.destination, "Body:", message.body);
            });
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

        // Cleanup function
        return () => {
            if (client && client.connected) {
                console.log("Disconnecting WebSocket");
                client.deactivate();
                setIsConnected(false);
            }
        };
    }, [chatRoomData?.id, currentUser?.email, friendUser?.email]);

    const sendMessage = () => {
        if (messageInput.trim() === '' || !friendUser || !stompClientRef.current?.connected || !currentUser) {
            return;
        }
        
        const newMessage = {
            content: messageInput,
            sender: currentUser.email,
            receiver: friendUser.email,
        };

        // Send to backend via STOMP
        stompClientRef.current.send("/app/chat.sendMessage", {}, JSON.stringify(newMessage));
        
        // Clear input immediately
        setMessageInput('');
    };

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (isLoading) {
        return <div className="chat-container">Loading chat...</div>;
    }

    if (!currentUser) {
        return <div className="chat-container">Please log in to use the chat.</div>;
    }

    const handleFileChange=(e)=>{
        setFile(e.target.files[0]);
        console.log("selected file :",e.target.files[0]);
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
                                return (
                                    <div
                                        key={index}
                                        className={`message-bubble ${isSender ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">
                                            <p>{msg.content}</p>
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
                                        sendMessage();
                                    }
                                }}
                                disabled={!isConnected}
                                rows={1}
                            />
                            {/** allow the user to select the file from myFilesFromHelper*/}
                            <select>
                                {myFilesFromHelper.map((file, index) => (
                                    <option key={index}>{file.filename}</option>
                                ))}
                            </select>
                            <button 
                                className="send-button"
                                onClick={sendMessage}
                                disabled={!isConnected || messageInput.trim() === ''}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
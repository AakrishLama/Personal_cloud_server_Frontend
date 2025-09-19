import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import "../ChatUi.css";

export default function ChatUi() {
    const location = useLocation();
    const { friendUser } = location.state || {};

    // Safely get currentUser from localStorage with null check
    const [currentUser, setCurrentUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [chatRoomData, setChatRoomData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE_URL = 'http://localhost:8080';
    const messagesEndRef = useRef(null);
    const stompClientRef = useRef(null);

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

    return (
        <div className="chat-container">
            <div className="chat-main">
                <div className="chat-header">
                    <h2>
                        {friendUser ? `Chat with ${friendUser.username}` : 'No user selected'}
                        <span style={{marginLeft: '10px', fontSize: '14px', color: isConnected ? 'green' : 'red'}}>
                            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                        </span>
                    </h2>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <p className="no-messages">No messages yet. Say hello!</p>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender === currentUser.email ? 'sent' : 'received'}`}
                            >
                                <div className="message-content">{msg.content}</div>
                                <div className="message-timestamp">
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Now'}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {friendUser && (
                    <div className="chat-input-area">
                        <textarea
                            className="message-input"
                            placeholder='Enter your message...'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={!isConnected}
                        />
                        <button 
                            className="send-btn" 
                            onClick={sendMessage}
                            disabled={!isConnected || messageInput.trim() === '' || !currentUser}
                        >
                            {isConnected ? 'Send' : 'Connecting...'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
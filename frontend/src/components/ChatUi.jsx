import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import "../ChatUi.css"; // The path to your CSS file

export default function ChatUi() {
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState(["hello"]); // This state will hold chat messages
    
    // Get the state passed from Myfriends component
    const location = useLocation();
    const { friendUser } = location.state || {};
    
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    
    // Get the current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('Current User:', currentUser);
    console.log("Receiver:", friendUser);

    // This ref will be used to scroll to the bottom of the chat
    const messagesEndRef = useRef(null);

    // Function to scroll to the bottom of the message list
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Update messages and scroll to the bottom whenever the messages state changes
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = () => {
        if (messageInput.trim() === '' || !friendUser) {
            return;
        }

        const newMessage = {
            content: messageInput,
            sender: currentUser.email, // Use currentUser's email as the sender
            receiver: friendUser.email, // Use friendUser's email as the receiver
            timestamp: new Date().toISOString(),
        };

        // Add the new message to the messages state
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        setMessageInput('');
        
        // TODO: You will need to implement the actual API call here
        // to send the message to your backend via WebSocket or REST.
    };
    
    return (
        <div className="chat-container">
            <div className="chat-main">
                <div className="chat-header">
                    <h2>
                        {friendUser ? `Chat with ${friendUser.username}` : 'No user selected'}
                    </h2>
                </div>
                <div className="chat-messages">
                    {messages.length === 0 && friendUser ? (
                        <p className="no-messages">No messages yet. Say hello!</p>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender === currentUser.email ? 'sent' : 'received'}`}
                            >
                                <div className="message-content">{msg.content}</div>
                                <div className="message-timestamp">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    )}
                    {/* This div is the target for our scroll ref */}
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
                                    e.preventDefault(); // Prevent new line
                                    sendMessage();
                                }
                            }}
                        ></textarea>
                        <button className="send-btn" onClick={sendMessage}>Send</button>
                    </div>
                )}
            </div>
        </div>
    );
}
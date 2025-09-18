import React, { useEffect, useState, useRef } from 'react';

import { useLocation } from 'react-router-dom';

import SockJS from 'sockjs-client';

import { Client, Stomp } from '@stomp/stompjs';

import "../ChatUi.css"; // The path to your CSS file

export default function ChatUi() {
    const location = useLocation();

    const { friendUser } = location.state || {};
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    //! console.log('Current User:', currentUser.email);

    //! console.log("Receiver:", friendUser.email);

    const [messageInput, setMessageInput] = useState('');

    const [messages, setMessages] = useState([]); // This state will hold chat messages

    //todo state for sender and receiver

    const [user1, setUser1] = useState(currentUser.email); // [user1, setUser]

    const [user2, setUser2] = useState(friendUser.email);

    const [isLoading, setIsLoading] = useState(true);

    const [isConnected, setIsConnected] = useState(false);

    const [chatRoomData, setChatRoomData] = useState(null);




    const API_BASE_URL = 'http://localhost:8080';



    // Get the current user from localStorage





    // This ref will be used to scroll to the bottom of the chat

    const messagesEndRef = useRef(null);



    // Function to scroll to the bottom of the message list

    const scrollToBottom = () => {

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    };



    //todo functino to get or create a chat room.

    const getOrCreateChatRoom = async (sender, receiver) => {

        try {
            const response = await fetch(`${API_BASE_URL}/room/${sender}/${receiver}`, {
                method: "Get",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (response.ok) {
                console.log("okkkkkk in getchatroom")
                return await response.json();
            }
            console.log("Room not created")

        } catch (error) {

            // couldnt connect to backend

            console.error("couldnt connect to backend", error);

            throw error



        }



    }



    //todo function to load chat history

    const loadChatHistory = async () => {

        try {

            const response = await fetch(`${API_BASE_URL}/history/${user1}/${user2}`, {

                method: "Get",

                headers: {

                    "Content-Type": "application/json"

                }

            });

            if (response.ok) {
                console.log("okkkkkk in load history")
                const chatHistory = await response.json();
                if (chatHistory) {
                    setMessages(chatHistory);
                }

            }

        } catch (error) {

            // couldnt connect to backend

            console.error("error loading chatHistory", error);

            throw error

        }

    }



    useEffect(() => {
        const checkChatRoom = async () => {
            if (user1 && user2) {
                try {
                    const room = await getOrCreateChatRoom(user1, user2);
                    const history = await loadChatHistory();
                    console.log("room,", room);
                    console.log("history,", history);
                } catch (error) {
                    console.error("Error checking/creating chat room:", error);
                }
            }
        }
        scrollToBottom();
        checkChatRoom();

    }, [messages]);




    const sendMessage = () => {

        // call getorcreate chat 






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
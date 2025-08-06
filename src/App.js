import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

// --- SVG Icons for UI ---
const BackArrowIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 4l1.41 1.41L7.83 11H20v2H7.83l5.58 5.59L12 20l-8-8 8-8z"></path>
    </svg>
);

const SendIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
    </svg>
);


// Initialize socket connection using environment variable
// Make sure REACT_APP_API_URL is set in your .env file
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

function App() {
    // --- State Management ---
    const [messages, setMessages] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [isChatActive, setIsChatActive] = useState(false); // For mobile view toggle
    const messagesEndRef = useRef(null); // To auto-scroll to the latest message

    // --- Data Fetching and Real-Time Updates ---
    // Fetch initial messages on component mount
    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/messages`)
            .then(res => setMessages(res.data))
            .catch(err => console.error('Error fetching messages:', err));
    }, []);

    // Set up WebSocket listeners
    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('newMessage', (msg) => {
            // Add new message to the existing list
            setMessages(prevMessages => [...prevMessages, msg]);
        });

        // Clean up the socket connection when the component unmounts
        return () => {
            socket.off('connect');
            socket.off('newMessage');
        };
    }, []);

    // --- Data Processing ---
    // Memoize conversations to avoid re-calculating on every render
    const conversations = useMemo(() => {
        const grouped = messages.reduce((acc, msg) => {
            // Group messages by wa_id
            if (!acc[msg.wa_id]) {
                acc[msg.wa_id] = {
                    name: msg.name,
                    messages: []
                };
            }
            acc[msg.wa_id].messages.push(msg);
            return acc;
        }, {});

        // Sort messages within each conversation by timestamp
        for (const wa_id in grouped) {
            grouped[wa_id].messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        return grouped;
    }, [messages]);

    // --- Auto-Scrolling ---
    // Scroll to the bottom of the messages container when a new message arrives
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChatId]);


    // --- Event Handlers ---
    const handleSend = async (e) => {
        e.preventDefault();
        // Ensure there's an active chat and a message to send
        if (!newMessage.trim() || !activeChatId) return;

        try {
            // The name is retrieved from the conversation data
            const name = conversations[activeChatId]?.name;
            if (!name) {
                console.error("Could not find name for the active chat.");
                return;
            }

            // POST new message to the backend
            await axios.post(`${process.env.REACT_APP_API_URL}/api/messages/send`, {
                wa_id: activeChatId,
                name: name,
                message: newMessage
            });
            // Clear the input field after sending
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleChatSelect = (wa_id) => {
        setActiveChatId(wa_id);
        setIsChatActive(true); // Switch to chat view on mobile
    };

    const handleBackToSidebar = () => {
        setIsChatActive(false); // Switch back to sidebar view on mobile
        setActiveChatId(null); // Deselect chat
    };

    const activeConversation = conversations[activeChatId];

    // --- JSX Rendering ---
    return (
        <div className={`whatsapp-clone ${isChatActive ? 'chat-active' : ''}`}>
            {/* --- Sidebar (Left Panel) --- */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h3>Chats</h3>
                </div>
                <div className="sidebar-chats-list">
                    {Object.keys(conversations).map(wa_id => {
                        const conversation = conversations[wa_id];
                        const lastMessage = conversation.messages[conversation.messages.length - 1];
                        return (
                            <div
                                key={wa_id}
                                className={`sidebar-chat ${activeChatId === wa_id ? 'active' : ''}`}
                                onClick={() => handleChatSelect(wa_id)}
                            >
                                <div className="chat-info">
                                    <p className="chat-name">{conversation.name}</p>
                                    <p className="chat-id">{wa_id}</p>
                                    <p className="chat-last-message">
                                        {lastMessage ? lastMessage.message : 'No messages yet'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Chat Window (Right Panel) --- */}
            <div className="chat-window">
                {activeConversation ? (
                    <>
                        <header className="chat-header">
                            <button className="back-button" onClick={handleBackToSidebar}>
                                <BackArrowIcon />
                            </button>
                            <div className="chat-header-info">
                                <h4>{activeConversation.name}</h4>
                                <span>{activeChatId}</span>
                            </div>
                        </header>

                        <main className="messages-container">
                            {activeConversation.messages.map((msg, index) => (
                                <div key={index} className={`message-bubble ${msg.from_me ? 'sent' : 'received'}`}>
                                    <p>{msg.message}</p>
                                    <span className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </main>

                        <footer className="message-form-container">
                            <form className="message-form" onSubmit={handleSend}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message"
                                />
                                <button type="submit"><SendIcon /></button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <h2>WhatsApp Web Clone</h2>
                        <p>Select a chat to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

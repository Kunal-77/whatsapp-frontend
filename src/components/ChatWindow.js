import React, { useState } from 'react';
import axios from 'axios';
import './ChatWindow.css';

const ChatWindow = ({ selectedUser, messages, wa_id, name, setWaId, setName }) => {
    const [input, setInput] = useState('');

    if (!selectedUser) {
        return <div className="chat-window">Select a chat to view messages</div>;
    }

    const filteredMessages = messages.filter(msg => msg.wa_id === selectedUser.wa_id);

    const sendMessage = async () => {
        const newMsg = {
            wa_id: selectedUser.wa_id,
            name: selectedUser.name,
            message: input,
            timestamp: new Date(),
            status: 'sent'
        };

        try {
            await axios.post('http://localhost:5000/api/messages/send', newMsg);
            setInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <strong>{selectedUser.name}</strong> <span>({selectedUser.wa_id})</span>
            </div>

            <div className="chat-messages">
                {filteredMessages.map((msg, i) => (
                    <div key={i} className="chat-bubble">
                        <p>{msg.message}</p>
                        <span className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString()} | {msg.status}
                        </span>
                    </div>
                ))}
            </div>

            <div className="chat-input">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatWindow;

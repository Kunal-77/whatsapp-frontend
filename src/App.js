import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

const socket = io(process.env.REACT_APP_API_URL); // Use backend from .env

function App() {
    const [messages, setMessages] = useState([]);
    const [wa_id, setWaId] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/messages`)
            .then(res => setMessages(res.data))
            .catch(err => console.error('Error fetching messages:', err));
    }, []);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('newMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => socket.disconnect();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!wa_id || !name || !message) return;

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/messages/send`, {
                wa_id, name, message
            });
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>WhatsApp Web Clone (Real-Time)</h2>
            <form onSubmit={handleSend}>
                <input value={wa_id} onChange={e => setWaId(e.target.value)} placeholder="WA ID" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" />
                <button type="submit">Send</button>
            </form>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.name} ({msg.wa_id}):</strong> {msg.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;

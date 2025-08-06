import React from 'react';
import './Sidebar.css';

const Sidebar = ({ chats, onSelectChat }) => {
    return (
        <div className="sidebar">
            <h2 className="title">Chats</h2>
            {chats.map(chat => (
                <div key={chat.wa_id} className="chat-item" onClick={() => onSelectChat(chat)}>
                    <strong>{chat.name}</strong>
                    <p>{chat.wa_id}</p>
                </div>
            ))}
        </div>
    );
};

export default Sidebar;

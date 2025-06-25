import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import styled from 'styled-components';
import axios from 'axios';

const ChatContainer = styled.div`
  width: 100%;
  height: 80vh;
  max-height: 800px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0 auto;
`;
const ChatHeader = styled.div`
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: #fff;
  padding: 28px 32px;
  font-weight: bold;
  font-size: 2rem;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
`;
const ChatBody = styled.div`
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  background: #f4f8fb;
  display: flex;
  flex-direction: column;
`;
const ChatInputArea = styled.form`
  display: flex;
  align-items: center;
  padding: 24px 32px;
  background: #f0f4f8;
  border-top: 1px solid #e3e8ee;
`;
const ChatInput = styled.input`
  flex: 1;
  border: none;
  border-radius: 16px;
  padding: 16px 20px;
  margin-right: 12px;
  font-size: 1.1rem;
  background: #fff;
  box-shadow: 0 1px 4px rgba(66,165,245,0.06);
`;
const SendButton = styled.button`
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px 28px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.10);
  transition: background 0.2s;
  &:hover {
    background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
  }
`;
const MessageRow = styled.div`
  display: flex;
  flex-direction: ${props => props.own ? 'row-reverse' : 'row'};
  margin-bottom: 22px;
`;
const MessageBubble = styled.div`
  background: ${props => props.own ? 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' : '#e3e8ee'};
  color: ${props => props.own ? '#fff' : '#222'};
  padding: 18px 22px;
  border-radius: 22px;
  max-width: 60%;
  word-break: break-word;
  font-size: 1.1rem;
  position: relative;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.06);
`;
const ImagePreview = styled.img`
  max-width: 260px;
  max-height: 260px;
  border-radius: 12px;
  margin-top: 10px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.10);
`;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ChatBox = ({ username, role, senderId, senderRole, receiverId, receiverRole }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const stompClient = useRef(null);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (!senderId || !receiverId) return;
    // Connect websocket
    const socket = new SockJS(`${API_BASE}/ws-chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      onConnect: () => {
        // Subscribe đúng topic 1-1
        const topic = `/topic/chat.${senderId}.${receiverId}`;
        client.subscribe(topic, (msg) => {
          const body = JSON.parse(msg.body);
          setMessages(prev => [...prev, body]);
        });
        // Notify join
        client.publish({
          destination: '/app/chat.addUser',
          body: JSON.stringify({ sender: username, type: 'JOIN' })
        });
      },
    });
    client.activate();
    stompClient.current = client;
    return () => client.deactivate();
  }, [username, senderId, receiverId]);

  useEffect(() => {
    // Scroll to bottom
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input && !image) return;
    let content = input;
    let type = 'CHAT';
    // Nếu có ảnh, upload trước
    let imageUrl = null;
    if (image) {
      const formData = new FormData();
      formData.append('file', image);
      try {
        const res = await axios.post(`${API_BASE}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = res.data.url;
      } catch (err) {
        alert('Lỗi upload ảnh!');
        return;
      }
    }
    if (imageUrl) {
      content = content ? `${content}\n${imageUrl}` : imageUrl;
    }
    stompClient.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        sender: username,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        content,
        type
      })
    });
    setInput('');
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>Chat hỗ trợ khách hàng</ChatHeader>
      <ChatBody ref={chatBodyRef}>
        {messages.map((msg, idx) => {
          const own = msg.sender === username;
          // Tách nội dung và ảnh nếu có
          const parts = msg.content ? msg.content.split(/\n|\r/) : [];
          return (
            <MessageRow key={idx} own={own}>
              <MessageBubble own={own}>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>{msg.sender}</div>
                {parts.map((part, i) =>
                  part.match(/^https?:\/\//) && (part.endsWith('.jpg') || part.endsWith('.png') || part.endsWith('.jpeg')) ? (
                    <ImagePreview key={i} src={part} alt="img" />
                  ) : (
                    <div key={i}>{part}</div>
                  )
                )}
              </MessageBubble>
            </MessageRow>
          );
        })}
      </ChatBody>
      <ChatInputArea onSubmit={handleSend}>
        <ChatInput
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <input type="file" accept="image/*" style={{ display: 'none' }} id="chat-img-upload" onChange={handleImageChange} />
        <label htmlFor="chat-img-upload" style={{ marginRight: 12, cursor: 'pointer' }}>
          <svg width="28" height="28" fill="#1976d2" viewBox="0 0 24 24"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zm-2 0H5V5h14zm-7-3l2.03 2.71a1 1 0 0 0 1.54 0L19 14.13V19H5v-2.87l3.47-4.63a1 1 0 0 1 1.54 0z"/></svg>
        </label>
        {imagePreview && <ImagePreview src={imagePreview} alt="preview" />}
        <SendButton type="submit">Gửi</SendButton>
      </ChatInputArea>
    </ChatContainer>
  );
};

export default ChatBox; 
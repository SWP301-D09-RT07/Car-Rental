import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { FaPaperPlane, FaImage, FaTimes } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ChatBox = ({ username, role, senderId, senderRole, receiverId, receiverRole }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
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
        setIsConnected(true);
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
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setIsConnected(false);
      }
    });
    
    client.activate();
    stompClient.current = client;
    
    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
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
    if (!isConnected) {
      alert('Chưa kết nối được với server!');
      return;
    }
    
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Chỉ chấp nhận file ảnh!');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File ảnh không được vượt quá 5MB!');
        return;
      }
      
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  return (
    <div className="w-full h-80vh max-h-800px bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-6 font-bold text-2xl tracking-wide shadow-lg">
        <div className="flex items-center justify-between">
          <span>Chat hỗ trợ khách hàng</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-normal">
              {isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div 
        ref={chatBodyRef}
        className="flex-1 p-8 overflow-y-auto bg-gray-50 flex flex-col"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Chưa có tin nhắn nào</p>
              <p className="text-sm">Bắt đầu cuộc trò chuyện ngay!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const own = msg.sender === username;
            // Tách nội dung và ảnh nếu có
            const parts = msg.content ? msg.content.split(/\n|\r/) : [];
            
            return (
              <div key={idx} className={`flex ${own ? 'justify-end' : 'justify-start'} mb-6`}>
                <div className={`max-w-xs lg:max-w-md ${own ? 'order-2' : 'order-1'}`}>
                  <div className={`px-6 py-4 rounded-3xl ${
                    own 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                      : 'bg-white text-gray-800 shadow-md'
                  }`}>
                    <div className={`font-semibold text-sm mb-2 ${
                      own ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {msg.sender}
                    </div>
                    {parts.map((part, i) =>
                      part.match(/^https?:\/\//) && (part.endsWith('.jpg') || part.endsWith('.png') || part.endsWith('.jpeg')) ? (
                        <img 
                          key={i} 
                          src={part} 
                          alt="img" 
                          className="max-w-full max-h-64 rounded-xl mt-2 shadow-lg"
                        />
                      ) : (
                        <div key={i} className="text-sm leading-relaxed">{part}</div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex items-center p-6 bg-gray-100 border-t border-gray-200">
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border-none rounded-2xl px-5 py-4 mr-3 text-base bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        
        {/* Image Upload */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          id="chat-img-upload" 
          onChange={handleImageChange} 
        />
        <label 
          htmlFor="chat-img-upload" 
          className="mr-3 cursor-pointer p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
          title="Gửi ảnh"
        >
          <FaImage size={20} />
        </label>
        
        {/* Send Button */}
        <button 
          type="submit"
          disabled={!input && !image}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none rounded-xl px-7 py-4 font-bold text-base cursor-pointer shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <FaPaperPlane className="mr-2" />
          Gửi
        </button>
      </form>

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="preview" 
              className="max-w-48 max-h-48 rounded-lg shadow-md"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox; 
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createConsumer, Consumer, Subscription } from '@rails/actioncable';

interface Message {
  id: number;
  content: string;
  username: string;
  created_at: string;
}

const BACKEND_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const consumerRef = useRef<Consumer | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await api.get('/messages');
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Set up WebSocket connection
    consumerRef.current = createConsumer(`ws://localhost:3001/cable`);

    subscriptionRef.current = consumerRef.current.subscriptions.create(
      { channel: 'ChatChannel' },
      {
        connected() {
          console.log('Connected to chat channel');
          setIsConnected(true);
        },
        disconnected() {
          console.log('Disconnected from chat channel');
          setIsConnected(false);
        },
        received(data: Message) {
          console.log('Received message:', data);
          setMessages(prevMessages => {
            // Check if message already exists to avoid duplicates
            const messageExists = prevMessages.some(msg => msg.id === data.id);
            if (messageExists) {
              return prevMessages;
            }
            return [...prevMessages, data];
          });
        }
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (consumerRef.current) {
        consumerRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !username.trim()) {
      alert('Please enter both username and message');
      return;
    }

    try {
      await api.post(`/messages`, {
        message: {
          content: newMessage,
          username: username
        }
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Live Chat</h1>
          <div className="flex items-center mt-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className="mb-4 p-3 bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-semibold text-blue-600 mr-2">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-black flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="text-black flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!isConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

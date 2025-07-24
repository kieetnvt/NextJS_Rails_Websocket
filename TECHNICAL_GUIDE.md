# Technical Implementation Guide: NextJS + Rails WebSocket Application

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend Implementation (Rails + Action Cable)](#backend-implementation)
3. [Frontend Implementation (Next.js + TypeScript)](#frontend-implementation)
4. [WebSocket Communication Flow](#websocket-communication-flow)
5. [Database Design](#database-design)
6. [Security Considerations](#security-considerations)
7. [Deployment Strategy](#deployment-strategy)
8. [Performance Optimizations](#performance-optimizations)

## Architecture Overview

### System Architecture
```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│   Next.js App   │ ◄─────────────────► │   Rails API     │
│   (Frontend)    │     Port 3000        │   (Backend)     │
│                 │                      │   Port 3001     │
└─────────────────┘                      └─────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────┐                      ┌─────────────────┐
│   Browser       │                      │  PostgreSQL     │
│   WebSocket     │                      │   Database      │
│   Client        │                      │                 │
└─────────────────┘                      └─────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, @rails/actioncable
- **Backend**: Ruby on Rails 7.1, Action Cable, PostgreSQL
- **Communication**: REST API + WebSocket (Action Cable)
- **Development**: VS Code with custom tasks

## Backend Implementation (Rails + Action Cable)

### 1. Rails API Setup

#### Gemfile Configuration
```ruby
# Essential gems for WebSocket functionality
gem "rails", "~> 7.1.5"
gem "pg", "~> 1.1"                    # PostgreSQL adapter
gem "redis", ">= 4.0.1"              # Action Cable adapter
gem "rack-cors"                       # CORS handling
gem "puma", ">= 5.0"                  # Web server
```

#### CORS Configuration (`config/initializers/cors.rb`)
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:3000", "http://127.0.0.1:3000"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

### 2. Database Model

#### Message Model (`app/models/message.rb`)
```ruby
class Message < ApplicationRecord
  validates :content, presence: true, length: { maximum: 1000 }
  validates :username, presence: true, length: { maximum: 50 }

  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :by_date, -> { order(created_at: :asc) }
end
```

#### Migration (`db/migrate/xxx_create_messages.rb`)
```ruby
class CreateMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :messages do |t|
      t.text :content, null: false
      t.string :username, null: false, limit: 50
      t.timestamps
    end

    add_index :messages, :created_at
    add_index :messages, :username
  end
end
```

### 3. REST API Controller

#### Messages Controller (`app/controllers/messages_controller.rb`)
```ruby
class MessagesController < ApplicationController
  before_action :validate_message_params, only: [:create]

  def index
    @messages = Message.by_date.includes(:created_at)
    render json: @messages.map { |message| serialize_message(message) }
  end

  def create
    @message = Message.new(message_params)

    if @message.save
      # Broadcast to WebSocket subscribers
      broadcast_message(@message)
      render json: serialize_message(@message), status: :created
    else
      render json: { errors: @message.errors.full_messages },
             status: :unprocessable_entity
    end
  end

  private

  def message_params
    params.require(:message).permit(:content, :username)
  end

  def validate_message_params
    unless params[:message]&.key?(:content) && params[:message]&.key?(:username)
      render json: { error: "Missing required parameters" },
             status: :bad_request
    end
  end

  def broadcast_message(message)
    ChatChannel.broadcast_to("chat_room", serialize_message(message))
  end

  def serialize_message(message)
    {
      id: message.id,
      content: message.content,
      username: message.username,
      created_at: message.created_at.iso8601
    }
  end
end
```

### 4. Action Cable Channel

#### Chat Channel (`app/channels/chat_channel.rb`)
```ruby
class ChatChannel < ApplicationCable::Channel
  def subscribed
    # Subscribe to the chat room stream
    stream_for "chat_room"
    logger.info "User subscribed to chat_room"
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
    logger.info "User unsubscribed from chat_room"
  end

  def receive(data)
    # Handle incoming WebSocket messages
    logger.info "Received data: #{data}"

    # Validate incoming data
    return unless valid_message_data?(data)

    # Create message through the model
    message = Message.create!(
      content: data['content'],
      username: data['username']
    )

    # Broadcast to all subscribers
    ChatChannel.broadcast_to("chat_room", {
      id: message.id,
      content: message.content,
      username: message.username,
      created_at: message.created_at.iso8601
    })
  rescue ActiveRecord::RecordInvalid => e
    # Handle validation errors
    logger.error "Failed to create message: #{e.message}"
  end

  private

  def valid_message_data?(data)
    data.is_a?(Hash) &&
    data['content'].present? &&
    data['username'].present?
  end
end
```

#### Connection Configuration (`app/channels/application_cable/connection.rb`)
```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # You can add authentication here if needed
    # identified_by :current_user

    def connect
      logger.info "WebSocket connection established"
    end

    def disconnect
      logger.info "WebSocket connection closed"
    end
  end
end
```

### 5. Routes Configuration (`config/routes.rb`)
```ruby
Rails.application.routes.draw do
  # REST API routes
  resources :messages, only: [:index, :create]

  # Action Cable WebSocket mount
  mount ActionCable.server => '/cable'

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
```

### 6. Action Cable Configuration (`config/cable.yml`)
```yaml
development:
  adapter: async  # Use async for development

test:
  adapter: test

production:
  adapter: redis
  url: <%= ENV.fetch("REDIS_URL") { "redis://localhost:6379/1" } %>
  channel_prefix: app_production
```

## Frontend Implementation (Next.js + TypeScript)

### 1. TypeScript Definitions

#### Action Cable Types (`src/types/actioncable.d.ts`)
```typescript
declare module '@rails/actioncable' {
  export interface Consumer {
    subscriptions: {
      create: (
        channelName: { channel: string },
        callbacks: ChannelCallbacks
      ) => Subscription;
    };
    disconnect(): void;
  }

  export interface Subscription {
    unsubscribe(): void;
    send(data: any): void;
  }

  export interface ChannelCallbacks {
    connected?(): void;
    disconnected?(): void;
    received?(data: any): void;
    rejected?(): void;
  }

  export function createConsumer(url?: string): Consumer;
}
```

#### Application Types (`src/types/index.ts`)
```typescript
export interface Message {
  id: number;
  content: string;
  username: string;
  created_at: string;
}

export interface MessageCreateRequest {
  message: {
    content: string;
    username: string;
  };
}

export interface WebSocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastError?: string;
}
```

### 2. API Service Layer

#### HTTP Client (`src/services/api.ts`)
```typescript
import axios from 'axios';
import { Message, MessageCreateRequest } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const messageApi = {
  // Fetch all messages
  async getMessages(): Promise<Message[]> {
    const response = await apiClient.get<Message[]>('/messages');
    return response.data;
  },

  // Create a new message
  async createMessage(messageData: MessageCreateRequest): Promise<Message> {
    const response = await apiClient.post<Message>('/messages', messageData);
    return response.data;
  },
};
```

### 3. WebSocket Hook

#### Custom Hook (`src/hooks/useWebSocket.ts`)
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { createConsumer, Consumer, Subscription } from '@rails/actioncable';
import { Message, WebSocketConnectionState } from '../types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/cable';

interface UseWebSocketOptions {
  onMessageReceived?: (message: Message) => void;
  onConnectionChange?: (state: WebSocketConnectionState) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onMessageReceived,
    onConnectionChange,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    isConnected: false,
    isConnecting: false,
  });

  const consumerRef = useRef<Consumer | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateConnectionState = useCallback((updates: Partial<WebSocketConnectionState>) => {
    setConnectionState(prev => {
      const newState = { ...prev, ...updates };
      onConnectionChange?.(newState);
      return newState;
    });
  }, [onConnectionChange]);

  const connect = useCallback(() => {
    if (connectionState.isConnecting || connectionState.isConnected) {
      return;
    }

    updateConnectionState({ isConnecting: true, lastError: undefined });

    try {
      // Create consumer
      consumerRef.current = createConsumer(WS_URL);

      // Create subscription
      subscriptionRef.current = consumerRef.current.subscriptions.create(
        { channel: 'ChatChannel' },
        {
          connected() {
            console.log('WebSocket connected');
            updateConnectionState({
              isConnected: true,
              isConnecting: false
            });
          },

          disconnected() {
            console.log('WebSocket disconnected');
            updateConnectionState({
              isConnected: false,
              isConnecting: false
            });

            // Auto-reconnect logic
            if (autoReconnect) {
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, reconnectInterval);
            }
          },

          received(data: Message) {
            console.log('Message received:', data);
            onMessageReceived?.(data);
          },

          rejected() {
            console.error('WebSocket subscription rejected');
            updateConnectionState({
              isConnected: false,
              isConnecting: false,
              lastError: 'Connection rejected'
            });
          },
        }
      );
    } catch (error) {
      console.error('WebSocket connection error:', error);
      updateConnectionState({
        isConnected: false,
        isConnecting: false,
        lastError: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }, [connectionState.isConnecting, connectionState.isConnected, updateConnectionState, autoReconnect, reconnectInterval, onMessageReceived]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (consumerRef.current) {
      consumerRef.current.disconnect();
      consumerRef.current = null;
    }

    updateConnectionState({
      isConnected: false,
      isConnecting: false
    });
  }, [updateConnectionState]);

  const sendMessage = useCallback((content: string, username: string) => {
    if (!subscriptionRef.current || !connectionState.isConnected) {
      throw new Error('WebSocket not connected');
    }

    subscriptionRef.current.send({
      content,
      username,
    });
  }, [connectionState.isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connectionState,
    connect,
    disconnect,
    sendMessage,
  };
};
```

### 4. Chat Component

#### Main Chat Page (`src/pages/chat.tsx`)
```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { messageApi } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Message } from '../types';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle new WebSocket messages
  const handleMessageReceived = useCallback((message: Message) => {
    setMessages(prevMessages => {
      // Prevent duplicates
      const messageExists = prevMessages.some(msg => msg.id === message.id);
      if (messageExists) return prevMessages;

      return [...prevMessages, message];
    });
  }, []);

  const handleConnectionChange = useCallback((state: any) => {
    console.log('Connection state:', state);
  }, []);

  // Initialize WebSocket
  const { connectionState, sendMessage } = useWebSocket({
    onMessageReceived: handleMessageReceived,
    onConnectionChange: handleConnectionChange,
  });

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const initialMessages = await messageApi.getMessages();
        setMessages(initialMessages);
      } catch (err) {
        setError('Failed to load messages');
        console.error('Error loading messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !username.trim()) {
      alert('Please enter both username and message');
      return;
    }

    try {
      // Send via HTTP API (which will also broadcast via WebSocket)
      await messageApi.createMessage({
        message: {
          content: newMessage.trim(),
          username: username.trim(),
        },
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Live Chat</h1>
          <div className="flex items-center mt-2">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                connectionState.isConnected ? 'bg-green-400' :
                connectionState.isConnecting ? 'bg-yellow-400' : 'bg-red-400'
              }`}
            />
            <span className="text-sm">
              {connectionState.isConnected ? 'Connected' :
               connectionState.isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
            {connectionState.lastError && (
              <span className="text-xs text-red-200 ml-2">
                ({connectionState.lastError})
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!connectionState.isConnected || !newMessage.trim() || !username.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## WebSocket Communication Flow

### 1. Connection Establishment
```mermaid
sequenceDiagram
    participant Client as Next.js Client
    participant Rails as Rails Server
    participant AC as Action Cable
    participant DB as PostgreSQL

    Client->>Rails: HTTP: GET /messages
    Rails->>DB: SELECT * FROM messages
    DB->>Rails: Return messages
    Rails->>Client: JSON: messages[]

    Client->>AC: WebSocket: Connect to /cable
    AC->>Client: Connection established
    Client->>AC: Subscribe to ChatChannel
    AC->>Client: Subscription confirmed
```

### 2. Message Sending Flow
```mermaid
sequenceDiagram
    participant Client1 as Client 1
    participant Client2 as Client 2
    participant Rails as Rails API
    participant AC as Action Cable
    participant DB as PostgreSQL

    Client1->>Rails: POST /messages {content, username}
    Rails->>DB: INSERT INTO messages
    DB->>Rails: Message created
    Rails->>AC: Broadcast message
    AC->>Client1: WebSocket: new message
    AC->>Client2: WebSocket: new message
    Rails->>Client1: HTTP 201: message created
```

## Security Considerations

### 1. Input Validation
- **Server-side validation**: All inputs validated in Rails models and controllers
- **Client-side validation**: Basic validation for UX, not security
- **XSS Prevention**: Content sanitization and proper escaping

### 2. Rate Limiting
```ruby
# In ChatChannel
class ChatChannel < ApplicationCable::Channel
  include ActionCable::Channel::Throttling

  throttle_with_limit 10, per: 1.minute

  def receive(data)
    # Implementation
  end
end
```

### 3. Authentication (Future Enhancement)
```ruby
# Connection identification
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Implement JWT or session-based auth
    end
  end
end
```

## Performance Optimizations

### 1. Database Optimizations
- **Indexing**: Created indexes on frequently queried columns
- **Query optimization**: Use `includes` to prevent N+1 queries
- **Pagination**: Implement message pagination for large chat histories

### 2. WebSocket Optimizations
- **Connection pooling**: Redis adapter for production
- **Message batching**: Batch multiple messages for better performance
- **Compression**: Enable WebSocket compression

### 3. Frontend Optimizations
- **React optimization**: Use `useCallback` and `useMemo` for expensive operations
- **Virtual scrolling**: For large message lists
- **Debouncing**: Debounce user input to reduce API calls

## Deployment Strategy

### 1. Production Configuration
```yaml
# config/cable.yml
production:
  adapter: redis
  url: <%= ENV.fetch("REDIS_URL") %>
  channel_prefix: app_production
```

### 2. Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost/app_production
REDIS_URL=redis://localhost:6379/1
RAILS_ENV=production

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/cable
```

### 3. Docker Configuration
```dockerfile
# Backend Dockerfile
FROM ruby:3.3.1
WORKDIR /app
COPY Gemfile* ./
RUN bundle install
COPY . .
EXPOSE 3001
CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3001"]

# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

This comprehensive technical guide covers all aspects of implementing a real-time chat application using Next.js and Rails with WebSocket communication. The implementation includes proper error handling, TypeScript support, security considerations, and performance optimizations.

# NextJS + Rails WebSocket Application

A simple real-time chat application demonstrating WebSocket communication between a Next.js frontend and Rails backend using Action Cable.

## Architecture

- **Frontend**: Next.js with TypeScript, Tailwind CSS, and Page Router
- **Backend**: Rails API with Action Cable for WebSocket support
- **Database**: PostgreSQL
- **Real-time Communication**: WebSocket connection for live updates

## Project Structure

```
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── pages/     # Next.js pages (Page Router)
│   │   └── types/     # TypeScript type definitions
│   └── package.json
├── backend/           # Rails API application
│   ├── app/
│   │   ├── controllers/
│   │   ├── channels/  # Action Cable channels
│   │   └── models/
│   └── config/
└── .github/
    └── copilot-instructions.md
```

## Features

- ✅ Real-time messaging with WebSocket
- ✅ Next.js with TypeScript frontend
- ✅ Rails API backend with Action Cable
- ✅ PostgreSQL database
- ✅ Tailwind CSS styling
- ✅ CORS configuration for cross-origin requests
- ✅ Connection status indicator
- ✅ Message persistence

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- Ruby (v3.3.1)
- PostgreSQL
- Rails 7.1+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Create and setup the database:
   ```bash
   rails db:create db:migrate
   ```

4. Start the Rails server:
   ```bash
   rails server -p 3001
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Start both the Rails backend (port 3001) and Next.js frontend (port 3000)
2. Open http://localhost:3000 in your browser
3. Click "Open Chat Room" to access the live chat
4. Enter your username and start sending messages
5. Open multiple browser tabs/windows to test real-time functionality

## API Endpoints

### REST API
- `GET /messages` - Fetch all messages
- `POST /messages` - Create a new message

### WebSocket
- `/cable` - Action Cable WebSocket endpoint
- `ChatChannel` - Real-time chat channel

## Technologies Used

### Frontend
- Next.js 15
- TypeScript
- Tailwind CSS
- @rails/actioncable (WebSocket client)
- Axios (HTTP client)

### Backend
- Ruby on Rails 7.1
- Action Cable (WebSocket server)
- PostgreSQL
- Rack CORS

## Development Notes

- The frontend runs on port 3000
- The backend runs on port 3001
- CORS is configured to allow requests from the frontend
- WebSocket connections are established at `ws://localhost:3001/cable`
- Messages are persisted in PostgreSQL and broadcast in real-time

## Troubleshooting

1. **Connection Issues**: Ensure both servers are running and CORS is properly configured
2. **Database Issues**: Make sure PostgreSQL is running and the database is created
3. **WebSocket Issues**: Check browser console for connection errors and verify the cable URL

## Next Steps

- Add user authentication
- Implement multiple chat rooms
- Add message editing/deletion
- Add file upload support
- Deploy to production

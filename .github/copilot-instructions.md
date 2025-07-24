<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for NextJS + Rails WebSocket Application

## Project Overview
This is a full-stack application with:
- **Frontend**: Next.js with TypeScript, Tailwind CSS, and Page Router
- **Backend**: Rails API with Action Cable for WebSocket support
- **Database**: PostgreSQL
- **Real-time Communication**: WebSocket connection for live updates

## Architecture
- `frontend/` - Next.js application (TypeScript, Page Router)
- `backend/` - Rails API application with Action Cable

## Key Technologies
- **Frontend**: React, Next.js, TypeScript, Tailwind CSS, WebSocket client
- **Backend**: Ruby on Rails, Action Cable, PostgreSQL
- **Communication**: WebSocket for real-time updates

## Development Guidelines
1. Use TypeScript for all frontend code
2. Follow Next.js Page Router conventions
3. Use Tailwind CSS for styling
4. Implement proper error handling for WebSocket connections
5. Use Rails API conventions for backend endpoints
6. Implement proper CORS configuration for cross-origin requests
7. Use Action Cable for WebSocket functionality

## File Structure Patterns
- Frontend components in `frontend/src/components/`
- Frontend pages in `frontend/src/pages/`
- Backend controllers in `backend/app/controllers/`
- Backend channels in `backend/app/channels/`
- Backend models in `backend/app/models/`

## WebSocket Implementation
- Use Action Cable on the Rails backend
- Implement WebSocket client connection in Next.js frontend
- Handle connection states (connecting, connected, disconnected)
- Implement proper error handling and reconnection logic

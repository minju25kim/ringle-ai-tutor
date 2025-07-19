# 🤖 Ringle AI Tutor

A full-stack AI-powered English conversation tutor with membership management and voice interaction capabilities.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.8+)
- **pnpm** (for frontend package management)
- **OpenAI API Key** (for STT/TTS/LLM features)

### 🎯 One-Command Setup

**Option 1: Shell Script**
```bash
./dev.sh
```

**Option 2: Makefile**
```bash
make dev
```

Both commands will:
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Start backend server (http://localhost:8000)
- ✅ Start frontend server (http://localhost:3000)

### 🔧 Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ringle-ai-tutor
   ```

2. **Set up environment variables**
   ```bash
   # In frontend/.env.local
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run development servers**
   ```bash
   ./dev.sh
   # OR
   make dev
   ```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
ringle-ai-tutor/
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python server
├── dev.sh            # Development startup script
├── Makefile          # Make commands for development
└── README.md         # This file
```

## 🎮 Available Commands

### Development
```bash
make dev          # Start both frontend and backend
make backend      # Start only backend server
make frontend     # Start only frontend server
```

### Setup & Maintenance
```bash
make install      # Install all dependencies
make setup        # Setup development environment
make clean        # Clean all build artifacts
make help         # Show all available commands
```

## ✨ Features

### 🎯 Core Features
- **AI Voice Conversation** - Talk with AI tutor using speech-to-text
- **Membership Management** - Purchase and manage learning subscriptions
- **Usage Tracking** - Monitor conversation and analysis usage
- **Real-time Voice Detection** - Visual feedback during recording
- **Text-to-Speech** - AI responses with voice playback

### 🔧 Technical Features
- **Voice Activity Detection (VAD)** - Smart audio processing
- **Error Handling & Retry Logic** - Network resilience
- **Rate Limiting** - Abuse prevention
- **Responsive Design** - Mobile-friendly interface
- **Auto-scroll Chat** - Smooth conversation flow

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Audio Processing**: Web Audio API
- **HTTP Client**: Fetch API with retry logic

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Database**: SQLite with SQLAlchemy
- **Authentication**: Simple user switching
- **External APIs**: OpenAI (STT/TTS/LLM)
- **Data Validation**: Pydantic models

## 🔑 API Integration

### OpenAI Services
- **Whisper** - Speech-to-text transcription
- **TTS** - Text-to-speech synthesis  
- **GPT** - Conversational AI responses

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your_api_key

# Optional (development)
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key  # Fallback for frontend
```

## 🛠️ Development

### Backend Development
```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
pnpm install
pnpm run dev
```

### Testing
```bash
# Frontend
cd frontend && pnpm run lint

# Backend
cd backend && python -m pytest
```

## 📋 Requirements Fulfilled

✅ **Membership Management** - Create, purchase, expire memberships  
✅ **Voice Conversation** - STT → LLM → TTS pipeline  
✅ **Usage Tracking** - Conversation and analysis limits  
✅ **Voice Activity Detection** - Real-time audio processing  
✅ **Network Resilience** - Error handling and retries  
✅ **Rate Limiting** - Abuse prevention mechanisms  
✅ **Modern UI/UX** - Responsive design with audio feedback  

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports
   lsof -ti:3000 | xargs kill -9  # Frontend
   lsof -ti:8000 | xargs kill -9  # Backend
   ```

2. **Python virtual environment issues**
   ```bash
   cd backend
   rm -rf venv .venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Node modules issues**
   ```bash
   cd frontend
   rm -rf node_modules .next
   pnpm install
   ```

4. **OpenAI API errors**
   - Verify API key is set correctly
   - Check API usage limits
   - Ensure internet connection

## 📞 Support

For questions or issues:
- Check the individual README files in `frontend/` and `backend/` directories
- Review API documentation at http://localhost:8000/docs
- Ensure all environment variables are properly configured

## 🎯 Next Steps

1. **Start development servers**: `./dev.sh`
2. **Open frontend**: http://localhost:3000
3. **Switch users** to test different membership types
4. **Purchase membership** to enable chat features
5. **Start conversation** with AI tutor

Happy coding! 🚀
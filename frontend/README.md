# 🎨 Frontend - Ringle AI Tutor

Next.js React application for the AI English conversation tutor.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

## 🌐 Development Server

- **URL**: http://localhost:3000
- **Hot Reload**: Enabled with Turbopack
- **Environment**: Development mode with debugging

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── chat/       # AI chat endpoint
│   │   │   ├── transcribe/ # Speech-to-text
│   │   │   └── tts/        # Text-to-speech
│   │   ├── chat/           # Chat page
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable components
│   │   ├── AudioPlayer.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── UserSwitcher.tsx
│   │   ├── MembershipInfo.tsx
│   │   └── ErrorToast.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useUser.ts
│   │   ├── useMembership.ts
│   │   └── useErrorHandler.ts
│   ├── services/           # API services
│   │   └── membershipService.ts
│   ├── utils/              # Utility functions
│   │   └── networkUtils.ts
│   └── types/              # TypeScript definitions
│       └── index.ts
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## 🎯 Key Features

### 🎤 Voice Recording
- **Real-time waveform visualization**
- **Voice Activity Detection (VAD)**
- **WebAudio API integration**
- **Automatic silence detection**

### 🤖 AI Chat Interface
- **Streaming chat responses**
- **Auto-scroll to new messages**
- **Message history persistence**
- **Responsive design**

### 🔊 Audio Playback
- **Text-to-speech for AI responses**
- **User audio recording playback**
- **Chunked audio for long texts**
- **Sequential audio chunk playback**

### 💳 Membership Management
- **Real-time membership validation**
- **Usage tracking and limits**
- **Purchase flow integration**
- **Multiple user types (B2B/B2C)**

## 🔧 Technical Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### State Management
- **Zustand** - Lightweight state management
- **React Hooks** - Local component state
- **Custom Hooks** - Reusable logic

### Audio Processing
- **Web Audio API** - Real-time audio processing
- **MediaRecorder API** - Audio recording
- **Voice Activity Detection** - Smart audio detection
- **Waveform Visualization** - Canvas-based graphics

### API Integration
- **OpenAI APIs**:
  - Whisper (Speech-to-Text)
  - TTS (Text-to-Speech)
  - GPT (Chat completions)
- **Custom Backend APIs** - Membership and user management

## 🛠️ Development

### Environment Variables

Create `.env.local`:
```bash
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key  # Fallback for client-side

# Backend URL (optional, defaults to localhost:8000)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Available Scripts

```bash
# Development
pnpm run dev          # Start dev server with Turbopack
pnpm run dev:debug    # Start with debugging enabled

# Production
pnpm run build        # Build for production
pnpm run start        # Start production server

# Code Quality
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint errors
pnpm run type-check   # TypeScript type checking

# Dependencies
pnpm install          # Install dependencies
pnpm add <package>    # Add new dependency
pnpm update           # Update dependencies
```

### Component Development

#### VoiceRecorder Component
```tsx
<VoiceRecorder 
  onRecordingComplete={(audioBlob, hasVoice) => {
    // Handle completed recording
  }}
  disabled={isLoading}
/>
```

#### AudioPlayer Component
```tsx
<AudioPlayer 
  text="Text to speak"
  voice="nova"
  autoPlay={true}
  onEnded={() => console.log('Audio finished')}
/>
```

#### UserSwitcher Component
```tsx
<UserSwitcher />  // Handles user switching between B2B/B2C
```

### API Routes

#### Chat API (`/api/chat`)
- Handles AI conversation
- Integrates with OpenAI GPT
- Streaming responses

#### Transcribe API (`/api/transcribe`)
- Speech-to-text conversion
- OpenAI Whisper integration
- Rate limiting and validation

#### TTS API (`/api/tts`)
- Text-to-speech synthesis
- OpenAI TTS integration
- Audio caching

## 🎨 Styling

### Tailwind CSS
- **Utility-first** approach
- **Custom color scheme** matching brand
- **Responsive design** for all devices
- **Dark mode** support (disabled per requirements)

### Component Styling
```tsx
// Modern card design
<div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
  
// Gradient buttons
<button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">

// Responsive layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

## 🔌 State Management

### User Store (Zustand)
```typescript
interface UserStore {
  currentUser: User;
  setUserId: (userId: string) => void;
}
```

### Membership Hook
```typescript
const { memberships, loading, error, refetch } = useMembership(userId);
```

### Error Handler Hook
```typescript
const { errors, handleApiError, removeError } = useErrorHandler();
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch-friendly buttons
- Optimized voice recording
- Swipe gestures support
- Mobile-first approach

## 🔊 Audio Implementation

### Voice Activity Detection
```typescript
// Enhanced VAD with multiple algorithms
const isVoiceActive = (
  (average > adaptiveThreshold && rms > 5) ||
  (average > 12 && zeroCrossingRate > 0.05)
);
```

### Audio Chunking for TTS
```typescript
// Handles long text by splitting into chunks
const chunks = splitTextIntoChunks(text);
// Plays chunks sequentially for complete audio
```

## 🚨 Error Handling

### Network Resilience
- **Retry logic** for failed requests
- **Offline detection** and handling
- **Toast notifications** for user feedback
- **Graceful degradation** when APIs fail

### Error Types
- Network errors
- API rate limits
- Audio processing errors
- Membership validation errors

## 🧪 Testing

### Development Testing
```bash
# Run development server
pnpm run dev

# Test voice recording in browser
# Test membership validation
# Test AI chat functionality
```

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support with WebAudio API
- **Mobile**: iOS Safari, Chrome Mobile

## 📈 Performance

### Optimizations
- **Code splitting** with Next.js
- **Image optimization** built-in
- **Bundle analysis** available
- **Lazy loading** for components

### Audio Performance
- **Chunked TTS** for long responses
- **Audio caching** for repeated content
- **VAD optimization** for battery life
- **Memory cleanup** for audio objects

## 🔧 Configuration

### Next.js Config
```javascript
// next.config.js
module.exports = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};
```

### TypeScript Config
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["DOM", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

## 🚀 Deployment

### Build Process
```bash
# Install dependencies
pnpm install

# Build application
pnpm run build

# Start production server
pnpm start
```

### Environment Variables (Production)
```bash
OPENAI_API_KEY=your_production_api_key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

## 🐛 Troubleshooting

### Common Issues

1. **Audio not working**
   - Check browser permissions for microphone
   - Verify HTTPS in production
   - Check OpenAI API key

2. **Build errors**
   - Clear `.next` directory: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && pnpm install`

3. **API errors**
   - Verify backend is running on port 8000
   - Check network connectivity
   - Verify environment variables

### Debug Mode
```bash
# Enable verbose logging
NEXT_PUBLIC_DEBUG=true pnpm run dev
```

---

**Ready to develop?** Run `pnpm run dev` and start building! 🚀
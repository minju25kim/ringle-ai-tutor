import { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasVoiceActivity, setHasVoiceActivity] = useState(false);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrame = useRef<number | null>(null);

  // Global error handler for AbortError
  useEffect(() => {
    const handleAbortError = (event: ErrorEvent) => {
      if (event.error && event.error.name === 'AbortError') {
        console.warn('AbortError caught and handled:', event.error);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleAbortError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.name === 'AbortError') {
        console.warn('Unhandled AbortError caught:', event.reason);
        event.preventDefault();
      }
    });

    return () => {
      window.removeEventListener('error', handleAbortError);
    };
  }, []);

  // Initialize WaveSurfer when voice activity is detected
  useEffect(() => {
    if (hasVoiceActivity && waveformRef.current && !wavesurfer.current) {
      try {
        wavesurfer.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#4F4A85',
          progressColor: '#1E1A34',
          height: 50,
          barWidth: 2,
          interact: false,
          normalize: true,
        });
        console.log('WaveSurfer initialized for voice activity');
      } catch (error) {
        console.error('Error initializing WaveSurfer:', error);
      }
    }

    return () => {
      if (wavesurfer.current) {
        try {
          wavesurfer.current.destroy();
        } catch (error) {
          console.error('Error destroying WaveSurfer:', error);
        }
        wavesurfer.current = null;
      }
    };
  }, [hasVoiceActivity]);

  // Cleanup when recording stops
  useEffect(() => {
    if (!isRecording) {
      setHasVoiceActivity(false);
      const timer = setTimeout(() => {
        if (wavesurfer.current) {
          try {
            wavesurfer.current.destroy();
          } catch (error) {
            console.error('Error destroying WaveSurfer:', error);
          }
          wavesurfer.current = null;
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Got audio stream:', stream);

      // Create MediaRecorder with longer duration
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: Blob[] = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording - will continue until manually stopped
      mediaRecorder.current.start(1000); // Collect data every 1 second, but don't stop
      setIsRecording(true);

      // Create audio context for voice activity detection
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      analyser.current.smoothingTimeConstant = 0.8;
      source.connect(analyser.current);

      console.log('Audio context created, starting voice activity detection...');

      // Voice activity detection and visualization
      const detectVoiceActivity = () => {
        if (!analyser.current) return;

        const bufferLength = analyser.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const threshold = 30; // Adjust this threshold as needed

        // Check if voice activity is detected
        const isVoiceActive = average > threshold;

        if (isVoiceActive && !hasVoiceActivity) {
          console.log('Voice activity detected!');
          setHasVoiceActivity(true);
        } else if (!isVoiceActive && hasVoiceActivity) {
          console.log('Voice activity stopped');
          setHasVoiceActivity(false);
        }

        // Log audio levels for debugging
        console.log('Audio levels:', { average, threshold, isVoiceActive });

        animationFrame.current = requestAnimationFrame(detectVoiceActivity);
      };

      detectVoiceActivity();

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, [onRecordingComplete, hasVoiceActivity]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (mediaRecorder.current && isRecording) {
      // Only stop when user manually clicks the button
      mediaRecorder.current.stop();
      setIsRecording(false);
      setHasVoiceActivity(false);

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }

      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    }
  }, [isRecording]);

  const toggleRecording = useCallback(async () => {
    console.log('toggleRecording called, isRecording:', isRecording, 'disabled:', disabled);

    if (isRecording) {
      console.log('Stopping recording...');
      stopRecording();
    } else {
      console.log('Starting recording...');
      await startRecording();
    }
  }, [isRecording, disabled, startRecording, stopRecording]);

  return (
    <div className="flex items-center justify-between w-full bg-gray-50 p-3 rounded-lg">
      {/* Waveform on the left - show when voice activity is detected */}
      <div className="flex-1 mr-4 min-h-[50px] flex items-center">
        {!isRecording ? (
          // Not recording - show placeholder
          <div className="w-full h-[50px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Click mic to start recording
          </div>
        ) : hasVoiceActivity ? (
          // Recording with voice activity - show WaveSurfer
          <div
            ref={waveformRef}
            className="w-full rounded-lg overflow-hidden bg-white border border-gray-200"
            style={{ height: '50px' }}
          />
        ) : (
          // Recording but no voice activity - show waiting message
          <div className="w-full h-[50px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Speak to see waveform...
          </div>
        )}
      </div>

      {/* Mic button on the right */}
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`p-4 rounded-full transition-all duration-200 relative z-10 flex-shrink-0 ${isRecording
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          {isRecording ? (
            // Stop icon
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 8a2 2 0 114 0v4a2 2 0 11-4 0V8z" clipRule="evenodd" />
          ) : (
            //mic icon
            <path d="M8 12a2 2 0 104 0 2 2 0 00-4 0zm-2-1a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2zm4-3a4 4 0 100 8 4 4 0 000-8z" />
          )}
        </svg>
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Hide any default WaveSurfer recording controls */
          .wavesurfer-container [data-testid="record-button"],
          .wavesurfer-container .wavesurfer-record-button,
          .wavesurfer-container .record-button,
          .wavesurfer-container button[class*="record"] {
            display: none !important;
          }
          
          /* Ensure waveform doesn't interfere with button clicks */
          .wavesurfer-container {
            pointer-events: none !important;
          }
        `
      }} />
    </div>
  );
};

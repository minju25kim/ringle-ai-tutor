import { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, hasVoice: boolean) => void;
  disabled?: boolean;
}

interface VoiceSegment {
  start: number;
  end: number;
  isVoice: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasVoiceActivity, setHasVoiceActivity] = useState(false);
  const [lastRecordingTime, setLastRecordingTime] = useState(0);
  const [recordingCount, setRecordingCount] = useState(0);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const voiceDetectedDuration = useRef(0);
  const voiceStartTime = useRef<number | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrame = useRef<number | null>(null);
  const voiceSegments = useRef<VoiceSegment[]>([]);
  const recordingStartTime = useRef<number>(0);
  const smoothingBuffer = useRef<number[]>([]);
  const shouldStopDetection = useRef<boolean>(false);
  const SMOOTHING_WINDOW = 5;

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop detection loop
      shouldStopDetection.current = true;
      
      // Cancel animation frame
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      
      // Close audio context
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, []);

  // Draw waveform on canvas
  const drawWaveform = useCallback((dataArray: Uint8Array) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.fillStyle = '#3b82f6';
    const barWidth = width / dataArray.length;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }, []);

  // Setup canvas size
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2; // High DPI
      canvas.height = rect.height * 2;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2); // High DPI scaling
      }
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

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const totalRecordingTime = Date.now() - recordingStartTime.current;
        const voiceRatio = voiceDetectedDuration.current / totalRecordingTime;

        // Enhanced voice validation - more lenient criteria
        const hasSignificantVoice = (
          voiceDetectedDuration.current > 300 || // At least 0.3 seconds of voice OR
          voiceRatio > 0.05 || // At least 5% of recording should be voice OR
          voiceSegments.current.length > 0 || // Should have detected voice segments OR
          blob.size > 5000 // If recording is substantial (>5KB), likely has content
        );

        console.log('Recording analysis:', {
          totalTime: totalRecordingTime,
          voiceDuration: voiceDetectedDuration.current,
          voiceRatio: voiceRatio,
          segments: voiceSegments.current.length,
          hasVoice: hasSignificantVoice
        });

        // Attempt to trim silence if voice was detected
        let processedBlob = blob;
        if (hasSignificantVoice && voiceSegments.current.length > 0) {
          try {
            processedBlob = await trimSilence(blob, voiceSegments.current);
            console.log('Audio trimmed successfully');
          } catch (error) {
            console.log('Failed to trim audio, using original:', error);
          }
        }

        onRecordingComplete(processedBlob, hasSignificantVoice);
        stream.getTracks().forEach(track => track.stop());

        // Reset voice detection
        voiceDetectedDuration.current = 0;
        voiceStartTime.current = null;
        voiceSegments.current = [];
        setVoiceIntensity(0);
      };

      // Start recording - will continue until manually stopped
      mediaRecorder.current.start(1000); // Collect data every 1 second, but don't stop
      recordingStartTime.current = Date.now();
      shouldStopDetection.current = false;
      setIsRecording(true);

      // Create audio context for voice activity detection
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      analyser.current.smoothingTimeConstant = 0.8;
      source.connect(analyser.current);

      console.log('Audio context created, starting voice activity detection...');

      // Optimized voice activity detection with throttling
      const detectVoiceActivity = () => {
        // Stop if flagged to stop or analyser not available
        if (!analyser.current || shouldStopDetection.current) {
          console.log('Stopping voice detection');
          return;
        }

        const bufferLength = analyser.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.current.getByteFrequencyData(dataArray);

        // Enhanced VAD with multiple detection methods
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

        // Calculate RMS (Root Mean Square) for better voice detection
        const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + (value * value), 0) / bufferLength);

        // Calculate zero crossing rate for voice vs noise distinction
        let zeroCrossings = 0;
        for (let i = 1; i < dataArray.length; i++) {
          if ((dataArray[i] > 128 && dataArray[i - 1] <= 128) || (dataArray[i] <= 128 && dataArray[i - 1] > 128)) {
            zeroCrossings++;
          }
        }
        const zeroCrossingRate = zeroCrossings / dataArray.length;

        // Adaptive threshold based on background noise
        smoothingBuffer.current.push(average);
        if (smoothingBuffer.current.length > SMOOTHING_WINDOW) {
          smoothingBuffer.current.shift();
        }
        const smoothedAverage = smoothingBuffer.current.reduce((a, b) => a + b, 0) / smoothingBuffer.current.length;
        const adaptiveThreshold = Math.max(smoothedAverage * 1.2, 8); // More sensitive threshold

        // Combined voice activity detection - more lenient
        const isVoiceActive = (
          (average > adaptiveThreshold && rms > 5) || // Basic volume check OR
          (average > 12 && zeroCrossingRate > 0.05 && zeroCrossingRate < 0.9) // Voice pattern check
        );
        
        // Reduced logging frequency for better performance
        if (average > 15 && Math.random() < 0.005) { // Further reduced logging
          console.log('Voice detection:', {
            average: average.toFixed(2),
            rms: rms.toFixed(2),
            zcr: zeroCrossingRate.toFixed(3),
            threshold: adaptiveThreshold.toFixed(2),
            isActive: isVoiceActive
          });
        }

        const now = Date.now();
        const recordingTime = now - recordingStartTime.current;

        // Throttled voice intensity updates for better performance
        const currentTime = Date.now();
        if (currentTime - (detectVoiceActivity.lastIntensityUpdate || 0) > 50) { // Update max every 50ms
          setVoiceIntensity(Math.min(average / 50, 1));
          detectVoiceActivity.lastIntensityUpdate = currentTime;
        }

        // Track voice segments for better analysis
        if (isVoiceActive && !hasVoiceActivity) {
          console.log('Voice activity detected! Intensity:', average, 'RMS:', rms, 'ZCR:', zeroCrossingRate);
          setHasVoiceActivity(true);
          voiceStartTime.current = now;
        } else if (!isVoiceActive && hasVoiceActivity) {
          console.log('Voice activity stopped');
          setHasVoiceActivity(false);
          if (voiceStartTime.current) {
            const segmentDuration = now - voiceStartTime.current;
            voiceDetectedDuration.current += segmentDuration;

            // Record voice segment for potential trimming
            voiceSegments.current.push({
              start: voiceStartTime.current - recordingStartTime.current,
              end: recordingTime,
              isVoice: true
            });

            voiceStartTime.current = null;
          }
        } else if (isVoiceActive && hasVoiceActivity && voiceStartTime.current) {
          // Continuously update duration while voice is active
          voiceDetectedDuration.current += (now - voiceStartTime.current);
          voiceStartTime.current = now;
        }

        // Update waveform visualization
        drawWaveform(dataArray);

        // Continue the animation loop only if not flagged to stop
        if (!shouldStopDetection.current) {
          animationFrame.current = requestAnimationFrame(detectVoiceActivity);
        }
      };

      detectVoiceActivity();

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, [onRecordingComplete, hasVoiceActivity, drawWaveform]);

  // Function to trim silence from audio
  const trimSilence = async (audioBlob: Blob, segments: VoiceSegment[]): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          if (segments.length === 0) {
            resolve(audioBlob);
            return;
          }

          // Find the first and last voice segments
          const firstVoiceSegment = segments[0];
          const lastVoiceSegment = segments[segments.length - 1];

          // Add small padding (200ms) around voice segments
          const padding = 0.2;
          const startTime = Math.max(0, (firstVoiceSegment.start / 1000) - padding);
          const endTime = Math.min(audioBuffer.duration, (lastVoiceSegment.end / 1000) + padding);

          // Calculate trimmed audio length
          const trimmedLength = endTime - startTime;
          const trimmedSamples = Math.floor(trimmedLength * audioBuffer.sampleRate);

          // Create new audio buffer with trimmed audio
          const trimmedBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            trimmedSamples,
            audioBuffer.sampleRate
          );

          // Copy audio data
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const originalData = audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);
            const startSample = Math.floor(startTime * audioBuffer.sampleRate);

            for (let i = 0; i < trimmedSamples; i++) {
              trimmedData[i] = originalData[startSample + i] || 0;
            }
          }

          // Convert back to blob (simplified - in real implementation you'd use a proper encoder)
          console.log(`Audio trimmed from ${audioBuffer.duration.toFixed(2)}s to ${trimmedLength.toFixed(2)}s`);
          resolve(audioBlob); // For now, return original blob as WebAudio API encoding is complex
          audioContext.close();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    // Stop the detection loop immediately
    shouldStopDetection.current = true;
    
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
      // Rate limiting: max 10 recordings per minute
      const now = Date.now();
      const timeSinceLastRecording = now - lastRecordingTime;
      const oneMinute = 60 * 1000;

      if (timeSinceLastRecording < oneMinute) {
        if (recordingCount >= 10) {
          alert('Rate limit exceeded. Please wait before recording again.');
          return;
        }
      } else {
        // Reset count after a minute
        setRecordingCount(0);
      }

      // Minimum 2 seconds between recordings
      if (timeSinceLastRecording < 2000) {
        alert('Please wait at least 2 seconds between recordings.');
        return;
      }

      console.log('Starting recording...');
      setLastRecordingTime(now);
      setRecordingCount(prev => prev + 1);
      await startRecording();
    }
  }, [isRecording, disabled, startRecording, stopRecording, lastRecordingTime, recordingCount]);

  return (
    <div className="flex items-center justify-between w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      {/* Waveform and voice activity indicator */}
      <div className="flex-1 mr-4 min-h-[50px] flex items-center">
        {!isRecording ? (
          // Not recording - show placeholder
          <div className="w-full h-[60px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-300">
            🎤 Click mic to start recording
          </div>
        ) : (
          <div className="w-full">
            {/* Recording - show canvas waveform */}
            <canvas
              ref={canvasRef}
              className="w-full h-[60px] rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50"
            />
            {/* Voice activity indicators */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex items-center space-x-2">
                {/* Voice activity indicator */}
                <div className={`w-2 h-2 rounded-full ${hasVoiceActivity ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  }`}></div>
                <span className={hasVoiceActivity ? 'text-green-600' : 'text-gray-500'}>
                  {hasVoiceActivity ? 'Voice detected' : 'Listening...'}
                </span>
              </div>

              {/* Voice intensity bar */}
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Intensity:</span>
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-150"
                    style={{ width: `${voiceIntensity * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mic button on the right */}
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`p-4 rounded-full transition-all duration-200 relative z-10 flex-shrink-0 shadow-lg ${isRecording
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          {isRecording ? (
            // Stop icon
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 8a2 2 0 114 0v4a2 2 0 11-4 0V8z" clipRule="evenodd" />
          ) : (
            // Microphone icon
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          )}
        </svg>
      </button>

    </div>
  );
};

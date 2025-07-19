
import { useState, useRef } from 'react';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          audioStream?.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
          setIsRecording(false);
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  };

  return {
    isRecording,
    audioBlob,
    audioStream,
    startRecording,
    stopRecording,
  };
};

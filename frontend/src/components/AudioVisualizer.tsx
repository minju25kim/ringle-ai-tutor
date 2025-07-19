
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioStream: MediaStream | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    if (audioStream) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameId.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;

          canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

          x += barWidth + 1;
        }
      };

      draw();

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
      };
    } else {
      // Clear canvas if no audio stream
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [audioStream]);

  return <canvas ref={canvasRef} width="300" height="50" className="bg-gray-800 rounded-md"></canvas>;
};

export default AudioVisualizer;

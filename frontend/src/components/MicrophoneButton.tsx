
import React from 'react';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isRecording,
  onToggleRecording,
  disabled = false,
}) => {
  return (
    <button
      onClick={onToggleRecording}
      disabled={disabled}
      className={`p-4 rounded-full shadow-lg transition-colors duration-200
        ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isRecording ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};

export default MicrophoneButton;

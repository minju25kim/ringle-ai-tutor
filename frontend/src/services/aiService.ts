export const textToSpeech = async (text: string): Promise<string> => {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.audioUrl;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}; 
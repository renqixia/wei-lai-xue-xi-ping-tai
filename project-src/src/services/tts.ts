import { getTTSAudio } from "./aiService";

let audioCtx: AudioContext | null = null;

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export async function fetchTTSAudio(prompt: string): Promise<AudioBuffer> {
  const base64Audio = await getTTSAudio(prompt);
  
  if (!base64Audio) {
    throw new Error('Failed to generate audio');
  }

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const buffer = new Int16Array(bytes.buffer);
  const ctx = getAudioContext();
  const audioBuffer = ctx.createBuffer(1, buffer.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < buffer.length; i++) {
    channelData[i] = buffer[i] / 32768.0;
  }
  
  return audioBuffer;
}

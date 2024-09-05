'use client';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

// Define the shape of the WebSocket context
interface WebSocketContextValue {
  sendMessage: (message: ArrayBuffer) => void;
  lastMessage: MessageEvent<any> | null;
  readyState: ReadyState;
}

type WebSocketProvider = { children: ReactNode };

// Create the WebSocket context with default values
const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

// Extract the environfile
const socketUrl = process.env.DEEPGRAM_SOCKET_URL;
const deepgramKey = process.env.DEEPGRAM_API_KEY;

/**
 * Voice Options
 */
export const voices: {
    [key: string]: {
      name: string;
      avatar: string;
      language: string;
      accent: string;
    };
  } = {
    "aura-asteria-en": {
      name: "Asteria",
      avatar: "/aura-asteria-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-luna-en": {
      name: "Luna",
      avatar: "/aura-luna-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-stella-en": {
      name: "Stella",
      avatar: "/aura-stella-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-athena-en": {
      name: "Athena",
      avatar: "/aura-athena-en.svg",
      language: "English",
      accent: "UK",
    },
    "aura-hera-en": {
      name: "Hera",
      avatar: "/aura-hera-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-orion-en": {
      name: "Orion",
      avatar: "/aura-orion-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-arcas-en": {
      name: "Arcas",
      avatar: "/aura-arcas-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-perseus-en": {
      name: "Perseus",
      avatar: "/aura-perseus-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-angus-en": {
      name: "Angus",
      avatar: "/aura-angus-en.svg",
      language: "English",
      accent: "Ireland",
    },
    "aura-orpheus-en": {
      name: "Orpheus",
      avatar: "/aura-orpheus-en.svg",
      language: "English",
      accent: "US",
    },
    "aura-helios-en": {
      name: "Helios",
      avatar: "/aura-helios-en.svg",
      language: "English",
      accent: "UK",
    },
    "aura-zeus-en": {
      name: "Zeus",
      avatar: "/aura-zeus-en.svg",
      language: "English",
      accent: "US",
    },
  };

// models

export const models = [
    {
        name: 'Anthropic: Claude 3 Haiku',
        value: 'anthropic+claude-3-haiku-20240307'
    },
    {
        name: 'Deepgram: Llama 3 8b',
        value: 'deepgram+llama-3-8b-instruct'
    },
    {
        name: 'Groq: Llama 3 8b',
        value: 'groq+llama3-8b-8192'
    },
    {
        name: 'Groq: Llama 3 70b',
        value: 'groq+llama3-70b-8192'
    },
    {
        name: 'Groq: Mixtral 8x7b',
        value: 'groq+mixtral-8x7b-32768'
    },
    {
        name: 'OpenAI: GPT 4o',
        value: 'open_ai+gpt-4o'
    }
];


// Define a provider component
export const WebSocketProvider = ({ children }:WebSocketProvider) => {
  const [connection, setConnection] = useState(false);
  const [voice, setVoice] = useState('aura-asteria-en');
  const [model, setModel] = useState('anthropic+claude-3-haiku-20240307');
  const [startTime, setStartTime] = useState(0);
  const scheduledAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Configuration settings for the agent
    const  config_settings = {
        type: "SettingsConfiguration",
        audio: {
        input: {
            encoding: "linear32",
            sample_rate: 48000
        },
        output: {
            encoding: "linear16",
            sample_rate: 48000,
            container: "none"
        }
        },
        agent: {
        listen: {
            model: "nova-2"
        },
        think: {
            provider: model.split('+')[0],
            model: model.split('+')[1],
            instructions: "You are a helpful assistant who responds in 1-2 sentences at most each time."
        },
        speak: {
            model: voice
        }
        }
    };

    const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket('wss://sts.sandbox.deepgram.com/agent',{
        protocols: ['token', 'b6f78efae4b2128e4c3d8f81fb6c740b8c0bc077'],
        share: true,
        onOpen: () => {
            // Get the current WebSocket instance and set the binaryType
            const socket = getWebSocket();
            if (socket instanceof WebSocket) {
              socket.binaryType = 'arraybuffer'; // Set binaryType after connection is open
              console.log('Binary type set to:', socket.binaryType);
            }
            setConnection(true);
            console.log("WebSocket connection established.");
            sendMessage(
                JSON.stringify(config_settings)
            );
        },
        onError: (error) => console.error("WebSocket error:", error),
        onMessage: (event) => {
            if (typeof event.data === "string") {
                console.log("Text message received:", event.data);
                const msgObj = JSON.parse(event.data);
            if (msgObj.type === "UserStartedSpeaking") {
                clearScheduledAudio();
            }
            } else if (event.data instanceof ArrayBuffer) {
                playAudio(event.data);
            }
        }
      });

      // player to stream received audio
      const playAudio = (audioData: ArrayBuffer) => {
        if (!audioContextRef.current) return;
    
        const audioContext = audioContextRef.current;
        const audioDataView = new Int16Array(audioData);
    
        if (audioDataView.length === 0) {
          console.error("Received audio data is empty.");
          return;
        }
    
        const audioBuffer = audioContext.createBuffer(1, audioDataView.length, 48000);
        const audioBufferChannel = audioBuffer.getChannelData(0);
    
        for (let i = 0; i < audioDataView.length; i++) {
          audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
        }
    
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
    
        if (startTime < audioContext.currentTime) {
          setStartTime(audioContext.currentTime);
        }
        source.start(startTime);
    
        setStartTime(prevStartTime => prevStartTime + audioBuffer.duration);
        scheduledAudioSourcesRef.current.push(source);
      };

      // clear the audio que
      const clearScheduledAudio = () => {
        scheduledAudioSourcesRef.current.forEach(source => source.stop());
        scheduledAudioSourcesRef.current = [];
    
        const scheduledAudioMs = Math.round(1000 * (startTime - (audioContextRef.current?.currentTime || 0)));
        if (scheduledAudioMs > 0) {
          console.log(`Cleared ${scheduledAudioMs}ms of scheduled audio`);
        } else {
          console.log("No scheduled audio to clear.");
        }
    
        setStartTime(0);
      };

  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      sendMessage,
      lastMessage,
      readyState,
    }),
    [sendMessage, lastMessage, readyState]
  );



  useEffect(() => {
    const startStreaming = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported in this browser.");
        return;
      }
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      try {
        
        const constraints = {
          audio: {
            sampleRate: 48000,
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            voiceIsolation: true,
            noiseSuppression: false,
            latency: 0,
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const microphone = audioContextRef.current?.createMediaStreamSource(stream);
        const processor = audioContextRef.current?.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const rms = Math.sqrt(
            inputData.reduce((sum, value) => sum + value * value, 0) / inputData.length
          );

          // send message to socket
          sendMessage(inputData.buffer);
          console.log("Message sent!");
          // Update blob size based on audio level
          // updateBlobSize(rms * 5); // Adjust the scaling factor as needed
        };

        microphone.connect(processor);
        processor.connect(audioContextRef.current?.destination);

      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    startStreaming();

    // Cleanup function to stop the streaming when the component unmounts
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.log("Error closing ", err));
      }
    };
  }, [connection]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Custom hook to use the WebSocket context
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

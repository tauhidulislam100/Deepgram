"use client";

import {
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { Message, useChat } from "ai/react";
import { NextUIProvider } from "@nextui-org/react";
import { useMicVAD } from "@ricky0123/vad-react";
import { useNowPlaying } from "react-nowplaying";
import { useQueue } from "@uidotdev/usehooks";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { ChatBubble } from "./ChatBubble";
import {
  contextualGreeting,
  generateRandomString,
  utteranceText,
} from "../lib/helpers";
import { Controls } from "./Controls";
import { InitialLoad } from "./InitialLoad";
import { MessageMetadata } from "../lib/types";
import { RightBubble } from "./RightBubble";
import { systemContent } from "../lib/constants";
import { useDeepgram } from "../context/Deepgram";
import { useMessageData } from "../context/MessageMetadata";
import { useMicrophone } from "../context/Microphone";
import { useAudioStore } from "../context/AudioStore";
import { useAuth } from "../context/Auth";
import { useWebSocketContext } from "../context/WebScoket";
import { ReadyState } from "react-use-websocket";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function ConversationAgent(): JSX.Element {
    const [initialLoad, setInit] = useState(true);
    const [input, setInput] = useState('');
    const [connection, setConnecting] = useState(false);
  /**
   * Custom context providers
   */
  const { token, isAuthenticated } = useAuth();
  const { addAudio } = useAudioStore();
  const { player, stop: stopAudio, play: startAudio } = useNowPlaying();
  const {sendMessage, readyState} = useWebSocketContext();

  const startConversation = () => {
    setInit(false);
  };

  const handleSubmit = () => {};
  const handleInputChange = () => {};

  useEffect(() => {
    const startStreaming = async () => {
      const audioContext = new AudioContext();
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
      const microphone = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const rms = Math.sqrt(
          inputData.reduce((sum, value) => sum + value * value, 0) / inputData.length
        )
        sendMessage(inputData.buffer);
      }
    }
    startStreaming();
  },[]);

  return (
    <>
      <NextUIProvider className="h-full">
        <div className="flex h-full antialiased">
          <div className="flex flex-row h-full w-full overflow-x-hidden">
            <div className="flex flex-col flex-auto h-full">
              <div className="flex flex-col justify-between h-full">
                <div
                  className={`flex flex-col h-full overflow-hidden ${
                    initialLoad ? "justify-center" : "justify-end"
                  }`}
                >
                  <div className="grid grid-cols-12 overflow-x-auto gap-y-2">
                    {initialLoad ? (
                      <InitialLoad fn={startConversation} connecting={readyState !== ReadyState.OPEN} />
                    ) : (
                      <>
                      <p className=""></p>
                        {/* {chatMessages.length > 0 &&
                          chatMessages.map((message, i) => (
                            <ChatBubble message={message} key={i} />
                          ))}

                        {currentUtterance && (
                          <RightBubble text={currentUtterance}></RightBubble>
                        )}

                        <div
                          className="h-16 col-start-1 col-end-13"
                          ref={messageMarker}
                        ></div> */}
                      </>
                    )}
                  </div>
                </div>
                {!initialLoad && (
                  <Controls
                    // messages={chatMessages}
                    handleSubmit={handleSubmit}
                    handleInputChange={handleInputChange}
                    input={input}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </NextUIProvider>
    </>
  );
}

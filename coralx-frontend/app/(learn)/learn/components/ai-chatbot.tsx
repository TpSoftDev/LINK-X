"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ChevronRight } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ReactMarkdown from "react-markdown";

export default function AIChatbot({ fileId }: { fileId: string }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(384); // default to 96 * 4 = 384px
  const minWidth = 80;
  const maxWidth = 800;

  const auth = getAuth();
  const user = auth.currentUser;
  const firebaseUid = user?.uid;
  const userScopedKey = firebaseUid ? `chatId_${firebaseUid}` : null;
  const isDragging = useRef(false);

  // useEffect(() => {
  //   if (messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages, isLoading, isMinimized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };
  
    const handleMouseUp = () => {
      isDragging.current = false;
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const firebaseUid = user.uid;
      const localStorageKey = `chatId_${firebaseUid}`;
      const savedChatId = localStorage.getItem(localStorageKey);

      if (savedChatId) {
        setChatId(savedChatId);
        fetch(`http://localhost:8080/student/chats/${savedChatId}/messages`, {
          method: "GET",
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              localStorage.removeItem(localStorageKey);
              setChatId(null);
              setMessages([]);
            } else {
              const formattedMessages = data.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
              }));
              setMessages(formattedMessages);
            }
          })
          .catch((err) => console.error("Error fetching messages:", err));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const newUserMessage = { role: "user", content: input };
    const updatedConversation = [...messages, newUserMessage];
    setMessages(updatedConversation);
    setIsLoading(true);
    console.log("FILEID: ")
    console.log(fileId)
  
    try {
      const requestBody: any = {
        id: chatId,
        userMessage: input,
        messages,
      };
  
      // Include fileId only on the first message of a new chat
      if (fileId) {
        requestBody.fileId = fileId;
      }
  
      const response = await fetch("http://localhost:8080/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
      if (data.error) {
        console.error("AI chat error:", data.error);
        return;
      }
  
      const assistantMessage = { role: "assistant", content: data.assistant };
      setMessages((prev) => [...prev, assistantMessage]);
  
      // Cache new chatId locally if it's the first message
      if (data.chatId && !chatId && firebaseUid) {
        setChatId(data.chatId);
        localStorage.setItem(`chatId_${firebaseUid}`, data.chatId);
      }
  
      setInput("");
    } catch (err) {
      console.error("Failed to call /ai-chat:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div
      className="fixed top-0 right-0 h-screen z-40 bg-white border-l border-gray-200 shadow-lg"
      style={{ width: `${isMinimized ? 80 : width}px` }}
    >
      {/* Drag handle for resizing */}
      {!isMinimized && (
        <div
          onMouseDown={() => (isDragging.current = true)}
          className="absolute left-0 top-0 h-full w-2 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity z-50"
        />
      )}
  
      <div className="flex flex-col h-full text-gray-900">
        {/* Header */}
        <div className="relative bg-gray-50 py-2 px-4 font-semibold flex items-center border-t border-gray-200">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isMinimized ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronRight size={18} className="rotate-180" />
            )}
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-600">
            {isMinimized ? "AI" : "AI Assistant"}
          </span>
        </div>
  
        {/* Chat content */}
        {!isMinimized && (
          <>
            <div className="flex-grow overflow-auto p-4 space-y-4 bg-white">
              {messages.map((m, index) => (
                <div
                  key={index}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-lg text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
  
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex space-x-1 bg-gray-100 text-gray-700 p-3 rounded-lg text-sm leading-relaxed animate-pulse">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
  
              <div ref={messagesEndRef} />
            </div>
  
            {/* Input form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-gray-200 flex bg-white"
            >
              <input
                className="flex-grow bg-gray-100 text-gray-900 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
              />
              <button
                type="submit"
                aria-label="Send message"
                className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

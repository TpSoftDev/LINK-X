"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { Send, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function AIChatbot() {
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="flex flex-col text-foreground bg-background border-l border-border shadow-lg min-h-full">
      {/* Chat Body */}
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out ${
          isMinimized ? "w-20" : "w-96"
        }`}
      >
        <div className="relative bg-card py-2 px-4 font-semibold flex items-center border-t border-border">
          {/* Chevron Toggle Button (left) */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMinimized ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronRight size={18} className="rotate-180" />
            )}
          </button>

          {/* Centered Title */}
          <span className="absolute left-1/2 -translate-x-1/2 text-sm">
            {isMinimized ? "AI" : "AI Assistant"}
          </span>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-grow overflow-auto p-4 space-y-4 bg-background">
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
                        ? "bg-blue-accent text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-border flex bg-card"
            >
              <input
                className="flex-grow bg-muted text-foreground rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-accent"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question..."
              />
              <button
                type="submit"
                className="bg-blue-accent text-white p-2 rounded-r-lg hover:bg-blue-accent-hover transition-colors duration-200"
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

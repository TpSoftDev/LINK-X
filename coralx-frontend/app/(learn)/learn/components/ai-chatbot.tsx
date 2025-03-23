"use client";

import { useState } from "react"
import { useChat } from "ai/react"
import { Send, Minimize2, Maximize2, ChevronRight } from "lucide-react"

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import Image from "next/image"

export default function AIChatbot() {
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div className="bg-gray-900 text-gray-100 flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-center items-center">
      <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              onClick={() => router.push("/chat")} // Navigate to /chat
            >
              Chat <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
      </div>
      <div className={`flex flex-col transition-all duration-300 ease-in-out ${isMinimized ? "w-20" : "w-96"}`}>
        <div className="bg-gray-800 py-2 px-4 font-semibold flex justify-between items-center border-t border-gray-700">
          <span>{isMinimized ? "AI" : "AI Assistant"}</span>
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-400 hover:text-gray-200">
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
        </div>
        {!isMinimized && (
          <>
            <div className="flex-grow overflow-auto p-4 space-y-4">
              {messages.map((m, index) => (
                <div key={index} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-3/4 p-3 rounded-lg ${m.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex">
              <input
                className="flex-grow bg-gray-800 text-gray-100 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question..."
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}


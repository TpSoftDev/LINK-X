// "use client";

// import { useState } from "react"
// import { useChat } from "ai/react"
// import { Send, Minimize2, Maximize2, ChevronRight } from "lucide-react"

// import { useRouter } from "next/navigation";

// import { Button } from "@/components/ui/button";
// import Image from "next/image"

// export default function AIChatbot() {
//   const router = useRouter();
//   const { messages, input, handleInputChange, handleSubmit } = useChat();
//   const [isMinimized, setIsMinimized] = useState(false);

//   return (
//     <div className="fixed bottom-4 right-4 bg-gray-900 text-gray-100 flex flex-col shadow-lg rounded-lg">
//       <div className="bg-gray-800 p-4 flex justify-center items-center">
//         <Button
//           size="sm"
//           className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
//           onClick={() => router.push("/chat")} // Navigate to /chat
//         >
//           Chat <ChevronRight className="ml-2 h-4 w-4" />
//         </Button>
//       </div>
//       <div className={`flex flex-col transition-all duration-300 ease-in-out ${isMinimized ? "w-20" : "w-96"}`}>
//         <div className="bg-gray-800 py-2 px-4 font-semibold flex justify-between items-center border-t border-gray-700">
//           <span>{isMinimized ? "AI" : "AI Assistant"}</span>
//           <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-400 hover:text-gray-200">
//             {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
//           </button>
//         </div>
//         {!isMinimized && (
//           <>
//             <div className="flex-grow overflow-auto p-4 space-y-4 max-h-60">
//               {messages.map((m, index) => (
//                 <div key={index} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
//                   <div className={`max-w-3/4 p-3 rounded-lg ${m.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}>
//                     {m.content}
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex">
//               <input
//                 className="flex-grow bg-gray-800 text-gray-100 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={input}
//                 onChange={handleInputChange}
//                 placeholder="Ask a question..."
//               />
//               <button
//                 type="submit"
//                 className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors duration-200"
//               >
//                 <Send size={20} />
//               </button>
//             </form>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import { Send, Minimize2, Maximize2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AIChatbot() {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!input.trim()) return;
  
    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: input }),
      });
  
      const data = await response.json();
  
      if (data.error) {
        console.error("Chatbot error:", data.error);
        return;
      }
  
      if (data.response) {
        setMessages((prev) => [...prev, { role: "user", content: input }, { role: "assistant", content: data.response }]);
      }
  
      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };
  

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-gray-100 flex flex-col shadow-lg rounded-lg">
      <div className="bg-gray-800 p-4 flex justify-center items-center">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          onClick={() => router.push("/chat")}
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
            <div className="flex-grow overflow-auto p-4 space-y-4 max-h-60">
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
                onChange={(e) => setInput(e.target.value)}
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
  );
}

import Sidebar from "./components/sidebar"
import LessonContent from "./components/lesson-content"
import AIChatbot from "./components/ai-chatbot.tsx"
import Header from '@/components/link-x/Header';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Fixed Height Header */}
      <div className="h-16 flex-shrink-0">
        <Header isLoggedIn={true} />
      </div>

      {/* Content that takes up the rest of the screen */}
      <div className="flex flex-grow overflow-hidden">
        <Sidebar />
        <main className="flex-grow overflow-auto p-6 bg-gray-800">
          <LessonContent />
        </main>
        <AIChatbot />
      </div>
    </div>
  )
}
// app/(homepage)/layout.tsx
import { Sidebar } from "@/components/sidebar";
import { ChatProvider } from "@/context/chat-context";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <main className="flex h-full text-white overflow-hidden">
      <ChatProvider>
        <Sidebar />
        <div className="h-full w-full overflow-hidden" >{children}</div>
      </ChatProvider>
    </main>
  );
}

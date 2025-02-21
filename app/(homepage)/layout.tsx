// app/(homepage)/layout.tsx
import { Sidebar } from "@/components/sidebar";
import { ChatProvider } from "@/context/chat-context";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <ChatProvider>
      <main className="flex h-full text-white">
        <Sidebar />
        <div className="h-full w-full">{children}</div>
      </main>
    </ChatProvider>
  );
}

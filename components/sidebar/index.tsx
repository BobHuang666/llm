// components/sidebar/index.tsx
import { ChatList } from './chat-list';

export const Sidebar = () => (
  <div className="h-full hidden lg:flex lg:w-[300px] bg-neutral-950 p-4">
    <ChatList />
  </div>
);

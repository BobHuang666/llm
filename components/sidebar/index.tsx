// components/sidebar/index.tsx
import { ChatList } from './chat-list';

export const Sidebar = () => (
  <div className="h-full hidden lg:flex lg:w-[270px] min-w-[270px] bg-neutral-950 p-4">
    <ChatList />
  </div>
);

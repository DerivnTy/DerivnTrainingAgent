import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ChatContextValue = {
  conversationsVersion: number;
  refreshConversations: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversationsVersion, setVersion] = useState(0);
  const refreshConversations = useCallback(() => setVersion((v) => v + 1), []);
  return (
    <ChatContext.Provider value={{ conversationsVersion, refreshConversations }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

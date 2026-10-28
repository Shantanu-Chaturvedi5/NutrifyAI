import type { ReactNode } from "react";
import type { ChatSessionResponse } from "@/lib/actions/chat";
import { ChatSessionsList } from "@/components/ChatSessionsList";

export function ChatPageShell({
  sessions,
  activeSessionId,
  children,
}: {
  sessions: ChatSessionResponse[];
  activeSessionId?: number;
  children: ReactNode;
}) {
  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1540px] -translate-x-1/2 sm:w-[calc(100vw-3rem)] xl:w-[calc(100vw-5rem)]">
      <div className="grid items-start gap-4 lg:grid-cols-[350px_minmax(0,1fr)] xl:gap-5">
        <ChatSessionsList initialSessions={sessions} activeSessionId={activeSessionId} />
        {children}
      </div>
    </div>
  );
}

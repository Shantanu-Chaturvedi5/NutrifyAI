import { listSessions } from "@/lib/actions/chat";
import { ChatLanding } from "@/components/ChatLanding";
import { ChatPageShell } from "@/components/ChatPageShell";

export default async function ChatListPage() {
  const sessions = await listSessions();

  return (
    <ChatPageShell sessions={sessions}>
      <ChatLanding />
    </ChatPageShell>
  );
}
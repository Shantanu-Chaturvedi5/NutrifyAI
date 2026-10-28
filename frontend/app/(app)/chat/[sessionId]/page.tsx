import { getMessages, listSessions } from "@/lib/actions/chat";
import { ChatWindow } from "@/components/ChatWindow";
import { ChatPageShell } from "@/components/ChatPageShell";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const id = Number(sessionId);
  const [messages, sessions] = await Promise.all([getMessages(id), listSessions()]);

  return (
    <ChatPageShell sessions={sessions} activeSessionId={id}>
      <ChatWindow sessionId={id} messages={messages} />
    </ChatPageShell>
  );
}

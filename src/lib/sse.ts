// Streams an SSE chat-completions response from a fetch Response.
// Calls onDelta for each text token, onMeta for any "event: meta" payloads
// (used to receive the conversation_id from /api/chat).

export type SseHandlers = {
  onDelta: (text: string) => void;
  onMeta?: (data: Record<string, unknown>) => void;
  signal?: AbortSignal;
};

export async function readChatStream(
  response: Response,
  { onDelta, onMeta, signal }: SseHandlers
): Promise<void> {
  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent: string | null = null;
  let done = false;

  const onAbort = () => {
    reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", onAbort);

  try {
    while (!done) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);

        // Blank line = event boundary; reset event type
        if (line === "") {
          currentEvent = null;
          continue;
        }
        if (line.startsWith(":")) continue; // SSE comment / keepalive

        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }
        if (!line.startsWith("data: ")) continue;

        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(json);
          if (currentEvent === "meta") {
            onMeta?.(parsed);
            continue;
          }
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) onDelta(delta);
        } catch {
          // Partial JSON across chunks — put back and wait for more
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Final flush of any leftover line that arrived without trailing newline
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw || raw.startsWith(":")) continue;
        if (raw.startsWith("event: ")) {
          currentEvent = raw.slice(7).trim();
          continue;
        }
        if (!raw.startsWith("data: ")) continue;
        const json = raw.slice(6).trim();
        if (!json || json === "[DONE]") continue;
        try {
          const parsed = JSON.parse(json);
          if (currentEvent === "meta") {
            onMeta?.(parsed);
            continue;
          }
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) onDelta(delta);
        } catch {
          // ignore
        }
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

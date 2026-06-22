import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import "./ChatBot.css";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ─── sub-components ─────────────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="cb-typing-row">
      <div className="cb-msg-avatar">🤖</div>
      <div className="cb-typing-bubble">
        <span className="cb-typing-dot" />
        <span className="cb-typing-dot" />
        <span className="cb-typing-dot" />
      </div>
    </div>
  );
}

function MessageRow({ msg, onOptionClick, onWorkflowClick }) {
  const isUser = msg.sender === "user";
  const hasButtons =
    msg.sender === "bot" && msg.node?.config?.nodeType === "buttons";

  return (
    <div className={`cb-msg-row ${isUser ? "user" : "bot"}`}>
      {/* Bot avatar */}
      {!isUser && <div className="cb-msg-avatar">🤖</div>}

      <div className="cb-bubble-wrap">
        <div className="cb-bubble">{msg.text}</div>

        {/* Timestamp */}
        <span className="cb-timestamp">{formatTime(msg.time)}</span>

        {/* Option / workflow buttons */}
        {hasButtons && (
          <div className="cb-options">
            {msg.node.config.buttons?.map((btn, idx) => {
              // Workflow button (has .id)
              if (btn.id) {
                return (
                  <button
                    key={btn.id}
                    className="cb-option-btn"
                    onClick={() => onWorkflowClick(btn)}
                  >
                    {btn.name}
                  </button>
                );
              }
              // Dynamic response button
              return (
                <button
                  key={btn.value + idx}
                  className="cb-option-btn"
                  onClick={() => onOptionClick(btn.value)}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User side spacer (keeps alignment without an avatar) */}
      {isUser && <div className="cb-msg-avatar-spacer" />}
    </div>
  );
}

/* ─── Send icon SVG ──────────────────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ChatBot() {
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ── WebSocket setup ───────────────────────────────────────────────────── */
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: () => {},

      onConnect: () => {
        setConnected(true);

        client.subscribe("/app/chat.init", (response) => {
          const data = JSON.parse(response.body);
          setSessionId(data.sessionId);

          // Subscribe to session topic
          client.subscribe(`/topic/chat/${data.sessionId}`, (msg) => {
            const responseData = JSON.parse(msg.body);
            console.log("Received message:", responseData);
            if (
              responseData?.config?.nodeType === "buttons" &&
              responseData?.response
            ) {
              responseData.config.buttons = responseData.response
                .split("\n")
                .filter((item) => item.trim())
                .map((item) => ({ label: item.trim(), value: item.trim() }));
            }

            setCurrentNode(responseData);
            setIsTyping(false);

            setChat((prev) => [
              ...prev,
              {
                sender: "bot",
                text:
                  responseData?.config?.nodeType === "buttons"
                    ? "Please select an option:"
                    : responseData.response,
                node: responseData,
                time: new Date(),
              },
            ]);
          });

          // Initial workflow list
          if (data.workflows?.length > 0) {
            const node = {
              ...data.workflows[0],
              config: { nodeType: "buttons", buttons: data.workflows },
            };
            setCurrentNode(node);
            setChat([
              {
                sender: "bot",
                text: "👋 Hi! I'm your assistant. Please select a workflow to get started:",
                node,
                time: new Date(),
              },
            ]);
          }
        });

        client.publish({ destination: "/app/chat.init", body: "{}" });
      },

      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate();
  }, []);

  /* ── Auto-scroll ───────────────────────────────────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isTyping]);

  /* ── Send helpers ──────────────────────────────────────────────────────── */
  const sendMessage = useCallback(
    (value) => {
      if (!stompClient?.connected || !sessionId) return;
      setIsTyping(true);
      stompClient.publish({
        destination: "/app/chat.message",
        body: JSON.stringify({
          sessionId: currentNode?.sessionId || sessionId,
          message: value,
        }),
      });
    },
    [stompClient, sessionId, currentNode]
  );

  const handleSend = () => {
    if (!message.trim()) return;
    const text = message.trim();

    setChat((prev) => [
      ...prev,
      { sender: "user", text, time: new Date() },
    ]);
    sendMessage(text);
    setMessage("");
    inputRef.current?.focus();
  };

  const handleOptionClick = (value) => {
    setChat((prev) => [
      ...prev,
      { sender: "user", text: value, time: new Date() },
    ]);
    sendMessage(value);
  };

  const handleWorkflowClick = (workflow) => {
    if (!stompClient?.connected || !sessionId) return;
    setIsTyping(true);

    stompClient.publish({
      destination: "/app/chat.start",
      body: JSON.stringify({ sessionId, workflowId: workflow.id }),
    });

    setChat((prev) => [
      ...prev,
      { sender: "user", text: workflow.name, time: new Date() },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Input visibility ──────────────────────────────────────────────────── */
  const showInput = currentNode?.node?.config?.nodeType === "input";

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="cb-wrapper">
      <div className="cb-shell">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="cb-header">
          <div className="cb-avatar">🤖</div>
          <div className="cb-header-info">
            <p className="cb-header-title">AI Assistant</p>
            <div className="cb-header-status">
              <span className={`cb-status-dot ${connected ? "" : "offline"}`} />
              <span className="cb-status-text">
                {connected ? "Online — ready to help" : "Connecting…"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Connecting banner ─────────────────────────────────────────── */}
        {!connected && (
          <div className="cb-connecting">
            <div className="cb-connecting-spinner" />
            Connecting to server…
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────────────────── */}
        <div className="cb-messages">
          {chat.length === 0 && (
            <div className="cb-empty">
              <span className="cb-empty-icon">💬</span>
              <p>Start a conversation by selecting a workflow below</p>
            </div>
          )}

          {chat.map((msg, index) => (
            <MessageRow
              key={index}
              msg={msg}
              onOptionClick={handleOptionClick}
              onWorkflowClick={handleWorkflowClick}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          <div ref={chatEndRef} />
        </div>

        {/* ── Footer / Input ────────────────────────────────────────────── */}
        <div className="cb-footer">
          {showInput ? (
            <>
              <div className="cb-input-row">
                <input
                  ref={inputRef}
                  className="cb-text-input"
                  value={message}
                  placeholder={currentNode?.name || "Type your message…"}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                <button
                  className="cb-send-btn"
                  onClick={handleSend}
                  disabled={!message.trim() || !connected}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
              <p className="cb-input-hint">Press Enter to send</p>
            </>
          ) : (
            <p className="cb-input-hint" style={{ margin: 0 }}>
              {connected
                ? "Select an option above to continue"
                : "Waiting for connection…"}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import "./ChatBot.css";

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
      debug: () => { },
      onConnect: () => {
        setConnected(true);

        client.subscribe("/app/chat.init", (response) => {
          const data = JSON.parse(response.body);
          setSessionId(data.sessionId);

          // Subscribe to session topic
          client.subscribe(`/topic/chat/${data.sessionId}`, (msg) => {
            let responseData = JSON.parse(msg.body);
            console.log("Received message:", responseData);

            if (responseData?.node?.config?.nodeType === "buttons" || responseData?.node?.config?.apiType === "buttons") {
              let buttons = responseData.response.split("\n").filter((item) => item.trim()).map((item) => (
                { 
                  name: item.trim(), 
                  id: item.trim() 
                }
              ));
              responseData.buttons = buttons;
            }

            setCurrentNode(responseData);
            setIsTyping(false);

            if (responseData?.node?.config?.nodeType == "api") {
              
              if (responseData?.node?.config?.apiType === "buttons") {
                setChat((prev) => [
                  ...prev,
                  {
                    sender: "bot",
                    text: responseData?.node?.name,
                    node: responseData,
                    time: new Date(),
                  },
                ]);
              }

            } else {
              
              setChat((prev) => [
                ...prev,
                {
                  sender: "bot",
                  text: responseData?.config?.nodeType === "buttons" ? "Please select an option:" : responseData.response,
                  node: responseData,
                  time: new Date(),
                },
              ]);

            }

          });

          // Initial workflow list
          if (data.workflows?.length > 0) {
            const node = {
              workflowsNode:true,
              node: {
                ...data.workflows[0],
                config: { nodeType: "buttons", },
              },
              buttons: data.workflows,
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

         const payload = {
      sessionId: currentNode?.sessionId || sessionId,
      message: value,
    };

    console.log("Sending payload:", payload);

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

    // Determine which variable this input maps to
    const variableName = currentField?.variableName || null;

    setChat((prev) => [
      ...prev,
      { sender: "user", text, time: new Date() },
    ]);

    // Send with variable metadata so backend can store it correctly
    if (!stompClient?.connected || !sessionId) return;
    setIsTyping(true);
    stompClient.publish({
      destination: "/app/chat.message",
      body: JSON.stringify({
        sessionId: currentNode?.sessionId || sessionId,
        message: text,
        variableName,        // ← tells backend which variable to store this under
      }),
    });

    // Advance to next field if there are more
    if (inputFields.length > 1 && inputFieldIndexRef.current < inputFields.length - 1) {
      inputFieldIndexRef.current += 1;
    }

    setMessage("");
    inputRef.current?.focus();
  };

  const handleOptionClick = (value) => {
    setChat((prev) => [...prev,
      { 
        sender: "user", 
        text: value.id, 
        time: new Date() 
      },
    ]);
    sendMessage(value.id);
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

  /* ── Input visibility + dynamic field resolution ──────────────────────── */
  const showInput = currentNode?.node?.config?.nodeType === "input";

  // Which input field are we currently collecting?
  // Track index across responses via a ref so it persists between re-renders
  const inputFieldIndexRef = useRef(0);

  // Reset field index whenever we move to a new node
  useEffect(() => {
    if (currentNode?.node?.config?.nodeType === "input") {
      inputFieldIndexRef.current = 0;
    }
  }, [currentNode?.node?.id]);

  const inputFields = currentNode?.node?.config?.inputFields || [];
  const currentField = inputFields[inputFieldIndexRef.current] || null;
  const inputPlaceholder = currentField?.fieldName || currentNode?.node?.name || "Type your message…";

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
              {/* Show which field we're collecting */}
              {currentField && (
                <div style={{ marginBottom: 8, padding: "6px 12px", background: "#eef2ff", borderRadius: 8, fontSize: 12.5, color: "#4338ca", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>📝 {currentField.fieldName}</span>
                  <span style={{ color: "#818cf8", fontSize: 11 }}>
                    → stores as <code style={{ background: "#e0e7ff", padding: "1px 5px", borderRadius: 4 }}>{currentField.variableName}</code>
                  </span>
                  {inputFields.length > 1 && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#6366f1" }}>
                      {inputFieldIndexRef.current + 1}/{inputFields.length}
                    </span>
                  )}
                </div>
              )}
              <div className="cb-input-row">
                <input
                  ref={inputRef}
                  className="cb-text-input"
                  value={message}
                  placeholder={inputPlaceholder}
                  type={currentField?.inputType || "text"}
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
              {connected ? "Select an option above to continue" : "Waiting for connection…"}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Main Function End ────────────────────────────────────────────────────────────── */



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
  const hasButtons = msg.sender === "bot" &&
    (msg.node?.node?.config?.nodeType === "buttons" || msg.node?.node?.config?.apiType === "buttons");

    // console.log(msg)

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
            {msg.node?.buttons?.map((btn, idx) => {
              // Workflow button (has .id)
              return (
                <button
                  key={btn.id}
                  className="cb-option-btn"
                  onClick={() => {msg?.node?.workflowsNode ? onWorkflowClick(btn) : onOptionClick(btn) }}
                >
                  {btn.name}
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
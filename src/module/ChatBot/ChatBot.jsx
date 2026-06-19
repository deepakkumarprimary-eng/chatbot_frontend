import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function ChatBot() {
  const [client, setClient] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),

      reconnectDelay: 5000,

      debug: (msg) => {
        console.log("STOMP:", msg);
      },

      onConnect: () => {
        console.log("Connected");

        stompClient.subscribe(
          "/app/chat.init",
          (response) => {

            const data = JSON.parse(response.body);

            console.log("Session ID:", data.sessionId);

            // save session
            setSessionId(data.sessionId);


            // subscribe to session topic
            stompClient.subscribe(
              `/topic/chat/${data.sessionId}`,
              (message) => {

                const responseData = JSON.parse(
                  message.body
                );

                console.log("Chat Response:", responseData);


                setCurrentNode(responseData);

                setChat((prev) => [
                  ...prev,
                  {
                    sender: "bot",
                    text: responseData.response,
                    node: responseData,
                  },
                ]);

              }
            );


            if (data.workflows?.length > 0) {

              const node = {
                ...data.workflows[0],
                config: {
                  nodeType: "buttons",
                  buttons: data.workflows,
                },
              };


              setCurrentNode(node);

              setChat((prev) => [
                ...prev,
                {
                  sender: "bot",
                  text: "Please select a workflow to start:",
                  node,
                },
              ]);

            }

          }
        );
        // Trigger init if backend expects it
        stompClient.publish({
          destination: "/app/chat.init",
          body: "{}",
        });





      },

      onStompError: (frame) => {
        console.error(
          "Broker error:",
          frame.headers["message"]
        );
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chat]);

  const sendMessage = (value) => {
    console.log("Sending message:", value);
    if (!client?.connected || !sessionId)
      return;

    client.publish({
      destination: "/app/chat.message",
      body: JSON.stringify({
        sessionId:currentNode.sessionId,
        message: value,
        }),
    });
  };

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessage(message);

    setChat((prev) => [
      ...prev,
      {
        sender: "user",
        text: message,
      },
    ]);

    setMessage("");
  };

  const handleButtonClick = (workflow) => {
    if (!client?.connected || !sessionId)
      return;

    client.publish({
      destination: "/app/chat.start",
      body: JSON.stringify({
        sessionId: sessionId,
        workflowId: workflow.id,
      }),
    });

    setChat((prev) => [
      ...prev,
      {
        sender: "user",
        text: workflow.name,
      },
    ]);
  };

  const renderInputArea = () => {
    // console.log("Current Node:  => renderInputArea => ", currentNode);
    if (
      !currentNode ||
      currentNode?.node?.config?.nodeType !== "input"
    ) {
      return null;
    }

    return (
      <>
        <Form.Control
          value={message}
          placeholder={currentNode?.name}
          onChange={(e) => setMessage(e.target.value)
          }
          // onKeyDown={(e) =>
          //   e.key === "Enter" && handleSend()
          // }
        />

        <Button
          className="mt-2 w-100"
          onClick={handleSend}
        >
          Send
        </Button>
      </>
    );
  };

  return (
    <div
      style={{
        width: 450,
        margin: "20px auto",
        border: "1px solid #ddd",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 500,
          overflowY: "auto",
          padding: 15,
          background: "#fafafa",
        }}
      >
        {chat.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign:
                msg.sender === "user"
                  ? "right"
                  : "left",
              marginBottom: 15,
            }}
          >
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                display: "inline-block",
                background:
                  msg.sender === "user"
                    ? "#0d6efd"
                    : "#f1f1f1",
                color:
                  msg.sender === "user"
                    ? "#fff"
                    : "#000",
                maxWidth: "75%",
              }}
            >
              {msg.text}
            </div>

            {msg.sender === "bot" && msg.node?.config?.nodeType === "buttons" && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {msg.node.config.buttons?.map(
                  (btn) => (
                    <Button
                      key={btn.name}
                      size="sm"
                      variant="outline-primary"
                      onClick={() =>
                        handleButtonClick(btn)
                      }
                    >
                      {btn.name}
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div
        className="p-3"
        style={{
          borderTop: "1px solid #ddd",
          background: "#fff",
        }}
      >
        {renderInputArea()}
      </div>
    </div>
  );
}
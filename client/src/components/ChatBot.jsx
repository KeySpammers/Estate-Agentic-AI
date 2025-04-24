// ChatBot.jsx
import React, { useState } from "react";
import "./ChatBot.css";
import { MessageCircle, X } from "lucide-react";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! Ask me about rental trends or pricing strategies!",
    },
  ]);
  const [input, setInput] = useState("");

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "I'm thinking about that..." },
      ]);
    }, 1000);
  };

  return (
    <>
      <div className="chatButton" onClick={toggleChat}>
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </div>

      {isOpen && (
        <div className="chatBox">
          <div className="chatHeader">Agentic AI</div>
          <div className="chatBody">
            {messages.map((msg, i) => (
              <div key={i} className={msg.from === "bot" ? "bot" : "user"}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chatInput">
            <input
              type="text"
              value={input}
              placeholder="Type a question..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;

"use client";

import { useState, useEffect } from "react";

export default function ChatbotFloatingButton() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating Robot Button */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          w-16 h-16 rounded-full
          bg-gradient-to-br from-blue-500 to-blue-700
          shadow-[0_0_25px_rgba(59,130,246,0.7)]
          flex items-center justify-center
          hover:scale-110 hover:shadow-[0_0_35px_rgba(59,130,246,0.9)]
          transition-all animate-pulse-soft
          text-white text-3xl
        "
      >
        🤖
      </button>

      {/* Tooltip */}
      {showHint && (
        <div
          className="
            fixed bottom-24 right-6 z-50
            bg-white text-gray-800 px-4 py-2 rounded-xl shadow-xl
            border border-gray-200 animate-fade-in
          "
        >
          Chat with Envizor
        </div>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className="
            fixed bottom-6 right-6 z-50
            w-[380px] h-[520px]
            bg-white rounded-2xl shadow-2xl border border-gray-200
            flex flex-col overflow-hidden
          "
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white flex justify-between items-center">
            <h2 className="text-lg font-semibold">Envizor Assistant</h2>
            <button onClick={() => setOpen(false)} className="text-white text-xl">
              ✕
            </button>
          </div>

          {/* Chat Area */}
          <ChatPanel />
        </div>
      )}
    </>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        "👋 **Hi, I’m Envizor — here to help you work faster with Terraform + Saviynt.**\n\nI can walk you through the wizard, explain any screen, compare environments, discover tenants, or help you generate and deploy Terraform safely.\n\n**What would you like to do today?**\n\n• Discover Saviynt tenants\n• Explore Terraform workspaces\n• Compare tenants or workspaces\n• Generate Terraform files\n• Deploy Terraform to Saviynt\n• Understand how this wizard works",
    },
  ]);

  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: input }]);
    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "Got it — I’ll guide you through that. Tell me a bit more.",
      },
    ]);
  };

  return (
    <>
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[80%] whitespace-pre-line shadow-sm ${
              m.from === "bot"
                ? "bg-blue-50 text-gray-900 border border-blue-200"
                : "bg-gradient-to-br from-blue-500 to-blue-700 text-white ml-auto shadow-lg"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Envizor..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
        />
        <button
          onClick={send}
          className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg shadow-md hover:scale-105 transition"
        >
          Send
        </button>
      </div>
    </>
  );
}

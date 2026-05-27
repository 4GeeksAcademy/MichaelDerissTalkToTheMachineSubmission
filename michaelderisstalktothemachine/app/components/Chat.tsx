"use client";

import React, { useState, useEffect, useRef } from "react";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192"; // Llama 3 model by Meta

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
  const [modelName, setModelName] = useState("");
  const [responseTime, setResponseTime] = useState(null);
  const messagesEndRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("chat-session");
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.messages || []);
      setUsage(parsed.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
      setModelName(parsed.modelName || "");
    }
  }, []);

  // Save to localStorage after every update
  useEffect(() => {
    localStorage.setItem(
      "chat-session",
      JSON.stringify({ messages, usage, modelName })
    );
  }, [messages, usage, modelName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: newMessages,
        }),
      });
      const elapsed = Date.now() - start;
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "API error");
      }
      const data = await res.json();
      const aiMessage = data.choices[0].message;
      setMessages((prev) => [...prev, aiMessage]);
      setModelName(data.model);
      setResponseTime(elapsed);
      // Accumulate usage
      setUsage((prev) => ({
        prompt_tokens: prev.prompt_tokens + (data.usage?.prompt_tokens || 0),
        completion_tokens: prev.completion_tokens + (data.usage?.completion_tokens || 0),
        total_tokens: prev.total_tokens + (data.usage?.total_tokens || 0),
      }));
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setUsage({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
    setModelName("");
    setError("");
    localStorage.removeItem("chat-session");
  };

  return (
    <div className="flex flex-col md:flex-row w-full gap-8">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col h-[70vh] border rounded-lg p-4 bg-white dark:bg-zinc-900">
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.length === 0 && (
            <div className="text-zinc-400 text-center mt-8">No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`my-2 p-2 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-blue-100 self-end" : "bg-zinc-200 self-start dark:bg-zinc-800"}`}
            >
              <span className="block text-xs text-zinc-500 mb-1">{msg.role === "user" ? "You" : "AI"}</span>
              <span>{msg.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            {loading ? "Thinking..." : "Send"}
          </button>
          <button
            type="button"
            className="ml-2 px-4 py-2 border rounded text-zinc-600"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </button>
        </form>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
      {/* Metrics panel */}
      <div className="w-full md:w-64 border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-950">
        <h2 className="font-semibold mb-2">Session Stats</h2>
        <div className="text-sm mb-1">Prompt tokens: <span className="font-mono">{usage.prompt_tokens}</span></div>
        <div className="text-sm mb-1">Completion tokens: <span className="font-mono">{usage.completion_tokens}</span></div>
        <div className="text-sm mb-1">Total tokens: <span className="font-mono">{usage.total_tokens}</span></div>
        <div className="text-sm mb-1">Model: <span className="font-mono">{modelName}</span></div>
        <div className="text-sm mb-1">Last response time: <span className="font-mono">{responseTime ? responseTime + " ms" : "-"}</span></div>
      </div>
    </div>
  );
}

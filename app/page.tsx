"use client";
import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./components/Chat"), { ssr: false });

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-8 px-2 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-zinc-50">Groq Llama 3 Chat Demo</h1>
      <Chat />
    </main>
  );
}

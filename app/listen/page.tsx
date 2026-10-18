import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Headphones } from "lucide-react";
import Player from "./Player";

export const metadata: Metadata = {
  title: "Live Translation - Slavic Evangelical Church",
  description: "Listen to the live translation of the service on your phone.",
};

export default function ListenPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="max-w-md w-full mx-auto px-4 py-6 flex-1 flex flex-col">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center mb-6">
            <Headphones size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Live Translation</h1>
          <p className="text-gray-400 mb-12">Put in your headphones and tap the button to start listening.</p>

          <Player />
        </div>

        <p className="text-xs text-gray-500 text-center">
          Use your phone&apos;s volume buttons to adjust the volume. Keep this page open while you listen.
        </p>
      </div>
    </main>
  );
}

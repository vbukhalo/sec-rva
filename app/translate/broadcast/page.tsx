import type { Metadata } from "next";
import Broadcaster from "./Broadcaster";

export const metadata: Metadata = {
  title: "Translator Broadcast - Slavic Evangelical Church",
  robots: { index: false, follow: false },
};

export default function BroadcastPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Translator Broadcast</h1>
        <p className="text-gray-400 mb-8">
          Test your microphone, then go live. Listeners join at <span className="text-teal-300">/listen</span>.
        </p>
        <Broadcaster />
      </div>
    </main>
  );
}

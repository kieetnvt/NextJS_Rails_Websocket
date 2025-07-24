import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">NextJS + Rails WebSocket Demo</h1>
          <p className="text-lg text-gray-600 mb-8">
            A simple real-time chat application using Next.js frontend and Rails backend with Action Cable
          </p>
          <Link 
            href="/chat"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Open Chat Room
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Real-time messaging with WebSocket
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Next.js with TypeScript frontend
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Rails API backend with Action Cable
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              PostgreSQL database
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Tailwind CSS styling
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

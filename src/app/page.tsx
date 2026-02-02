"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🎲 Board Games
          </h1>
          <p className="text-xl text-purple-300">
            เลือกเกมที่คุณต้องการเล่นกับเพื่อน
          </p>
        </div>

        {/* Game Selection Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Guess Me Card (เดิม Who Am I) */}
          <Link href="/guess-me" className="group">
            <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-6 border-2 border-pink-500/30 hover:border-pink-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20 h-full">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
              
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎭</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Guess Me
                </h2>
                <p className="text-purple-200 mb-4 text-sm">
                  เกมทายตัวตน - ทุกคนได้รับคำแต่ไม่รู้คำของตัวเอง
                  ถามคำถามเพื่อทายว่าคุณคือใคร!
                </p>
                <div className="flex items-center gap-2 text-pink-300 text-sm">
                  <span>👥 2-20 คน</span>
                  <span className="text-pink-500">•</span>
                  <span>⏱️ 5-15 นาที</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 text-pink-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Where Are We Card (เดิม Spy Fall) */}
          <Link href="/where-are-we" className="group">
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-lg rounded-3xl p-6 border-2 border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 h-full">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              
              <div className="relative z-10">
                <div className="text-6xl mb-4">🕵️</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Where Are We
                </h2>
                <p className="text-cyan-200 mb-4 text-sm">
                  หาสายลับ! ทุกคนรู้สถานที่ยกเว้น Spy
                  ถามคำถามเพื่อหาตัว Spy ให้เจอ!
                </p>
                <div className="flex items-center gap-2 text-cyan-300 text-sm">
                  <span>👥 3-10 คน</span>
                  <span className="text-cyan-500">•</span>
                  <span>⏱️ ผู้เล่น × 1 นาที</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* The Imposter Card (เดิม Undercover) */}
          <Link href="/imposter" className="group md:col-span-2 lg:col-span-1">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-lg rounded-3xl p-6 border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 h-full">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
              
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎭</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  The Imposter
                </h2>
                <p className="text-purple-200 mb-4 text-sm">
                  หาคนแปลกปลอม! Citizen ได้คำเหมือนกัน
                  Imposter ได้คำคล้าย The Blank ไม่รู้คำ!
                </p>
                <div className="flex items-center gap-2 text-purple-300 text-sm">
                  <span>👥 3-10 คน</span>
                  <span className="text-purple-500">•</span>
                  <span>⏱️ ไม่จำกัดเวลา</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-purple-400 text-sm">
          <p>เล่นผ่าน LAN/WiFi กับเพื่อนได้เลย! 🎉</p>
        </div>
      </div>
    </div>
  );
}

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
        <div className="grid md:grid-cols-2 gap-8">
          {/* Who Am I Card */}
          <Link href="/who-am-i" className="group">
            <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-pink-500/30 hover:border-pink-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
              
              <div className="relative z-10">
                <div className="text-7xl mb-6">🎭</div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Who Am I?
                </h2>
                <p className="text-purple-200 mb-6">
                  เกมทายตัวตน - ทุกคนได้รับคำแต่ไม่รู้คำของตัวเอง
                  ถามคำถามเพื่อทายว่าคุณคือใคร!
                </p>
                <div className="flex items-center gap-2 text-pink-300">
                  <span>👥 2-20 คน</span>
                  <span className="text-pink-500">•</span>
                  <span>⏱️ 5-15 นาที/รอบ</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-6 right-6 text-pink-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Spy Fall Card */}
          <Link href="/spy-fall" className="group">
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              
              <div className="relative z-10">
                <div className="text-7xl mb-6">🕵️</div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Spy Fall
                </h2>
                <p className="text-cyan-200 mb-6">
                  หาสายลับ! ทุกคนรู้สถานที่ยกเว้น Spy
                  ถามคำถามเพื่อหาตัว Spy ให้เจอ!
                </p>
                <div className="flex items-center gap-2 text-cyan-300">
                  <span>👥 3-10 คน</span>
                  <span className="text-cyan-500">•</span>
                  <span>⏱️ ผู้เล่น × 1 นาที</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-6 right-6 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

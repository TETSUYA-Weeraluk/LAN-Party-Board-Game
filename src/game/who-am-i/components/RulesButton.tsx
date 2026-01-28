"use client";

import { useState } from "react";
import RulesModal from "./RulesModal";

export default function RulesButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Fixed button at top-right corner */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed top-4 right-4 z-40 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all shadow-lg hover:scale-110"
        title="วิธีการเล่น"
      >
        <span className="text-2xl">❓</span>
      </button>

      {/* Rules Modal */}
      <RulesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

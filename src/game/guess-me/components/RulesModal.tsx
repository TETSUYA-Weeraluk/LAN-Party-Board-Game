"use client";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          📖 วิธีการเล่น Who Am I
        </h2>

        {/* Content */}
        <div className="space-y-6 text-white">
          {/* Game Overview */}
          <section>
            <h3 className="text-lg font-semibold text-pink-300 mb-2">
              🎭 เกี่ยวกับเกม
            </h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Who Am I เป็นเกมทายคำ โดยผู้เล่นแต่ละคนจะได้รับคำที่ตัวเองไม่รู้
              แต่คนอื่นจะเห็น ผู้เล่นต้องถามคำถามและทายว่าคำของตัวเองคืออะไร
            </p>
          </section>

          {/* How to Play */}
          <section>
            <h3 className="text-lg font-semibold text-pink-300 mb-2">
              🎮 ขั้นตอนการเล่น
            </h3>
            <ol className="list-decimal list-inside text-purple-200 text-sm space-y-2">
              <li>Host สร้างห้องและรอผู้เล่นอื่นเข้าร่วม</li>
              <li>Host เลือกหมวดหมู่หรือสุ่มหมวด แล้วกด "เริ่มเกม"</li>
              <li>ทุกคนจะได้รับคำ โดยจะเห็นคำของคนอื่นแต่ไม่เห็นคำของตัวเอง</li>
              <li>ถามคำถามเพื่อทายว่าคำของตัวเองคืออะไร (ถามด้วยเสียง)</li>
              <li>เมื่อทายถูก Host จะกดยืนยันให้</li>
              <li>เล่นจนครบทุกคน แล้วเริ่มรอบใหม่ได้</li>
            </ol>
          </section>

          {/* Scoring */}
          <section>
            <h3 className="text-lg font-semibold text-pink-300 mb-2">
              🏆 ระบบคะแนน
            </h3>
            <ul className="text-purple-200 text-sm space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">🥇 อันดับ 1:</span>
                <span>3 คะแนน</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-300 font-bold">🥈 อันดับ 2:</span>
                <span>2 คะแนน</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600 font-bold">🥉 อันดับ 3:</span>
                <span>1 คะแนน</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">อันดับ 4+:</span>
                <span>0 คะแนน</span>
              </li>
            </ul>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold text-pink-300 mb-2">
              💡 เคล็ดลับ
            </h3>
            <ul className="list-disc list-inside text-purple-200 text-sm space-y-1">
              <li>ถามคำถามแบบ ใช่/ไม่ใช่ เพื่อจำกัดตัวเลือก</li>
              <li>สังเกตปฏิกิริยาของคนอื่นเมื่อถาม</li>
              <li>ถ้าหมดเวลาสามารถกด "เปิดเผยคำ" เพื่อยอมแพ้</li>
              <li>ปิดหน้าจอ/สลับแอปได้ จะมีเวลา 10 นาทีในการกลับมา</li>
            </ul>
          </section>

          {/* Host Controls */}
          <section>
            <h3 className="text-lg font-semibold text-pink-300 mb-2">
              👑 สำหรับ Host
            </h3>
            <ul className="list-disc list-inside text-purple-200 text-sm space-y-1">
              <li>กด "ทายถูก" เมื่อผู้เล่นทายคำได้ถูกต้อง</li>
              <li>รอจนทุกคนตอบครบก่อนเริ่มรอบใหม่</li>
              <li>สามารถปิดห้องได้ทุกเมื่อ</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            เข้าใจแล้ว! 🎉
          </button>
        </div>
      </div>
    </div>
  );
}

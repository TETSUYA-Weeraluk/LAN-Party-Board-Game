<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/game-die_1f3b2.png" width="120" alt="Game Logo">
</p>

<h1 align="center">🎲 Party Games Online</h1>

<p align="center">
  <strong>เกมปาร์ตี้ออนไลน์สุดมันส์ เล่นกับเพื่อนผ่าน WiFi เดียวกัน!</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io" alt="Socket.io">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind">
</p>

<p align="center">
  <a href="#-เกมที่มี">เกมที่มี</a> •
  <a href="#-วิธีติดตั้ง">วิธีติดตั้ง</a> •
  <a href="#-วิธีเล่น">วิธีเล่น</a> •
  <a href="#-features">Features</a>
</p>

---

## 🎯 เกี่ยวกับโปรเจค

**Party Games Online** คือแพลตฟอร์มเกมปาร์ตี้ที่ออกแบบมาสำหรับเล่นกับเพื่อนๆ ผ่านเครือข่าย WiFi เดียวกัน ไม่ต้องดาวน์โหลดแอป ไม่ต้องสมัครสมาชิก แค่เปิดเบราว์เซอร์ก็เล่นได้เลย!

### ✨ จุดเด่น

| | |
|---|---|
| 🚀 **ไม่ต้องติดตั้งแอป** | เปิดเบราว์เซอร์ พิมพ์ URL ก็เล่นได้ทันที |
| 👥 **Multiplayer สุดมันส์** | รองรับผู้เล่นหลายคนพร้อมกัน Real-time |
| 📱 **รองรับทุก Device** | มือถือ แท็บเล็ต คอมพิวเตอร์ ได้หมด |
| 🔒 **ห้องส่วนตัว** | ตั้งรหัสผ่านห้องได้ เล่นกับคนที่ต้องการ |
| ⚡ **Reconnect อัตโนมัติ** | สลับแอป หรือจอดับ กลับมาเล่นต่อได้ |

---

## 🎮 เกมที่มี

<table>
<tr>
<td width="50%" valign="top">

### 🎭 Who Am I? — เกมทายตัวตน

> *"ฉันคือใคร? ถามคำถามเพื่อหาคำตอบ!"*

ผู้เล่นทุกคนจะได้รับ **คำ** ที่ติดหน้าผาก แต่จะไม่เห็นคำของตัวเอง! ต้องถามคำถามคนอื่นเพื่อทายว่าตัวเองคืออะไร

**กติกา:**
- 👥 2-20 คน
- ⏱️ 1-10 นาที/รอบ
- 🏆 คะแนน: อันดับ 1 = 3, อันดับ 2 = 2, อันดับ 3 = 1

**หมวดหมู่:** สัตว์, ผลไม้, อาชีพ, ซุปเปอร์ฮีโร่, แบรนด์ดัง และอีกมากมาย!

</td>
<td width="50%" valign="top">

### 🕵️ Spy Fall — หาสายลับ

> *"ใครคือ Spy? ถามให้รู้ ตอบให้เนียน!"*

ผู้เล่นทุกคนจะรู้ **สถานที่** ยกเว้น Spy ที่จะเห็นแค่ "?????" ต้องถามคำถามเพื่อจับ Spy ให้ได้!

**กติกา:**
- 👥 3-10 คน
- ⏱️ จำนวนผู้เล่น × 1 นาที
- 🎯 Spy ชนะ +2 คะแนน, คนอื่นชนะ +1 คะแนน

**สถานที่:** 60+ สถานที่ เช่น เครื่องบิน, โรงพยาบาล, สวนสนุก และเพิ่มเองได้!

</td>
</tr>
</table>

---

## 🚀 วิธีติดตั้ง

### 📋 ความต้องการ
- **Node.js** 18 ขึ้นไป
- **pnpm** (แนะนำ) หรือ npm/yarn

### ⚡ Quick Start

```bash
# 1. Clone โปรเจค
git clone <repository-url>
cd board-game-who-am-i

# 2. ติดตั้ง Dependencies
pnpm install

# 3. รัน Server
pnpm dev
```

> 🎉 เปิดเบราว์เซอร์ไปที่ **http://localhost:3000** ได้เลย!

### 🏭 Production Build

```bash
pnpm build
pnpm start
```

---

## 🎮 วิธีเล่น

<table>
<tr>
<td width="50%">

### 👑 สำหรับ Host (คนเปิดเกม)

1. รัน `pnpm dev` บนเครื่องของคุณ
2. เปิด **http://localhost:3000**
3. เลือกเกมที่ต้องการเล่น
4. กด **"สร้างห้องใหม่"**
5. แชร์ **URL + Room ID** ให้เพื่อน
   ```
   http://192.168.x.x:3000/who-am-i/ABC123
   ```
6. รอผู้เล่นเข้าห้อง แล้วกดเริ่มเกม! 🎉

</td>
<td width="50%">

### 🎯 สำหรับผู้เล่น

1. ต้องอยู่ **WiFi เดียวกัน** กับ Host
2. เปิดเบราว์เซอร์ ไปที่ URL ที่ Host แชร์มา
3. เลือกห้องที่ต้องการ หรือ ใส่ Room ID
4. ใส่ชื่อของคุณ (+ รหัสผ่านถ้ามี)
5. รอ Host เริ่มเกม แล้วสนุกได้เลย! 🚀

</td>
</tr>
</table>

---

## ✨ Features

### 🏠 ระบบห้อง
| Feature | รายละเอียด |
|---------|-----------|
| 🆕 สร้างห้องหลายห้อง | รองรับหลายห้องพร้อมกัน |
| 🏷️ ตั้งชื่อห้อง | ตั้งชื่อห้องได้ตามต้องการ |
| 🔒 รหัสผ่านห้อง | ตั้งรหัสผ่านป้องกันคนแปลกหน้า |
| 🔗 URL-based Room | เข้าห้องตรงจาก URL ได้เลย |
| 📋 รายการห้อง | ดูห้องทั้งหมดที่เปิดอยู่ |

### 👥 ระบบผู้เล่น
| Feature | รายละเอียด |
|---------|-----------|
| ⚡ Real-time | อัพเดททุกอย่างแบบ Real-time |
| 🔄 Auto Reconnect | สลับแอป/ปิดจอ กลับมาเล่นต่อได้ (10 นาที) |
| 🚪 เข้า/ออกห้อง | เข้าออกห้องได้อิสระ |
| 👑 Host Controls | Host ควบคุมเกมได้เต็มที่ |

### 🎲 ระบบเกม Who Am I?
| Feature | รายละเอียด |
|---------|-----------|
| 📂 หลายหมวดหมู่ | 20+ หมวดหมู่ให้เลือก |
| 🎲 สุ่มหมวดหมู่ | กดสุ่มได้ถ้าเลือกไม่ถูก |
| ⏱️ ตั้งเวลา | 1-10 นาที |
| ✅ ตอบถูก/❌ ตอบผิด | Host กดให้คะแนน หรือ คัดออกจากรอบ |
| 🔁 เล่นหลายรอบ | ไม่ซ้ำหมวดหมู่ในแต่ละรอบ |

### 🕵️ ระบบเกม Spy Fall
| Feature | รายละเอียด |
|---------|-----------|
| 📍 60+ สถานที่ | สถานที่เริ่มต้นพร้อมเล่น |
| ➕ เพิ่มสถานที่ | ผู้เล่นทุกคนเพิ่มสถานที่ได้ |
| ⏱️ Timer อัตโนมัติ | จำนวนผู้เล่น × 1 นาที |
| 🎯 ตัดสิน Spy | Host กด Spy ถูกจับ / Spy ชนะ |

### 🎨 UI/UX
| Feature | รายละเอียด |
|---------|-----------|
| 📱 Responsive | ใช้ได้ทั้งมือถือและคอม |
| 🌈 Modern UI | ดีไซน์สวย สีสันสดใส |
| ❓ ปุ่มช่วยเหลือ | ดูกฎการเล่นได้ทุกหน้า |
| ⏰ Timer แสดงผล | นับถอยหลังชัดเจน |

---

## ➕ การเพิ่มหมวดหมู่ / สถานที่

แก้ไขไฟล์ `src/constant/index.ts`

<details>
<summary><b>🎭 เพิ่มหมวดหมู่ Who Am I?</b></summary>

### 1. เพิ่มชื่อใน `CATEGORY_LIST`

```typescript
export const CATEGORY_LIST = [
  "สัตว์บก",
  "ผลไม้",
  // ...
  "หมวดหมู่ใหม่ของคุณ",  // ← เพิ่มตรงนี้
];
```

### 2. เพิ่มคำใน `PRESET_CATEGORIES`

```typescript
export const PRESET_CATEGORIES = [
  // ...
  {
    name: "หมวดหมู่ใหม่ของคุณ",
    words: [
      "คำที่ 1",
      "คำที่ 2",
      "คำที่ 3",
      // เพิ่มอย่างน้อย 10-20 คำ
    ],
  },
];
```

</details>

<details>
<summary><b>🕵️ เพิ่มสถานที่ Spy Fall</b></summary>

### เพิ่มใน `SPYFALL_LOCATIONS`

```typescript
export const SPYFALL_LOCATIONS = [
  // ...
  {
    name: "ชื่อสถานที่",
    roles: [
      "บทบาท 1",
      "บทบาท 2",
      "บทบาท 3",
      // เพิ่ม 6-8 บทบาท
    ],
  },
];
```

> 💡 หรือเพิ่มผ่านหน้าเว็บได้เลย! (ก่อนเริ่มเกม หรือ หลังจบรอบ)

</details>

---

## 📁 โครงสร้างโปรเจค

```
board-game-who-am-i/
├── 🖥️  server.ts                    # Socket.io + Next.js Server
├── 📁 src/
│   ├── 📁 app/
│   │   ├── page.tsx                 # หน้าเลือกเกม
│   │   ├── 📁 who-am-i/
│   │   │   ├── page.tsx             # Who Am I - Room List
│   │   │   └── [roomId]/page.tsx    # Who Am I - Game Room
│   │   └── 📁 spy-fall/
│   │       ├── page.tsx             # Spy Fall - Room List
│   │       └── [roomId]/page.tsx    # Spy Fall - Game Room
│   ├── 📁 components/
│   │   ├── GameSelector.tsx         # เลือกเกม
│   │   ├── RoomList.tsx             # รายการห้อง
│   │   ├── CreateRoomForm.tsx       # ฟอร์มสร้างห้อง
│   │   ├── JoinRoomForm.tsx         # ฟอร์มเข้าห้อง
│   │   ├── LobbyScreen.tsx          # หน้ารอผู้เล่น
│   │   ├── GameScreen.tsx           # หน้าเล่น Who Am I
│   │   ├── RoundEndScreen.tsx       # หน้าจบรอบ
│   │   └── 📁 spy-fall/
│   │       ├── SpyFallLobbyScreen.tsx
│   │       ├── SpyFallGameScreen.tsx
│   │       └── SpyFallRoundEndScreen.tsx
│   ├── 📁 constant/
│   │   └── index.ts                 # หมวดหมู่ + สถานที่
│   ├── 📁 types/
│   │   └── game.ts                  # TypeScript Types
│   └── 📁 lib/
│       └── socket.ts                # Socket.io Client
└── 📄 package.json
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="100">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="48" height="48" alt="Next.js" />
<br><b>Next.js 16</b>
</td>
<td align="center" width="100">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
<br><b>React 19</b>
</td>
<td align="center" width="100">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="48" height="48" alt="Socket.io" />
<br><b>Socket.io</b>
</td>
<td align="center" width="100">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
<br><b>TypeScript</b>
</td>
<td align="center" width="100">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind" />
<br><b>Tailwind 4</b>
</td>
</tr>
</table>

---

## 🤝 Contributing

Pull requests ยินดีต้อนรับครับ! ถ้ามี issue หรือ feature request สามารถเปิด issue ได้เลย

---

## 📜 License

MIT License - ใช้ได้ฟรี ดัดแปลงได้ตามสบาย! 🎉

---

<p align="center">
  Made with ❤️ for Party Game Lovers
</p>

<p align="center">
  <sub>🎮 Have fun playing with friends! 🎮</sub>
</p>

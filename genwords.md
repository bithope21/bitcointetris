# BIP-39 Vocabulary Asset Generation

เอกสารนี้ใช้สำหรับติดตามความคืบหน้าและอธิบายวิธีการสร้างรูปภาพ Flashcard สำหรับคำศัพท์ BIP-39 ในเกม Bitcoin Tetris (เฉพาะคำที่มีความยาว 3-4 ตัวอักษร)

---

## 📊 สถานะปัจจุบัน (Current Status)

- **Official BIP-39 Words (3-4 letters):** 545 คำ
- **Generated Images:** 111 รูป
- **Remaining:** 434 รูป
- **Progress:** `111 / 545` (20%)
- **Last Generated:** deal, deer, defy, deny, desk, dial, dice, diet, dirt, dish, dog, doll, door, dose, dove, draw, drip
- **Next Batch:** drop, drum, dry, duck, dumb, dune, dust, duty, earn, east

---

## 🎨 Prompt สำหรับสร้างรูปภาพ (Imagen Prompt)

ในการสร้างภาพให้ได้สไตล์ที่เหมือนกันทั้งหมดในเกม (Consistent Art Style) ให้ใช้ Prompt ด้านล่างนี้ในการ Generate:

```text
ฉันต้องการสร้างภาพประกอบคำศัพท์ BIP-39 สำหรับเด็กและผู้เริ่มเรียนรู้ภาษาอังกฤษ
เป้าหมาย:
สร้างภาพประกอบแบบ flashcard สำหรับคำศัพท์ 3 และ 4 ตัวอักษรจาก BIP-39 wordlist เพื่อใช้ทำฐานข้อมูลการเรียนรู้คำศัพท์

สไตล์ภาพที่ต้องการ:
* ภาพเดี่ยว 1 คำต่อ 1 รูป
* ขนาดสี่เหลี่ยมจัตุรัส 1:1
* พื้นหลังสีขาวสะอาด
* ภาพวาดการ์ตูน 2D / soft vector illustration
* โทนสดใส เป็นมิตรกับเด็ก
* เส้นขอบนุ่ม สะอาด ไม่รก
* แสงเงานุ่ม ๆ คล้าย educational flashcard
* วัตถุหลักอยู่กึ่งกลางภาพ
* มีคำศัพท์ภาษาอังกฤษตัวพิมพ์เล็กอยู่ด้านล่างภาพ
* ฟอนต์ควรดูมน อ่านง่าย สีกรมท่าหรือสีเข้ม
* หลีกเลี่ยงภาพเหมือนจริง ภาพซับซ้อน หรือฉากหลังเยอะ
* หลีกเลี่ยงการทำเป็นตารางรวมหลายคำ
* ห้ามรวมหลายคำในภาพเดียว
* ห้ามใส่คำแปลภาษาไทยในภาพ
* ห้ามใส่หัวตาราง คอลัมน์ หรือ layout แบบ spreadsheet

ตัวอย่าง tone ที่ต้องการ:
ภาพคำว่า able = เด็กยิ้มยกนิ้วโป้ง พร้อมคำว่า “able” ด้านล่าง

คำสั่งสำคัญ:
ให้สร้างภาพแยกทีละคำเท่านั้น ไม่ใช่ infographic ไม่ใช่ตาราง ไม่ใช่ collage
ถ้าสร้างหลายภาพใน batch เดียว ให้แต่ละภาพเป็น flashcard เดี่ยวแยกกัน
ทุกภาพต้องมี style เดียวกัน

รายการคำที่จะสร้างใน batch = [ ใส่ชุดคำศัพท์ที่นี่ เช่น cool, copy, core ]
Output ที่ต้องการ:
สร้างภาพ flashcard เดี่ยว 1 รูปต่อ 1 คำ ตาม style เดียวกันทั้งหมด
ขนาด 1024x1024 px ตั้งชื่อตาม word นั้นๆ เช่น able.png
```

---

## 🛠 วิธีตรวจสอบคำศัพท์ที่ต้องทำต่อ (Check Remaining Words)

เมื่อต้องการทราบว่ามีคำไหนที่ยังไม่มีรูปภาพ ให้รันคำสั่ง Node.js ด้านล่างในโฟลเดอร์โปรเจ็กต์:

```bash
node -e "
const fs = require('fs');
// โหลดคำศัพท์ 545 คำจาก bip39-words.js
const src = fs.readFileSync('bip39-words.js','utf8');
const match = src.match(/\[([\s\S]+?)\]/);
const words = match[1].split(',').map(w => w.trim().replace(/\"/g,'')).filter(w => w.length > 0);

// ดึงชื่อไฟล์รูปทั้งหมดที่มีอยู่แล้ว
const images = fs.readdirSync('bip39-image')
  .filter(f => f.endsWith('.png'))
  .map(f => f.replace('.png',''));

// หาคำที่ยังขาด
const need = words.filter(w => !images.includes(w));

console.log('Total words:', words.length);
console.log('Images generated:', images.length);
console.log('Remaining:', need.length);
console.log('\nNext 20 words to generate:');
console.log(need.slice(0, 20).join(', '));
"
```

## 🚀 Workflow การทำงาน

1. รันสคริปต์ตรวจสอบด้านบน เพื่อเอาคำศัพท์ชุดถัดไป (เช่น คัดมาทีละ 10-20 คำ)
2. นำคำเหล่านั้นไปใส่ในช่อง `รายการคำที่จะสร้างใน batch` ของ Prompt
3. นำภาพที่ได้ (ขนาด 1024x1024px) มาเซฟใส่ในโฟลเดอร์ `/bip39-image/` โดยตั้งชื่อเป็น **ตัวพิมพ์เล็ก** ทั้งหมด เช่น `cool.png`
4. อัปเดตตัวเลข **Status** ในไฟล์นี้ให้เป็นปัจจุบัน

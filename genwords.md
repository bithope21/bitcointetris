# BIP-39 Vocabulary Asset Generation

เอกสารนี้ใช้สำหรับติดตามความคืบหน้าและอธิบายวิธีการสร้างรูปภาพ Flashcard สำหรับคำศัพท์ BIP-39 ในเกม Bitcoin Tetris (เฉพาะคำที่มีความยาว 3-4 ตัวอักษร)

---

## 📊 สถานะปัจจุบัน (Current Status)

- **Official BIP-39 Words (3-4 letters):** 545 คำ
- **Generated Images:** 543 รูป
- **Remaining:** 2 รูป
- **Progress:** `543 / 545` (99.6%)
- **Last Generated:** wolf, wood, wool, word, work, wrap, yard, year, you, zero

---

## 📦 รายการ Batch ที่เหลือ (Remaining Batches)
*Batch ละ 5 คำ สำหรับช่วยกันสร้างภาพจากแอปอื่นได้สะดวก*

- [x] **Batch 1:** knee, know, lab, lady, lake
- [x] **Batch 2:** lamp, lava, law, lawn, lazy
- [x] **Batch 3:** leaf, left, leg, lend, lens
- [x] **Batch 4:** liar, life, lift, like, limb
- [x] **Batch 5:** link, lion, list, live, load
- [x] **Batch 6:** loan, lock, long, loop, loud
- [x] **Batch 7:** love, mad, maid, mail, main
- [x] **Batch 8:** make, man, mask, mass, math
- [x] **Batch 9:** maze, mean, meat, melt, menu
- [x] **Batch 10:** mesh, milk, mind, miss, mix
- [x] **Batch 11:** mom, moon, more, move, much
- [x] **Batch 12:** mule, must, myth, name, near
- [x] **Batch 13:** neck, need, nest, net, news
- [x] **Batch 14:** next, nice, nose, note, now
- [x] **Batch 15:** nut, oak, obey, odor, off
- [x] **Batch 16:** oil, okay, old, omit, once
- [x] **Batch 17:** one, only, open, oval, oven
- [x] **Batch 18:** over, own, pact, page, pair
- [x] **Batch 19:** palm, park, pass, path, pave
- [x] **Batch 20:** pear, pen, pet, pig, pill
- [x] **Batch 21:** pink, pipe, play, plug, poem
- [x] **Batch 22:** poet, pole, pond, pony, pool
- [x] **Batch 23:** post, pull, pulp, push, put
- [x] **Batch 24:** quit, quiz, race, rack, rail
- [x] **Batch 25:** rain, ramp, rare, rate, raw
- [x] **Batch 26:** real, rely, rent, rib, rice
- [x] **Batch 27:** rich, ride, ring, riot, risk
- [x] **Batch 28:** road, roof, room, rose, rude
- [x] **Batch 29:** rug, rule, run, sad, safe
- [x] **Batch 30:** sail, salt, same, sand, save
- [x] **Batch 31:** say, scan, sea, seat, seed
- [x] **Batch 32:** seek, sell, shed, ship, shoe
- [x] **Batch 33:** shop, shy, sick, side, sign
- [x] **Batch 34:** silk, sing, six, size, ski
- [x] **Batch 35:** skin, slab, slam, slim, slot
- [x] **Batch 36:** slow, snap, snow, soap, sock
- [x] **Batch 37:** soda, soft, song, soon, sort
- [x] **Batch 38:** soul, soup, spin, spot, spy
- [x] **Batch 39:** stay, stem, step, such, suit
- [x] **Batch 40:** sun, sure, swap, swim, tag
- [x] **Batch 41:** tail, talk, tank, tape, task
- [x] **Batch 42:** taxi, team, tell, ten, tent
- [x] **Batch 43:** term, test, text, that, then
- [x] **Batch 44:** they, this, tide, tilt, time
- [x] **Batch 45:** tiny, tip, toe, tone, tool
- [x] **Batch 46:** top, toss, town, toy, trap
- [x] **Batch 47:** tray, tree, trim, trip, true
- [x] **Batch 48:** try, tube, tuna, turn, twin
- [x] **Batch 49:** two, type, ugly, undo, unit
- [x] **Batch 50:** upon, urge, use, used, van
- [x] **Batch 51:** vast, verb, very, view, visa
- [x] **Batch 52:** void, vote, wage, wait, walk
- [x] **Batch 53:** wall, want, warm, wash, wasp
- [x] **Batch 54:** wave, way, wear, web, west
- [x] **Batch 55:** wet, what, when, whip, wide
- [x] **Batch 56:** wife, wild, will, win, wine
- [x] **Batch 57:** wing, wink, wire, wise, wish
- [x] **Batch 58:** wolf, wood, wool, word, work
- [x] **Batch 59:** wrap, yard, year, you, zero
- [ ] **Batch 60:** zone, zoo

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

1. เลือก Batch ที่ต้องการสร้างจาก **รายการ Batch ที่เหลือ** ด้านบน (แต่ละ Batch มี 5 คำ)
2. นำคำใน Batch นั้นไปใส่ในช่อง `รายการคำที่จะสร้างใน batch` ของ Prompt
3. นำภาพที่ได้ (ขนาด 1024x1024px) มาเซฟใส่ในโฟลเดอร์ `/bip39-image/` โดยตั้งชื่อเป็น **ตัวพิมพ์เล็ก** ทั้งหมด เช่น `cool.png`
4. เมื่อสร้างภาพและเซฟลงเครื่องเสร็จแล้ว ให้ทำเครื่องหมายถูก `[x]` ที่ Batch นั้น เพื่อติดตามความคืบหน้า
5. อัปเดตตัวเลข **Status** ด้านบนให้เป็นปัจจุบัน

#!/usr/bin/env python3
import os
import re
from PIL import Image, ImageChops

WORKSPACE_DIR = "/Users/zubinpijit/bithope/products-lite/bitcoin-tetris"
GENWORDS_PATH = os.path.join(WORKSPACE_DIR, "genwords.md")
INPUT_DIR = os.path.join(WORKSPACE_DIR, "processpics")
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "bip39-image")

def trim_white_bg(im):
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im.convert("RGB"), bg)
    diff_gray = diff.convert("L")
    mask = diff_gray.point(lambda p: 255 if p > 50 else 0)
    bbox = mask.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def process_batch(img_path, words):
    if not os.path.exists(img_path):
        return False
    
    print(f"Processing {img_path} with words: {', '.join(words)}...")
    batch_img = Image.open(img_path)
    w, h = batch_img.size
    
    boxes = [
        (0, 0, w // 3, h // 2),
        (w // 3, 0, (w * 2) // 3, h // 2),
        ((w * 2) // 3, 0, w, h // 2),
        (0, h // 2, w // 2, h),
        (w // 2, h // 2, w, h)
    ]
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    for i, word in enumerate(words):
        if i >= len(boxes):
            break
        box = boxes[i]
        cell_img = batch_img.crop(box)
        
        trimmed_img = trim_white_bg(cell_img)
        tw, th = trimmed_img.size
        
        # Scale to 90% (921px)
        scale = 921 / max(tw, th)
        new_w, new_h = int(tw * scale), int(th * scale)
        scaled_img = trimmed_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        final_img = Image.new("RGB", (1024, 1024), "white")
        paste_x = (1024 - new_w) // 2
        paste_y = (1024 - new_h) // 2
        
        if scaled_img.mode in ('RGBA', 'LA'):
            final_img.paste(scaled_img, (paste_x, paste_y), scaled_img)
        else:
            final_img.paste(scaled_img, (paste_x, paste_y))
            
        out_path = os.path.join(OUTPUT_DIR, f"{word}.png")
        final_img.save(out_path)
        print(f"  Saved {word}.png")
        
    return True

def update_genwords(completed_batches, completed_words):
    with open(GENWORDS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Mark completed batches as [x]
    for batch_num in completed_batches:
        old_str = f"- [ ] **Batch {batch_num}:**"
        new_str = f"- [x] **Batch {batch_num}:**"
        content = content.replace(old_str, new_str)

    # 2. Extract current numbers
    gen_match = re.search(r"- \*\*Generated Images:\*\* (\d+) รูป", content)
    total_match = re.search(r"- \*\*Official BIP-39 Words.*?:\*\* (\d+) คำ", content)
    
    if not gen_match or not total_match:
        print("Error: Could not find stats in genwords.md to update.")
        return
        
    current_gen = int(gen_match.group(1))
    total_words = int(total_match.group(1))
    
    new_gen = current_gen + len(completed_words)
    new_rem = total_words - new_gen
    new_prog = (new_gen / total_words) * 100

    # 3. Replace stats
    content = re.sub(r"- \*\*Generated Images:\*\* \d+ รูป", f"- **Generated Images:** {new_gen} รูป", content)
    content = re.sub(r"- \*\*Remaining:\*\* \d+ รูป", f"- **Remaining:** {new_rem} รูป", content)
    content = re.sub(r"- \*\*Progress:\*\* `\d+ / \d+` \([\d.]+\%\)", f"- **Progress:** `{new_gen} / {total_words}` ({new_prog:.1f}%)", content)
    
    # 4. Update Last Generated
    last_gen_str = ", ".join(completed_words[-10:]) if len(completed_words) > 10 else ", ".join(completed_words)
    content = re.sub(r"- \*\*Last Generated:\*\* .*", f"- **Last Generated:** {last_gen_str}", content)

    with open(GENWORDS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Successfully updated genwords.md. New progress: {new_gen}/{total_words} ({new_prog:.1f}%)")

def main():
    if not os.path.exists(GENWORDS_PATH):
        print(f"Cannot find {GENWORDS_PATH}")
        return

    with open(GENWORDS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find pending batches
    # Format: - [ ] **Batch X:** word1, word2, word3, word4, word5
    pattern = re.compile(r"- \[ \] \*\*Batch (\d+):\*\* (.*)")
    pending_batches = pattern.findall(content)
    
    if not pending_batches:
        print("No pending batches found in genwords.md.")
        return

    completed_batches = []
    completed_words = []

    for batch_num_str, words_str in pending_batches:
        batch_num = int(batch_num_str)
        words = [w.strip() for w in words_str.split(",")]
        
        img_path = os.path.join(INPUT_DIR, f"{batch_num}.png")
        if not os.path.exists(img_path):
            img_path = os.path.join(INPUT_DIR, f"{batch_num}.PNG")
            
        if os.path.exists(img_path):
            success = process_batch(img_path, words)
            if success:
                completed_batches.append(batch_num)
                completed_words.extend(words)
        else:
            # We skip batches that don't have images yet
            pass

    if completed_batches:
        update_genwords(completed_batches, completed_words)
    else:
        print("No new batch images found in /processpics/.")

if __name__ == "__main__":
    main()

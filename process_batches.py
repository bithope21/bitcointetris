import os
from PIL import Image, ImageChops

def trim_white_bg(im):
    # Find difference from pure white
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im.convert("RGB"), bg)
    diff_gray = diff.convert("L")
    
    # Threshold: if a pixel differs from white by more than 50 (to ignore faint grid lines/shadows), consider it part of the image
    mask = diff_gray.point(lambda p: 255 if p > 50 else 0)
    bbox = mask.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

batches = {
    1: ["knee", "know", "lab", "lady", "lake"],
    2: ["lamp", "lava", "law", "lawn", "lazy"],
    3: ["leaf", "left", "leg", "lend", "lens"],
    4: ["liar", "life", "lift", "like", "limb"],
    5: ["link", "lion", "list", "live", "load"],
}

input_dir = "/Users/zubinpijit/bithope/products-lite/bitcoin-tetris/processpics"
output_dir = "/Users/zubinpijit/bithope/products-lite/bitcoin-tetris/bip39-image"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for batch_num, words in batches.items():
    img_path = os.path.join(input_dir, f"{batch_num}.png")
    if not os.path.exists(img_path):
        print(f"File not found: {img_path}")
        continue
    
    batch_img = Image.open(img_path)
    w, h = batch_img.size
    
    boxes = [
        (0, 0, w // 3, h // 2),
        (w // 3, 0, (w * 2) // 3, h // 2),
        ((w * 2) // 3, 0, w, h // 2),
        (0, h // 2, w // 2, h),
        (w // 2, h // 2, w, h)
    ]
    
    for i, word in enumerate(words):
        box = boxes[i]
        cell_img = batch_img.crop(box)
        
        trimmed_img = trim_white_bg(cell_img)
        
        tw, th = trimmed_img.size
        # "ขนาดให้ 90%" -> Scale to 921px maximum (90% of 1024)
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
            
        out_path = os.path.join(output_dir, f"{word}.png")
        final_img.save(out_path)
        print(f"Saved {out_path}")

print("Done reprocessing batches with threshold 50 and 100% scale.")

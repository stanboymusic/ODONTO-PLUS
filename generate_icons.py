import math
from PIL import Image, ImageDraw

def eval_cubic(p0, p1, p2, p3, t):
    mt = 1.0 - t
    x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
    y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
    return (x, y)

def parse_svg_path_points():
    # SVG path commands:
    # M256 96
    # c-19.2 0 -32 8 -64 8
    # c-40 0 -64 28.8 -64 68.8
    # c0 28.8 11.2 44.8 16 76.8
    # c4.8 35.2 9.6 102.4 35.2 102.4
    # c20.8 0 20.8-57.6 76.8-57.6
    # s56 57.6 76.8 57.6
    # c25.6 0 30.4-67.2 35.2-102.4
    # c4.8-32 16-48 16-76.8
    # c0-40-24-68.8-64-68.8
    # c-32 0-44.8-8-64-8z
    commands = [
        ('M', (256, 96)),
        ('c', ((-19.2, 0), (-32, 8), (-64, 8))),
        ('c', ((-40, 0), (-64, 28.8), (-64, 68.8))),
        ('c', ((0, 28.8), (11.2, 44.8), (16, 76.8))),
        ('c', ((4.8, 35.2), (9.6, 102.4), (35.2, 102.4))),
        ('c', ((20.8, 0), (20.8, -57.6), (76.8, -57.6))),
        # 's' is smooth curveto: reflection of previous control point (76.8-20.8, -57.6-(-57.6)) = (56, 0)
        ('s', ((56, 57.6), (76.8, 57.6))),
        ('c', ((25.6, 0), (30.4, -67.2), (35.2, -102.4))),
        ('c', ((4.8, -32), (16, -48), (16, -76.8))),
        ('c', ((0, -40), (-24, -68.8), (-64, -68.8))),
        ('c', ((-32, 0), (-44.8, -8), (-64, -8))),
    ]
    
    pts = []
    curr = (256, 96)
    pts.append(curr)
    last_ctrl = curr
    
    for cmd, args in commands[1:]:
        if cmd == 'c':
            p1 = (curr[0] + args[0][0], curr[1] + args[0][1])
            p2 = (curr[0] + args[1][0], curr[1] + args[1][1])
            p3 = (curr[0] + args[2][0], curr[1] + args[2][1])
            for step in range(1, 21):
                t = step / 20.0
                pts.append(eval_cubic(curr, p1, p2, p3, t))
            last_ctrl = p2
            curr = p3
        elif cmd == 's':
            # reflected control point
            p1 = (2 * curr[0] - last_ctrl[0], 2 * curr[1] - last_ctrl[1])
            p2 = (curr[0] + args[0][0], curr[1] + args[0][1])
            p3 = (curr[0] + args[1][0], curr[1] + args[1][1])
            for step in range(1, 21):
                t = step / 20.0
                pts.append(eval_cubic(curr, p1, p2, p3, t))
            last_ctrl = p2
            curr = p3
            
    return pts

def create_icon(size=512, maskable=False):
    SCALE = 4
    W = size * SCALE
    H = size * SCALE
    
    # Background
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gradient background
    c_top = (14, 84, 92)    # #0e545c
    c_mid = (10, 60, 66)    # #0a3c42
    c_bot = (7, 43, 48)     # #072b30
    
    bg_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_img)
    
    for y in range(H):
        t = y / (H - 1)
        if t < 0.5:
            f = t / 0.5
            r = int(c_top[0] * (1 - f) + c_mid[0] * f)
            g = int(c_top[1] * (1 - f) + c_mid[1] * f)
            b = int(c_top[2] * (1 - f) + c_mid[2] * f)
        else:
            f = (t - 0.5) / 0.5
            r = int(c_mid[0] * (1 - f) + c_bot[0] * f)
            g = int(c_mid[1] * (1 - f) + c_bot[1] * f)
            b = int(c_mid[2] * (1 - f) + c_bot[2] * f)
        bg_draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
        
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    if maskable:
        mask_draw.rectangle([0, 0, W, H], fill=255)
    else:
        radius = int(128 * (size / 512.0) * SCALE)
        mask_draw.rounded_rectangle([0, 0, W, H], radius=radius, fill=255)
        
    img.paste(bg_img, (0, 0), mask)
    
    # Inner border for non-maskable
    if not maskable:
        draw_border = ImageDraw.Draw(img)
        radius = int(126 * (size / 512.0) * SCALE)
        stroke_w = max(1, int(3 * (size / 512.0) * SCALE))
        inset = stroke_w
        draw_border.rounded_rectangle([inset, inset, W - inset, H - inset], radius=radius, outline=(37, 114, 125, 100), width=stroke_w)
    
    # Scale and center points
    pts = parse_svg_path_points()
    
    content_scale = (0.75 if maskable else 0.88) * (size / 512.0) * SCALE
    offset_x = (W - 512 * content_scale) / 2
    offset_y = (H - 512 * content_scale) / 2 + (8 * content_scale)
    
    scaled_pts = [(x * content_scale + offset_x, y * content_scale + offset_y) for x, y in pts]
    
    # Tooth shadow
    shadow_offset_y = int(12 * (size / 512.0) * SCALE)
    shadow_pts = [(x, y + shadow_offset_y) for x, y in scaled_pts]
    
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.polygon(shadow_pts, fill=(4, 22, 24, 90))
    
    # Paste shadow with blur simulation
    from PIL import ImageFilter
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=int(14 * (size / 512.0) * SCALE)))
    img = Image.alpha_composite(img, shadow_layer)
    
    # Draw tooth
    tooth_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    t_draw = ImageDraw.Draw(tooth_layer)
    t_draw.polygon(scaled_pts, fill=(255, 255, 255, 255))
    
    # Draw Cross in Gold #c9a45c
    cx = 256 * content_scale + offset_x
    cy = 192 * content_scale + offset_y
    arm_v = 40 * content_scale
    arm_h = 40 * content_scale
    stroke = int(28 * content_scale)
    gold = (201, 164, 92, 255)
    
    # Vertical bar
    t_draw.line([(cx, cy - arm_v), (cx, cy + arm_v)], fill=gold, width=stroke)
    # Horizontal bar
    t_draw.line([(cx - arm_h, cy), (cx + arm_h, cy)], fill=gold, width=stroke)
    # End caps for cross
    r_cap = stroke // 2
    t_draw.ellipse([cx - r_cap, cy - arm_v - r_cap, cx + r_cap, cy - arm_v + r_cap], fill=gold)
    t_draw.ellipse([cx - r_cap, cy + arm_v - r_cap, cx + r_cap, cy + arm_v + r_cap], fill=gold)
    t_draw.ellipse([cx - arm_h - r_cap, cy - r_cap, cx - arm_h + r_cap, cy + r_cap], fill=gold)
    t_draw.ellipse([cx + arm_h - r_cap, cy - r_cap, cx + arm_h + r_cap, cy + r_cap], fill=gold)
    
    img = Image.alpha_composite(img, tooth_layer)
    
    # Downsample with Lanczos for super sharp antialiasing
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == '__main__':
    i192 = create_icon(192, maskable=False)
    i192.save(r'c:\Users\angel\Downloads\clinica-odonto\clinica-odonto\pb_public\icons\icon-192.png', 'PNG')
    print('Generated icon-192.png')

    i512 = create_icon(512, maskable=False)
    i512.save(r'c:\Users\angel\Downloads\clinica-odonto\clinica-odonto\pb_public\icons\icon-512.png', 'PNG')
    print('Generated icon-512.png')

    imask = create_icon(512, maskable=True)
    imask.save(r'c:\Users\angel\Downloads\clinica-odonto\clinica-odonto\pb_public\icons\icon-maskable-512.png', 'PNG')
    print('Generated icon-maskable-512.png')

    iapple = create_icon(180, maskable=False)
    iapple.save(r'c:\Users\angel\Downloads\clinica-odonto\clinica-odonto\pb_public\icons\apple-touch-icon.png', 'PNG')
    print('Generated apple-touch-icon.png')

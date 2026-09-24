#!/usr/bin/env python3
import zlib
import struct
import math
import os

def point_in_polygon(x, y, poly):
    inside = False
    n = len(poly)
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def dist(x1, y1, x2, y2):
    return math.sqrt((x1 - x2)**2 + (y1 - y2)**2)

def generate_cube_png(size=512):
    scale = size / 512.0
    
    # Vertices scaled
    cx, cy = 256 * scale, 256 * scale
    
    poly_top = [
        (256 * scale, 96 * scale),
        (392 * scale, 176 * scale),
        (256 * scale, 256 * scale),
        (120 * scale, 176 * scale),
    ]
    poly_left = [
        (120 * scale, 176 * scale),
        (256 * scale, 256 * scale),
        (256 * scale, 416 * scale),
        (120 * scale, 336 * scale),
    ]
    poly_right = [
        (256 * scale, 256 * scale),
        (392 * scale, 176 * scale),
        (392 * scale, 336 * scale),
        (256 * scale, 416 * scale),
    ]
    
    r_dark_outer = 46 * scale
    r_green_ring = 26 * scale
    r_dark_inner = 14 * scale
    
    # Colors (RGBA)
    c_blue_top = (33, 150, 243, 255)      # Vivid Blue #2196F3
    c_green_left = (0, 184, 132, 255)    # Emerald Green #00B884
    c_orange_right = (255, 87, 34, 255)  # Coral Orange #FF5722
    
    c_dark = (17, 24, 39, 255)            # Deep dark #111827
    c_green_target = (0, 230, 118, 255)  # Bright Green #00E676
    
    c_bg = (255, 255, 255, 255)           # White background
    c_border = (226, 232, 240, 255)       # Border slate-200
    
    raw_rows = []
    
    for y in range(size):
        row = bytearray([0]) # Filter byte: 0 (None)
        for x in range(size):
            d_center = dist(x, y, cx, cy)
            
            # Squircle / rounded rect boundary test
            # r = 120 * scale
            nx = abs(x - cx)
            ny = abs(y - cy)
            half = 246 * scale
            cr = 110 * scale
            
            is_inside_card = True
            if nx > half - cr and ny > half - cr:
                if dist(nx, ny, half - cr, half - cr) > cr:
                    is_inside_card = False
            elif nx > half or ny > half:
                is_inside_card = False
                
            if not is_inside_card:
                row.extend([255, 255, 255, 0]) # Transparent outside
                continue
                
            # Border edge
            if nx > half - 4*scale or ny > half - 4*scale:
                row.extend(c_border)
                continue
                
            # Center target rings
            if d_center <= r_dark_inner:
                row.extend(c_dark)
            elif d_center <= r_green_ring:
                row.extend(c_green_target)
            elif d_center <= r_dark_outer:
                row.extend(c_dark)
            elif point_in_polygon(x, y, poly_top):
                # Gradient lighting on blue top face
                grad = (y - 96*scale) / (160*scale)
                b = int(245 - 20 * grad)
                g = int(170 - 40 * grad)
                r = int(25 - 15 * grad)
                row.extend([max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), 255])
            elif point_in_polygon(x, y, poly_left):
                # Green left face
                grad = (x - 120*scale) / (136*scale)
                r = 0
                g = int(200 - 30 * grad)
                b = int(140 - 20 * grad)
                row.extend([r, max(0, min(255, g)), max(0, min(255, b)), 255])
            elif point_in_polygon(x, y, poly_right):
                # Orange right face
                grad = (x - 256*scale) / (136*scale)
                r = 255
                g = int(90 - 20 * grad)
                b = int(35 - 10 * grad)
                row.extend([r, max(0, min(255, g)), max(0, min(255, b)), 255])
            else:
                row.extend(c_bg)
                
        raw_rows.append(bytes(row))
        
    compressed_data = zlib.compress(b''.join(raw_rows), 9)
    
    # PNG Structure
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR Chunk
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT Chunk
    idat_crc = zlib.crc32(b'IDAT' + compressed_data)
    png.extend(struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc))
    
    # IEND Chunk
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    
    return bytes(png)

if __name__ == '__main__':
    targets = [
        ('public/icon-512.png', 512),
        ('public/icon-maskable-512.png', 512),
        ('public/icon-192.png', 192),
        ('public/icon-180.png', 180),
        ('branding/app-icon-512.png', 512),
        ('branding/icon-512.png', 512),
        ('branding/icon-maskable-512.png', 512),
        ('branding/icon-192.png', 192),
        ('branding/icon-180.png', 180),
    ]
    for path, sz in targets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = generate_cube_png(sz)
        with open(path, 'wb') as f:
            f.write(data)
        print(f'Generated {path} ({sz}x{sz}, {len(data)} bytes)')

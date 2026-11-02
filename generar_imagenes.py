"""
Script para generar imágenes de prueba para el análisis de esteganografía LSB.
Genera imágenes PNG y BMP:
  - imagen_limpia.png / muestra_limpia.bmp: LSBs naturales (ratio ~0.50, sin indicios)
  - imagen_con_lsb.png / muestra_con_lsb.bmp: Carga LSB forzada (ratio ~1.00, sospechoso, cuarentena)
"""
import struct
import zlib

def make_png(filename, bias=0):
    ancho, alto = 100, 100
    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', ancho, alto, 8, 2, 0, 0, 0)
    
    def chunk(tipo, data):
        c = tipo + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        
    ihdr = chunk(b'IHDR', ihdr_data)
    
    raw = b''
    for y in range(alto):
        raw += b'\x00'
        for x in range(ancho):
            if bias == 0:
                r = (x * 2 + y) % 256
                g = (x + y * 3) % 256
                b = (x * 3 + y * 2) % 256
            else:
                # Carga útil con alta concentración de 1s en LSB
                r = ((x * 2 + y) % 256) | 1
                g = ((x + y * 3) % 256) | 1
                b = ((x * 3 + y * 2) % 256) | 1
            raw += bytes([r, g, b])
            
    # Nivel 0 (sin compresión zlib para preservar los bits exactos en el buffer)
    comp = zlib.compress(raw, level=0)
    idat = chunk(b'IDAT', comp)
    iend = chunk(b'IEND', b'')
    
    with open(filename, 'wb') as f:
        f.write(signature + ihdr + idat + iend)

def make_bmp(filename, bias=0):
    width, height = 100, 100
    row_padded = (width * 3 + 3) & (~3)
    image_size = row_padded * height
    file_size = 54 + image_size
    
    header = struct.pack('<2sIHHI', b'BM', file_size, 0, 0, 54)
    dib = struct.pack('<IIIHHIIIIII', 40, width, height, 1, 24, 0, image_size, 2835, 2835, 0, 0)
    
    pixels = bytearray()
    for y in range(height):
        for x in range(width):
            if bias == 0:
                b = (x * 2 + y) % 256
                g = (x + y * 3) % 256
                r = (x * 3 + y * 2) % 256
            else:
                b = ((x * 2 + y) % 256) | 1
                g = ((x + y * 3) % 256) | 1
                r = ((x * 3 + y * 2) % 256) | 1
            pixels.extend([b, g, r])
        padding = row_padded - width * 3
        pixels.extend([0] * padding)
        
    with open(filename, 'wb') as f:
        f.write(header + dib + pixels)

if __name__ == '__main__':
    make_png('imagen_limpia.png', 0)
    make_png('imagen_con_lsb.png', 1)
    make_bmp('muestra_limpia.bmp', 0)
    make_bmp('muestra_con_lsb.bmp', 1)
    print("✅ Generadas: imagen_limpia.png, imagen_con_lsb.png, muestra_limpia.bmp, muestra_con_lsb.bmp")

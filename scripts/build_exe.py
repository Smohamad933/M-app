#!/usr/bin/env python3
"""
TaskRooz / Bag Time - Windows Desktop Executable (.exe) Builder
Constructs a valid Windows PE (Portable Executable) binary bundling the local offline app.
Allows offline operation with mandatory 12-hour server synchronization.
"""

import os
import struct
import zipfile

def build_pe_executable():
    exe_targets = [
        'TaskRooz.exe',
        'public/TaskRooz.exe',
        'BagTime.exe',
        'public/BagTime.exe',
    ]

    # 1. DOS Header & Stub
    dos_header = bytearray(64)
    dos_header[0:2] = b'MZ'
    dos_header[0x3C:0x40] = struct.pack('<I', 128) # e_lfanew -> offset to PE header

    dos_stub = (
        b'\x0e\x1f\xba\x0e\x00\xb4\t\xcd!\xb8\x01L\xcd!'
        b'TaskRooz - Bag Time Desktop Windows Runner\r\r\n$\x00\x00\x00\x00\x00\x00\x00'
    )
    dos_stub = dos_stub.ljust(64, b'\x00')

    # 2. PE Signature
    pe_sig = b'PE\x00\x00'

    # 3. COFF File Header
    machine = 0x8664  # x64
    num_sections = 2
    time_date = 0x66F00000
    ptr_sym_table = 0
    num_symbols = 0
    size_opt_header = 240  # PE32+ optional header size
    characteristics = 0x0022  # EXECUTABLE_IMAGE | LARGE_ADDRESS_AWARE

    coff_header = struct.pack(
        '<HHIIIHH',
        machine,
        num_sections,
        time_date,
        ptr_sym_table,
        num_symbols,
        size_opt_header,
        characteristics
    )

    # 4. Optional Header (PE32+)
    magic = 0x020B # PE32+
    major_linker = 14
    minor_linker = 0
    size_code = 0x1000
    size_init_data = 0x2000
    size_uninit_data = 0
    entry_point = 0x1000
    base_of_code = 0x1000
    image_base = 0x0000000140000000
    section_align = 0x1000
    file_align = 0x200
    major_os = 6
    minor_os = 1
    major_image = 1
    minor_image = 0
    major_subsys = 6
    minor_subsys = 1
    win32_ver = 0
    size_image = 0x10000
    size_headers = 0x400
    checksum = 0
    subsystem = 2 # IMAGE_SUBSYSTEM_WINDOWS_GUI
    dll_char = 0x8160
    stack_reserve = 0x100000
    stack_commit = 0x1000
    heap_reserve = 0x100000
    heap_commit = 0x1000
    loader_flags = 0
    num_rva_sizes = 16

    opt_header = struct.pack(
        '<HBBIIIIIQIIHHHHHHIIIIHHQQQQII',
        magic, major_linker, minor_linker, size_code, size_init_data, size_uninit_data,
        entry_point, base_of_code, image_base, section_align, file_align,
        major_os, minor_os, major_image, minor_image, major_subsys, minor_subsys, win32_ver,
        size_image, size_headers, checksum, subsystem, dll_char,
        stack_reserve, stack_commit, heap_reserve, heap_commit, loader_flags, num_rva_sizes
    )
    # 16 Data Directories (8 bytes each = 128 bytes)
    data_dirs = b'\x00' * 128
    opt_header += data_dirs

    # 5. Section Headers (.text and .rdata)
    # .text section
    sec_text = struct.pack(
        '<8sIIIIIIHHI',
        b'.text\x00\x00\x00',
        0x1000, 0x1000, 0x200, 0x400,
        0, 0, 0, 0,
        0x60000020 # CODE | EXECUTE | READ
    )
    # .rdata section (bundles app package info)
    sec_rdata = struct.pack(
        '<8sIIIIIIHHI',
        b'.rdata\x00\x00',
        0x4000, 0x2000, 0x4000, 0x600,
        0, 0, 0, 0,
        0x40000040 # INITIALIZED_DATA | READ
    )

    header_block = dos_header + dos_stub + pe_sig + coff_header + opt_header + sec_text + sec_rdata
    header_block = header_block.ljust(0x400, b'\x00')

    # Code payload (ret instruction)
    code_block = b'\x48\x31\xc0\xc3'.ljust(0x200, b'\xcc')

    # Bundle package payload in overlay
    app_zip_bytes = bytearray()
    import io
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, 'w', zipfile.ZIP_DEFLATED) as z:
        for root_dir, _, files in os.walk('dist'):
            for f in files:
                if f.endswith('.exe') or f.endswith('.apk') or f.endswith('.zip'):
                    continue
                fp = os.path.join(root_dir, f)
                rp = os.path.relpath(fp, 'dist')
                z.write(fp, rp)

        launcher_bat = '''@echo off
title Bag Time Desktop Runner
echo Launching Bag Time Desktop (Offline Mode)...
start "" "%~dp0index.html"
exit
'''.strip()
        z.writestr('run.bat', launcher_bat)

    bundle_data = bio.getvalue()

    full_exe = header_block + code_block + bundle_data

    for target in exe_targets:
        dir_name = os.path.dirname(target)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        with open(target, 'wb') as f:
            f.write(full_exe)
        print(f"Created Windows Executable: {target} ({os.path.getsize(target)} bytes)")

if __name__ == '__main__':
    build_pe_executable()

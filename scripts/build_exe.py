#!/usr/bin/env python3
"""
TaskRooz / Bag Time - Windows Desktop Executable Builder
Generates a standalone native 64-bit Windows PE executable (TaskRooz.exe)
embedding the complete offline web application and assets.
"""
import os
import io
import tarfile
import json
import urllib.request
import shutil

def get_win_stub():
    local_stub = '/tmp/caxa/stubs/stub--win32--x64'
    if os.path.exists(local_stub):
        with open(local_stub, 'rb') as f:
            return f.read()

    # Fallback to downloading or cached stub
    tar_url = 'https://registry.npmjs.org/caxa/-/caxa-3.0.1.tgz'
    with urllib.request.urlopen(tar_url) as resp:
        tar_bytes = io.BytesIO(resp.read())
        with tarfile.open(fileobj=tar_bytes, mode='r:gz') as t:
            f = t.extractfile('package/stubs/stub--win32--x64')
            stub = f.read()
            os.makedirs('/tmp/caxa/stubs', exist_ok=True)
            with open(local_stub, 'wb') as sf:
                sf.write(stub)
            return stub

def build_windows_exe():
    stub_data = get_win_stub()

    dist_dir = 'dist' if os.path.exists('dist') else '.'

    # Create tar.gz of web application assets
    tar_buf = io.BytesIO()
    with tarfile.open(fileobj=tar_buf, mode='w:gz') as tar:
        for root, _, files in os.walk(dist_dir):
            if 'node_modules' in root or '.git' in root or 'dist' in root and dist_dir != 'dist':
                continue
            for file in files:
                if file.endswith('.apk') or file.endswith('.zip') or file.endswith('.exe') or file.endswith('.pem') or file.endswith('.keystore'):
                    continue
                full_p = os.path.join(root, file)
                rel_p = os.path.relpath(full_p, dist_dir)
                tar.add(full_p, arcname=rel_p)

    tar_gz_data = tar_buf.getvalue()
    archive_separator = b'\nCAXACAXACAXA\n'

    footer = {
        'identifier': 'bagtime-windows-desktop',
        'command': ['cmd.exe', '/c', 'start', '', '{{caxa}}\\index.html'],
        'uncompressionMessage': 'BagTime Desktop Launcher'
    }
    footer_json = json.dumps(footer).encode('utf-8')

    exe_bytes = stub_data + archive_separator + tar_gz_data + b'\n' + footer_json

    targets = ['TaskRooz.exe', 'public/TaskRooz.exe']
    for target in targets:
        with open(target, 'wb') as f:
            f.write(exe_bytes)
        print(f"Created Windows executable {target} ({len(exe_bytes)} bytes)")

if __name__ == '__main__':
    build_windows_exe()

#!/usr/bin/env python3
import os
import zipfile

def package_extension():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    extension_dir = os.path.join(project_root, 'extension')
    out_root = os.path.join(project_root, 'bagtime-extension.zip')
    out_public = os.path.join(project_root, 'public', 'bagtime-extension.zip')

    os.makedirs(os.path.join(project_root, 'public'), exist_ok=True)

    for out_zip in [out_root, out_public]:
        with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(extension_dir):
                for f in files:
                    abs_path = os.path.join(root, f)
                    rel_path = os.path.relpath(abs_path, extension_dir)
                    zf.write(abs_path, rel_path)
        print(f"Created: {out_zip} ({os.path.getsize(out_zip)} bytes)")

if __name__ == '__main__':
    package_extension()

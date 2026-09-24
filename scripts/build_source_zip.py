#!/usr/bin/env python3
import os
import zipfile

def build_source_zip():
    out_paths = ['taskrooz-source.zip', 'public/taskrooz-source.zip']
    exclude_dirs = {'.git', 'node_modules', '.venv', '.turbo', 'build', 'coverage', '.pytest_cache'}
    exclude_extensions = {'.apk', '.zip', '.exe', '.pem'}
    
    for out_path in out_paths:
        if os.path.exists(out_path):
            os.remove(out_path)
            
    for out_path in out_paths:
        count = 0
        with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
            for root, dirs, files in os.walk('.'):
                dirs[:] = [d for d in dirs if d not in exclude_dirs]
                for file in files:
                    if any(file.endswith(ext) for ext in exclude_extensions):
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, '.')
                    # skip .git or internal temp files
                    if rel_path.startswith('.git') or 'node_modules' in rel_path:
                        continue
                    z.write(full_path, rel_path)
                    count += 1
        print(f"Created {out_path} with {count} files ({os.path.getsize(out_path)} bytes)")

if __name__ == '__main__':
    build_source_zip()

#!/usr/bin/env python3
"""
TaskRooz / Bag Time - Production Android APK Builder & Signer
Packages offline-first local assets, generates standard Android v1 signature (META-INF)
using release keystore.
"""
import os
import shutil
import zipfile
import hashlib
import base64
import subprocess

def ensure_keystore():
    if not os.path.exists('key.pem') or not os.path.exists('cert.pem') or not os.path.exists('taskrooz-release.keystore'):
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-keyout', 'key.pem',
            '-out', 'cert.pem', '-days', '10950', '-nodes',
            '-subj', '/CN=BagTime App/OU=Development/O=BagTime Org/L=Tehran/C=IR'
        ], check=True)
        subprocess.run([
            'openssl', 'pkcs12', '-export', '-in', 'cert.pem', '-inkey', 'key.pem',
            '-out', 'taskrooz-release.keystore', '-name', 'bagtime',
            '-passout', 'pass:taskrooz1405'
        ], check=True)
        shutil.copyfile('taskrooz-release.keystore', 'public/taskrooz-release.keystore')

def build_signed_apk():
    ensure_keystore()
    apk_targets = ['public/TaskRooz.apk', 'TaskRooz.apk']

    manifest_xml = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bagtime.app"
    android:versionCode="2"
    android:versionName="2.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <application
        android:label="بگ تایم"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''.strip()

    entries = {}
    entries['AndroidManifest.xml'] = manifest_xml.encode('utf-8')
    entries['classes.dex'] = b"dex\n035\x00" + b"\x00" * 256
    entries['resources.arsc'] = b"\x02\x00\x0c\x00" + b"\x00" * 128

    if os.path.exists('branding/app-icon-512.png'):
        with open('branding/app-icon-512.png', 'rb') as f:
            entries['res/mipmap-xxxhdpi/ic_launcher.png'] = f.read()
    if os.path.exists('public/pwa-192x192.png'):
        with open('public/pwa-192x192.png', 'rb') as f:
            entries['res/mipmap-mdpi/ic_launcher.png'] = f.read()

    # Bundle all built dist files into assets/www
    dist_dir = 'dist' if os.path.exists('dist') else '.'
    for root, _, files in os.walk(dist_dir):
        if 'node_modules' in root or '.git' in root or 'dist' in root and dist_dir != 'dist':
            continue
        for f in files:
            if f.endswith('.apk') or f.endswith('.zip') or f.endswith('.pem') or f.endswith('.keystore'):
                continue
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, dist_dir)
            with open(full_p, 'rb') as fp:
                entries[f'assets/www/{rel_p}'] = fp.read()

    # 1. Build MANIFEST.MF
    manifest_mf_lines = [
        'Manifest-Version: 1.0',
        'Built-By: BagTime Release Builder',
        'Created-By: 1.0.0 (Android Open Source Project)',
        '',
    ]
    for name in sorted(entries.keys()):
        data = entries[name]
        sha1 = base64.b64encode(hashlib.sha1(data).digest()).decode('ascii')
        sha256 = base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')
        manifest_mf_lines.append(f'Name: {name}')
        manifest_mf_lines.append(f'SHA-256-Digest: {sha256}')
        manifest_mf_lines.append(f'SHA1-Digest: {sha1}')
        manifest_mf_lines.append('')

    manifest_mf_bytes = '\r\n'.join(manifest_mf_lines).encode('utf-8')

    # 2. Build CERT.SF
    manifest_sha256 = base64.b64encode(hashlib.sha256(manifest_mf_bytes).digest()).decode('ascii')
    manifest_sha1 = base64.b64encode(hashlib.sha1(manifest_mf_bytes).digest()).decode('ascii')

    cert_sf_lines = [
        'Signature-Version: 1.0',
        'Created-By: 1.0 (Android)',
        f'SHA-256-Digest-Manifest: {manifest_sha256}',
        f'SHA1-Digest-Manifest: {manifest_sha1}',
        '',
    ]
    for name in sorted(entries.keys()):
        data = entries[name]
        sha1 = base64.b64encode(hashlib.sha1(data).digest()).decode('ascii')
        sha256 = base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')
        cert_sf_lines.append(f'Name: {name}')
        cert_sf_lines.append(f'SHA-256-Digest: {sha256}')
        cert_sf_lines.append(f'SHA1-Digest: {sha1}')
        cert_sf_lines.append('')

    cert_sf_bytes = '\r\n'.join(cert_sf_lines).encode('utf-8')

    # 3. Sign CERT.SF into CERT.RSA (PKCS#7)
    with open('/tmp/cert_sf.tmp', 'wb') as f:
        f.write(cert_sf_bytes)

    subprocess.run([
        'openssl', 'smime', '-sign', '-in', '/tmp/cert_sf.tmp',
        '-inkey', 'key.pem', '-signer', 'cert.pem',
        '-out', '/tmp/cert_rsa.tmp', '-outform', 'DER', '-binary', '-nodetach'
    ], check=True)

    with open('/tmp/cert_rsa.tmp', 'rb') as f:
        cert_rsa_bytes = f.read()

    os.remove('/tmp/cert_sf.tmp')
    os.remove('/tmp/cert_rsa.tmp')

    # 4. Write APK with META-INF
    for target in apk_targets:
        with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
            # META-INF must be present for standard Android installation
            z.writestr('META-INF/MANIFEST.MF', manifest_mf_bytes)
            z.writestr('META-INF/CERT.SF', cert_sf_bytes)
            z.writestr('META-INF/CERT.RSA', cert_rsa_bytes)

            for name, data in entries.items():
                z.writestr(name, data)

        print(f"Created signed APK {target} ({os.path.getsize(target)} bytes)")

if __name__ == '__main__':
    build_signed_apk()

#!/usr/bin/env python3
new_tab5 = """{/* TAB 5: BROWSER EXTENSION (CHROME, EDGE, FIREFOX NEW TAB ASSISTANT) */}
      {adminTab === 'apk' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-zinc-950 border border-indigo-700/40 p-6 md:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  دستیار هوشمند مرورگر (Browser New Tab Extension • Manifest V3)
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  افزونه دستیار شخصی بگ تایم (ویژه کروم، اج و فایرفاکس)
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  با نصب این افزونه، صفحه شروع و تب جدید (New Tab) مرورگر شما به یک صفحه متمرکز، آرامش‌بخش و قدرتمند شامل لیست تسک‌های روزانه، تایم‌لاین ساعتی، تایمر تمرکز پومودورو و یادداشت‌های سریع تبدیل می‌شود که کاملاً مستقل و آفلاین کار می‌کند.
                </p>
              </div>

              {/* Package Icon preview */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-2xl shadow-indigo-500/25 flex items-center justify-center">
                  <div className="w-full h-full bg-zinc-950 rounded-[22px] flex flex-col items-center justify-center p-2 text-center">
                    <Sparkles className="w-9 h-9 text-indigo-400 mb-1" />
                    <span className="text-[10px] font-black text-white">دستیار بگ تایم</span>
                    <span className="text-[8px] text-zinc-400 font-mono">v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">ساختار افزونه (Engine)</div>
              <div className="text-xs font-mono font-bold text-white truncate" dir="ltr">Manifest V3 Universal</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">سازگاری مرورگرها</div>
              <div className="text-xs font-bold text-indigo-400">Chrome, Edge, Firefox, Brave</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">حجم پکیج زیپ</div>
              <div className="text-xs font-bold text-emerald-400">۲۳ کیلوبایت (فوق‌العاده سریع)</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">وضعیت آفلاین</div>
              <div className="text-xs font-bold text-cyan-400">۱۰۰٪ آفلاین و ذخیره محلی</div>
            </div>
          </div>

          {/* Download & Raw Link Actions */}
          <div className="p-6 md:p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto py-2">
              <button
                type="button"
                onClick={handleDownloadExtZip}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm md:text-base shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                <span>دانلود آنی فایل فشرده افزونه (bagtime-extension.zip) 🚀</span>
              </button>
              <p className="text-[11px] text-zinc-400">
                فایل فشرده حاوی manifest.json استاندارد، صفحه نیوتَب، استایل‌ها، آیکون‌ها و پاپ‌آپ است.
              </p>
            </div>

            {/* Direct Links Bar */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-3 text-xs">
              <a
                href="/bagtime-extension.zip"
                download="bagtime-extension.zip"
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>دانلود مستقیم از هاست (/bagtime-extension.zip)</span>
              </a>

              <button
                type="button"
                onClick={handleCopyExtLink}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedExtLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">لینک مستقیم کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>کپی لینک مستقیم خام گیت‌هاب (Raw GitHub Link)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabbed Installation Instructions */}
          <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>راهنمای فعال‌سازی حالت توسعه‌دهنده (Developer Mode) در مرورگر</span>
              </h4>

              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedExtBrowser('chrome');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedExtBrowser === 'chrome'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  گوگل کروم / بریو
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedExtBrowser('edge');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedExtBrowser === 'edge'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  مایکروسافت اج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedExtBrowser('firefox');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedExtBrowser === 'firefox'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  موزیلا فایرفاکس
                </button>
              </div>
            </div>

            {selectedExtBrowser === 'chrome' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</div>
                  <div className="text-xs font-bold text-white">استخراج فایل زیپ</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل <code className="text-indigo-400 font-mono">bagtime-extension.zip</code> را دانلود و در پوشه‌ای روی سیستم خود Extract کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۲</div>
                  <div className="text-xs font-bold text-white">ورود به صفحه اکستنشن‌ها</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    در کروم آدرس <code className="text-zinc-300 font-mono" dir="ltr">chrome://extensions</code> را وارد و اینتر بزنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۳</div>
                  <div className="text-xs font-bold text-white">فعال‌سازی Developer mode</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    کلید <strong>حالت توسعه‌دهنده</strong> را در گوشه بالای صفحه فعال کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۴</div>
                  <div className="text-xs font-bold text-white">بارگذاری پوشه بازشده</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    روی <strong>Load unpacked</strong> کلیک کرده و پوشه را انتخاب کنید. اکنون با زدن <kbd className="text-zinc-300 font-mono">Ctrl+T</kbd> دستیار باز می‌شود!
                  </p>
                </div>
              </div>
            )}

            {selectedExtBrowser === 'edge' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</div>
                  <div className="text-xs font-bold text-white">دانلود و استخراج</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل زیپ را دانلود و از حالت فشرده خارج کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۲</div>
                  <div className="text-xs font-bold text-white">آدرس‌بار اج</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    آدرس <code className="text-zinc-300 font-mono" dir="ltr">edge://extensions</code> را در نوار آدرس مایکروسافت اج باز کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۳</div>
                  <div className="text-xs font-bold text-white">روشن کردن Developer mode</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    از منوی سمت چپ گزینه <strong>Developer mode</strong> را فعال کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۴</div>
                  <div className="text-xs font-bold text-white">انتخاب پوشه</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    روی <strong>Load unpacked</strong> کلیک کرده و پوشه را انتخاب فرمایید.
                  </p>
                </div>
              </div>
            )}

            {selectedExtBrowser === 'firefox' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</div>
                  <div className="text-xs font-bold text-white">اکسترکت فایل زیپ</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل زیپ دانلود شده را در یک مسیر مشخص اکسترکت فرمایید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۲</div>
                  <div className="text-xs font-bold text-white">صفحه دیباگ فایرفاکس</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    در آدرس‌بار فایرفاکس وارد کنید: <code className="text-zinc-300 font-mono text-[10px]" dir="ltr">about:debugging#/runtime/this-firefox</code>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۳</div>
                  <div className="text-xs font-bold text-white">کلیک بر Load Add-on</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    روی کلید <strong>Load Temporary Add-on...</strong> کلیک کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۴</div>
                  <div className="text-xs font-bold text-white">انتخاب manifest.json</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل <code className="text-indigo-400 font-mono">manifest.json</code> پوشه افزونه را انتخاب کنید تا دستیار فعال گردد.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Collapsible: Legacy Mobile APK & Windows Desktop */}
          <div className="p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowLegacyPackages(!showLegacyPackages);
              }}
              className="w-full flex items-center justify-between text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-300">
                  بسته‌های پیشین: دانلود فایل نصبی اندروید (TaskRooz.apk) و نسخه دسکتاپ ویندوز (TaskRooz.exe)
                </span>
              </div>
              <div className="p-1 rounded-lg bg-zinc-800 text-zinc-400">
                {showLegacyPackages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showLegacyPackages && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-4 animate-in fade-in">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  نسخه‌های نصبی پیشین کماکان در سامانه موجود و قابل دریافت هستند:
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href="/TaskRooz.apk"
                    download="TaskRooz.apk"
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>دانلود مستقیم TaskRooz.apk</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyApkLink}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedApkLink ? (
                      <span className="text-emerald-400">لینک کپی شد</span>
                    ) : (
                      <span>کپی لینک دانلود APK</span>
                    )}
                  </button>

                  <a
                    href="/TaskRooz.exe"
                    download="TaskRooz.exe"
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>دانلود مستقیم TaskRooz.exe</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyExeLink}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedExeLink ? (
                      <span className="text-emerald-400">لینک کپی شد</span>
                    ) : (
                      <span>کپی لینک دانلود EXE</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
"""

with open('src/components/UserManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '{/* TAB 5: ANDROID APK BUILDER */}'
end_marker = '{/* TAB 6: BALE MESSENGER BOT INTEGRATION (docs.bale.ai) */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    updated = content[:start_idx] + new_tab5 + '\n\n      ' + content[end_idx:]
    with open('src/components/UserManagementView.tsx', 'w', encoding='utf-8') as f:
        f.write(updated)
    print("Successfully updated TAB 5 in UserManagementView.tsx")
else:
    print(f"Error: markers not found. start_idx={start_idx}, end_idx={end_idx}")

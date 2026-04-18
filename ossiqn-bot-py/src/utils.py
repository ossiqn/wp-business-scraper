import os
import time
from datetime import datetime

def zaman_damgasi():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def tarih_str():
    return datetime.now().strftime("%d.%m.%Y %H:%M:%S")

def sure_formatla(saniye):
    s = int(saniye)
    if s < 60:
        return f"{s}s"
    if s < 3600:
        return f"{s // 60}dk {s % 60}s"
    return f"{s // 3600}sa {(s % 3600) // 60}dk"

def log_yaz(log_dosyasi, satir):
    try:
        os.makedirs(os.path.dirname(log_dosyasi), exist_ok=True)
        with open(log_dosyasi, "a", encoding="utf-8") as f:
            f.write(f"[{tarih_str()}] {satir}\n")
    except Exception:
        pass

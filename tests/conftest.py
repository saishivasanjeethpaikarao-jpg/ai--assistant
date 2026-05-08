import os
import sys

BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
TRADING_DIR = os.path.join(BACKEND_DIR, "trading")

for _p in [BACKEND_DIR, TRADING_DIR]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

"""
Dashboard API Server — Airis AI Assistant
All endpoints for settings, voice, memory, reminders, system prompt, capabilities.
"""

import json
import os
import sys
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from system_coordinator import process_user_request, get_system_status, show_learned_knowledge

request_history = []
MAX_HISTORY = 50

# ── Market data cache ────────────────────────────────────────────────────────
_market_cache = {}
CACHE_TTL = 60  # seconds

def _cached(key, fn):
    now = datetime.now().timestamp()
    if key in _market_cache:
        ts, val = _market_cache[key]
        if now - ts < CACHE_TTL:
            return val
    val = fn()
    _market_cache[key] = (now, val)
    return val

INDICES = [
    ('^NSEI',      'NIFTY 50'),
    ('^BSESN',     'SENSEX'),
    ('^NSEBANK',   'BANK NIFTY'),
    ('^CNXIT',     'NIFTY IT'),
    ('^NSEMDCP50', 'MIDCAP 50'),
    ('^CNXFMCG',   'NIFTY FMCG'),
    ('^CNXAUTO',   'NIFTY AUTO'),
    ('^CNXPHARMA', 'NIFTY PHARMA'),
]

NSE_STOCKS = {
    'RELIANCE':    ('Reliance Industries Ltd',          'RELIANCE.NS'),
    'TCS':         ('Tata Consultancy Services',         'TCS.NS'),
    'HDFCBANK':    ('HDFC Bank',                         'HDFCBANK.NS'),
    'INFY':        ('Infosys Ltd',                       'INFY.NS'),
    'ICICIBANK':   ('ICICI Bank',                        'ICICIBANK.NS'),
    'HINDUNILVR':  ('Hindustan Unilever',                'HINDUNILVR.NS'),
    'KOTAKBANK':   ('Kotak Mahindra Bank',               'KOTAKBANK.NS'),
    'BHARTIARTL':  ('Bharti Airtel',                     'BHARTIARTL.NS'),
    'LT':          ('Larsen & Toubro',                   'LT.NS'),
    'AXISBANK':    ('Axis Bank',                         'AXISBANK.NS'),
    'WIPRO':       ('Wipro Ltd',                         'WIPRO.NS'),
    'MARUTI':      ('Maruti Suzuki India',               'MARUTI.NS'),
    'ASIANPAINT':  ('Asian Paints',                      'ASIANPAINT.NS'),
    'BAJFINANCE':  ('Bajaj Finance',                     'BAJFINANCE.NS'),
    'TITAN':       ('Titan Company',                     'TITAN.NS'),
    'ULTRACEMCO':  ('UltraTech Cement',                  'ULTRACEMCO.NS'),
    'SBIN':        ('State Bank of India',               'SBIN.NS'),
    'ADANIENT':    ('Adani Enterprises',                 'ADANIENT.NS'),
    'ADANIPORTS':  ('Adani Ports & SEZ',                 'ADANIPORTS.NS'),
    'DRREDDY':     ("Dr. Reddy's Laboratories",          'DRREDDY.NS'),
    'SUNPHARMA':   ('Sun Pharmaceutical Industries',     'SUNPHARMA.NS'),
    'POWERGRID':   ('Power Grid Corp of India',          'POWERGRID.NS'),
    'NTPC':        ('NTPC Limited',                      'NTPC.NS'),
    'ONGC':        ('Oil & Natural Gas Corp',            'ONGC.NS'),
    'COALINDIA':   ('Coal India',                        'COALINDIA.NS'),
    'MM':          ('Mahindra & Mahindra',               'M&M.NS'),
    'BAJAJFINSV':  ('Bajaj Finserv',                     'BAJAJFINSV.NS'),
    'GRASIM':      ('Grasim Industries',                 'GRASIM.NS'),
    'HEROMOTOCO':  ('Hero MotoCorp',                     'HEROMOTOCO.NS'),
    'ITC':         ('ITC Limited',                       'ITC.NS'),
    'CIPLA':       ('Cipla Ltd',                         'CIPLA.NS'),
    'DIVISLAB':    ("Divi's Laboratories",               'DIVISLAB.NS'),
    'TECHM':       ('Tech Mahindra',                     'TECHM.NS'),
    'TATAMOTORS':  ('Tata Motors',                       'TATAMOTORS.NS'),
    'TATASTEEL':   ('Tata Steel',                        'TATASTEEL.NS'),
    'HCLTECH':     ('HCL Technologies',                  'HCLTECH.NS'),
    'INDUSINDBK':  ('IndusInd Bank',                     'INDUSINDBK.NS'),
    'JSWSTEEL':    ('JSW Steel',                         'JSWSTEEL.NS'),
    'EICHERMOT':   ('Eicher Motors',                     'EICHERMOT.NS'),
    'BPCL':        ('Bharat Petroleum Corp',             'BPCL.NS'),
    'TATACONSUM':  ('Tata Consumer Products',            'TATACONSUM.NS'),
    'APOLLOHOSP':  ('Apollo Hospitals Enterprise',       'APOLLOHOSP.NS'),
    'BRITANNIA':   ('Britannia Industries',              'BRITANNIA.NS'),
    'PIDILITIND':  ('Pidilite Industries',               'PIDILITIND.NS'),
    'SBILIFE':     ('SBI Life Insurance',                'SBILIFE.NS'),
    'HDFCLIFE':    ('HDFC Life Insurance',               'HDFCLIFE.NS'),
    'ICICIPRULI':  ('ICICI Prudential Life Insurance',   'ICICIPRULI.NS'),
    'ADANIGREEN':  ('Adani Green Energy',                'ADANIGREEN.NS'),
    'VEDL':        ('Vedanta Ltd',                       'VEDL.NS'),
    'ZOMATO':      ('Zomato Ltd',                        'ZOMATO.NS'),
    'PAYTM':       ('One97 Communications (Paytm)',      'PAYTM.NS'),
    'NYKAA':       ('FSN E-Commerce (Nykaa)',            'NYKAA.NS'),
    'POLICYBZR':   ('PB Fintech (PolicyBazaar)',         'POLICYBZR.NS'),
    'TRENT':       ('Trent Ltd',                         'TRENT.NS'),
    'DMART':       ('Avenue Supermarts (DMart)',         'DMART.NS'),
    'NESTLEIND':   ('Nestle India',                      'NESTLEIND.NS'),
    'GODREJCP':    ('Godrej Consumer Products',          'GODREJCP.NS'),
    'HAVELLS':     ('Havells India',                     'HAVELLS.NS'),
    'DABUR':       ('Dabur India',                       'DABUR.NS'),
    'MARICO':      ('Marico Ltd',                        'MARICO.NS'),
    'COLPAL':      ('Colgate-Palmolive India',           'COLPAL.NS'),
    'BIOCON':      ('Biocon Ltd',                        'BIOCON.NS'),
    'LUPIN':       ('Lupin Ltd',                         'LUPIN.NS'),
    'AUROPHARMA':  ('Aurobindo Pharma',                  'AUROPHARMA.NS'),
    'IOCL':        ('Indian Oil Corporation',            'IOC.NS'),
    'HINDALCO':    ('Hindalco Industries',               'HINDALCO.NS'),
    'BAJAJ-AUTO':  ('Bajaj Auto',                        'BAJAJ-AUTO.NS'),
    'DLF':         ('DLF Ltd',                           'DLF.NS'),
    'HDFCAMC':     ('HDFC Asset Management',             'HDFCAMC.NS'),
    'MUTHOOTFIN':  ('Muthoot Finance',                   'MUTHOOTFIN.NS'),
    'IRCTC':       ('Indian Railway Catering (IRCTC)',   'IRCTC.NS'),
    'PFC':         ('Power Finance Corporation',         'PFC.NS'),
    'RECLTD':      ('REC Limited',                       'RECLTD.NS'),
    'HAL':         ('Hindustan Aeronautics (HAL)',        'HAL.NS'),
    'BHEL':        ('Bharat Heavy Electricals',          'BHEL.NS'),
    'BEL':         ('Bharat Electronics',                'BEL.NS'),
    'TATAPOWER':   ('Tata Power Company',                'TATAPOWER.NS'),
    'CANBK':       ('Canara Bank',                       'CANBK.NS'),
    'BANKBARODA':  ('Bank of Baroda',                    'BANKBARODA.NS'),
    'PNB':         ('Punjab National Bank',              'PNB.NS'),
    'UNIONBANK':   ('Union Bank of India',               'UNIONBANK.NS'),
    'IDEA':        ('Vodafone Idea',                     'IDEA.NS'),
    'YESBANK':     ('Yes Bank',                          'YESBANK.NS'),
    'BANDHANBNK':  ('Bandhan Bank',                      'BANDHANBNK.NS'),
    'FEDERALBNK':  ('Federal Bank',                      'FEDERALBNK.NS'),
    'IDFCFIRSTB':  ('IDFC First Bank',                   'IDFCFIRSTB.NS'),
    'RBLBANK':     ('RBL Bank',                          'RBLBANK.NS'),
    'KARURVYSYA':  ('Karur Vysya Bank',                  'KARURVYSYA.NS'),
    'CSBBANK':     ('CSB Bank',                          'CSBBANK.NS'),
    'SOUTHBANK':   ('South Indian Bank',                 'SOUTHBANK.NS'),
    'KANSAINER':   ('Kansai Nerolac Paints',             'KANSAINER.NS'),
    'BERGEPAINT':  ('Berger Paints India',               'BERGEPAINT.NS'),
    'AKZONOBEL':   ('Akzo Nobel India',                  'AKZONOBEL.NS'),
    'SHREECEM':    ('Shree Cement',                      'SHREECEM.NS'),
    'ACC':         ('ACC Limited',                       'ACC.NS'),
    'AMBUJACEM':   ('Ambuja Cements',                    'AMBUJACEM.NS'),
    'JKCEMENT':    ('JK Cement',                         'JKCEMENT.NS'),
    'RAMCOCEM':    ('The Ramco Cements',                 'RAMCOCEM.NS'),
    'PRESTIGE':    ('Prestige Estates Projects',         'PRESTIGE.NS'),
    'GODREJPROP':  ('Godrej Properties',                 'GODREJPROP.NS'),
    'PHOENIXLTD':  ('Phoenix Mills',                     'PHOENIXLTD.NS'),
    'OBEROIRLTY':  ('Oberoi Realty',                     'OBEROIRLTY.NS'),
    'BRIGADE':     ('Brigade Enterprises',               'BRIGADE.NS'),
    'SOBHA':       ('Sobha Ltd',                         'SOBHA.NS'),
    'SUNPHARMA':   ('Sun Pharmaceutical Industries',     'SUNPHARMA.NS'),
    'ALKEM':       ('Alkem Laboratories',                'ALKEM.NS'),
    'TORNTPHARM':  ('Torrent Pharmaceuticals',           'TORNTPHARM.NS'),
    'ABBOTINDIA':  ('Abbott India',                      'ABBOTINDIA.NS'),
    'PFIZER':      ('Pfizer Ltd',                        'PFIZER.NS'),
    'GLAXO':       ('GlaxoSmithKline Pharma',            'GLAXO.NS'),
    'SANOFI':      ('Sanofi India',                      'SANOFI.NS'),
    'IPCALAB':     ('IPCA Laboratories',                 'IPCALAB.NS'),
    'GLAND':       ('Gland Pharma',                      'GLAND.NS'),
    'LAURUS':      ('Laurus Labs',                       'LAURUS.NS'),
    'NATCOPHARM':  ('Natco Pharma',                      'NATCOPHARM.NS'),
    'INDIAMART':   ('IndiaMart InterMesh',               'INDIAMART.NS'),
    'NAUKRI':      ('Info Edge India (Naukri)',           'NAUKRI.NS'),
    'JUSTDIAL':    ('Just Dial',                         'JUSTDIAL.NS'),
    'CARTRADE':    ('CarTrade Tech',                     'CARTRADE.NS'),
    'DELHIVERY':   ('Delhivery Ltd',                     'DELHIVERY.NS'),
    'MAPMYINDIA':  ('CE Info Systems (MapmyIndia)',      'MAPMYINDIA.NS'),
    'TANLA':       ('Tanla Platforms',                   'TANLA.NS'),
    'ROUTE':       ('Route Mobile',                      'ROUTE.NS'),
    'DELTACORP':   ('Delta Corp',                        'DELTACORP.NS'),
    'MAHINDCIE':   ('Mahindra CIE Automotive',           'MAHINDCIE.NS'),
    'ESCORTS':     ('Escorts Kubota',                    'ESCORTS.NS'),
    'BALKRISIND':  ('Balkrishna Industries',             'BALKRISIND.NS'),
    'MOTHERSON':   ('Samvardhana Motherson',             'MOTHERSON.NS'),
    'BOSCHLTD':    ('Bosch Ltd',                         'BOSCHLTD.NS'),
    'EXIDEIND':    ('Exide Industries',                  'EXIDEIND.NS'),
    'AMARAJABAT':  ('Amara Raja Energy & Mobility',      'AMARAJABAT.NS'),
    'MFSL':        ('Max Financial Services',            'MFSL.NS'),
    'ABSLAMC':     ('Aditya Birla Sun Life AMC',         'ABSLAMC.NS'),
    'ICICIGI':     ('ICICI Lombard General Insurance',   'ICICIGI.NS'),
    'NIACL':       ('New India Assurance',               'NIACL.NS'),
    'STARHEALTH':  ('Star Health & Allied Insurance',    'STARHEALTH.NS'),
    'CHOLAFIN':    ('Cholamandalam Investment',          'CHOLAFIN.NS'),
    'BAJAJHLDNG':  ('Bajaj Holdings & Investment',       'BAJAJHLDNG.NS'),
    'LTIM':        ('LTIMindtree',                       'LTIM.NS'),
    'PERSISTENT':  ('Persistent Systems',                'PERSISTENT.NS'),
    'COFORGE':     ('Coforge Ltd',                       'COFORGE.NS'),
    'MPHASIS':     ('Mphasis Ltd',                       'MPHASIS.NS'),
    'KPITTECH':    ('KPIT Technologies',                 'KPITTECH.NS'),
    'CYIENT':      ('Cyient Ltd',                        'CYIENT.NS'),
    'MASTEK':      ('Mastek Ltd',                        'MASTEK.NS'),
    'OLECTRA':     ('Olectra Greentech',                 'OLECTRA.NS'),
    'TVSMOTOR':    ('TVS Motor Company',                 'TVSMOTOR.NS'),
    'ASHOKLEY':    ('Ashok Leyland',                     'ASHOKLEY.NS'),
    'FORCEMOT':    ('Force Motors',                      'FORCEMOT.NS'),
    'CEATLTD':     ('CEAT Ltd',                          'CEATLTD.NS'),
    'MRF':         ('MRF Ltd',                           'MRF.NS'),
    'APOLLOTYRE':  ('Apollo Tyres',                      'APOLLOTYRE.NS'),
    'FINPIPE':     ('Finolex Industries',                'FINPIPE.NS'),
    'APLAPOLLO':   ('APL Apollo Tubes',                  'APLAPOLLO.NS'),
    'RATNAMANI':   ('Ratnamani Metals & Tubes',          'RATNAMANI.NS'),
    'JINDALSAW':   ('Jindal Saw',                        'JINDALSAW.NS'),
    'WELSPUNLIV':  ('Welspun Living',                    'WELSPUNLIV.NS'),
    'PAGEIND':     ('Page Industries',                   'PAGEIND.NS'),
    'TTKPRESTIG':  ('TTK Prestige',                      'TTKPRESTIG.NS'),
    'VAIBHAVGBL':  ('Vaibhav Global',                    'VAIBHAVGBL.NS'),
    'KALYANKJIL':  ('Kalyan Jewellers India',            'KALYANKJIL.NS'),
    'SENCO':       ('Senco Gold',                        'SENCO.NS'),
    'PCJEWELLER':  ('PC Jeweller',                       'PCJEWELLER.NS'),
    'ZYDUSLIFE':   ('Zydus Lifesciences',                'ZYDUSLIFE.NS'),
    'AAVAS':       ('Aavas Financiers',                  'AAVAS.NS'),
    'HOMEFIRST':   ('Home First Finance Company',        'HOMEFIRST.NS'),
    'APTUS':       ('Aptus Value Housing Finance',       'APTUS.NS'),
    'CANFINHOME':  ('Can Fin Homes',                     'CANFINHOME.NS'),
    'GRINDWELL':   ('Grindwell Norton',                  'GRINDWELL.NS'),
    'CUMMINSIND':  ('Cummins India',                     'CUMMINSIND.NS'),
    'THERMAX':     ('Thermax Ltd',                       'THERMAX.NS'),
    'ABB':         ('ABB India',                         'ABB.NS'),
    'SIEMENS':     ('Siemens Ltd',                       'SIEMENS.NS'),
    'HONAUT':      ('Honeywell Automation India',        'HONAUT.NS'),
    'SCHAEFFLER':  ('Schaeffler India',                  'SCHAEFFLER.NS'),
    'SKFINDIA':    ('SKF India',                         'SKFINDIA.NS'),
    'TIMKEN':      ('Timken India',                      'TIMKEN.NS'),
    'FINCABLES':   ('Finolex Cables',                    'FINCABLES.NS'),
    'POLYCAB':     ('Polycab India',                     'POLYCAB.NS'),
    'KEI':         ('KEI Industries',                    'KEI.NS'),
    'KFINTECH':    ('KFin Technologies',                 'KFINTECH.NS'),
    'CAMS':        ('Computer Age Management Services',  'CAMS.NS'),
    'BSOFT':       ('BFSI Sector (Birlasoft)',           'BSOFT.NS'),
    'ZENSARTECH':  ('Zensar Technologies',               'ZENSARTECH.NS'),
    'INTELLECT':   ('Intellect Design Arena',            'INTELLECT.NS'),
    'INOXWIND':    ('Inox Wind',                         'INOXWIND.NS'),
    'SUZLON':      ('Suzlon Energy',                     'SUZLON.NS'),
    'GREENKO':     ('Greenko Energy',                    'GREENKO.NS'),
    'TORNTPOWER':  ('Torrent Power',                     'TORNTPOWER.NS'),
    'ADANIPOWER':  ('Adani Power',                       'ADANIPOWER.NS'),
    'CESC':        ('CESC Ltd',                          'CESC.NS'),
    'NPTC':        ('NHPC Ltd',                          'NHPC.NS'),
    'SJVN':        ('SJVN Ltd',                          'SJVN.NS'),
    'IREDA':       ('Indian Renewable Energy Dev Agency','IREDA.NS'),
    'RVNL':        ('Rail Vikas Nigam',                  'RVNL.NS'),
    'IRFC':        ('Indian Railway Finance Corp',        'IRFC.NS'),
    'CONCOR':      ('Container Corporation of India',    'CONCOR.NS'),
    'GMRINFRA':    ('GMR Airports Infrastructure',       'GMRINFRA.NS'),
    'INDIGO':      ('IndiGo (InterGlobe Aviation)',      'INDIGO.NS'),
    'SPICEJET':    ('SpiceJet',                          'SPICEJET.NS'),
    'IGL':         ('Indraprastha Gas',                  'IGL.NS'),
    'MGL':         ('Mahanagar Gas',                     'MGL.NS'),
    'GAIL':        ('GAIL India',                        'GAIL.NS'),
    'PETRONET':    ('Petronet LNG',                      'PETRONET.NS'),
    'CASTROLIND':  ('Castrol India',                     'CASTROLIND.NS'),
    'ABBOTINDIA':  ('Abbott India',                      'ABBOTINDIA.NS'),
    'DEEPAKNTR':   ('Deepak Nitrite',                    'DEEPAKNTR.NS'),
    'GNFC':        ('Gujarat Narmada Valley Fertilizers','GNFC.NS'),
    'COROMANDEL':  ('Coromandel International',          'COROMANDEL.NS'),
    'UPL':         ('UPL Limited',                       'UPL.NS'),
    'PIIND':       ('PI Industries',                     'PIIND.NS'),
    'SUMICHEM':    ('Sumitomo Chemical India',           'SUMICHEM.NS'),
}

NIFTY50_MOVERS = [
    'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
    'KOTAKBANK.NS','HINDUNILVR.NS','BHARTIARTL.NS','LT.NS','AXISBANK.NS',
    'WIPRO.NS','MARUTI.NS','BAJFINANCE.NS','TITAN.NS','SBIN.NS',
    'ADANIENT.NS','SUNPHARMA.NS','NTPC.NS','ONGC.NS','HCLTECH.NS',
    'TATASTEEL.NS','JSWSTEEL.NS','TECHM.NS','CIPLA.NS','EICHERMOT.NS',
    'DRREDDY.NS','POWERGRID.NS','COALINDIA.NS','DIVISLAB.NS','ULTRACEMCO.NS',
]

def _yf_quote(symbol):
    try:
        import yfinance as yf
        t = yf.Ticker(symbol)
        fi = t.fast_info
        price = float(fi.last_price or 0)
        prev  = float(fi.previous_close or price)
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0
        return {
            'symbol': symbol,
            'price': round(price, 2),
            'prev_close': round(prev, 2),
            'change': round(change, 2),
            'change_pct': round(change_pct, 2),
        }
    except Exception as e:
        return {'symbol': symbol, 'price': 0, 'change': 0, 'change_pct': 0, 'error': str(e)}

def _yf_detail(symbol):
    try:
        import yfinance as yf
        t = yf.Ticker(symbol)
        fi = t.fast_info
        price = float(fi.last_price or 0)
        prev  = float(fi.previous_close or price)
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0
        return {
            'symbol': symbol,
            'price': round(price, 2),
            'prev_close': round(prev, 2),
            'change': round(change, 2),
            'change_pct': round(change_pct, 2),
            'open': round(float(fi.open or 0), 2),
            'high': round(float(fi.day_high or 0), 2),
            'low':  round(float(fi.day_low or 0), 2),
            'volume': int(fi.three_month_average_volume or 0),
            'market_cap': int(fi.market_cap or 0),
            'year_high': round(float(fi.year_high or 0), 2),
            'year_low':  round(float(fi.year_low or 0), 2),
        }
    except Exception as e:
        return {'symbol': symbol, 'price': 0, 'change': 0, 'change_pct': 0, 'error': str(e)}

CAPABILITIES = [
    {"id": "chat",         "category": "AI",           "icon": "💬", "name": "Natural Conversation",   "desc": "Chat in English & Telugu with full context memory"},
    {"id": "voice-in",     "category": "Voice",        "icon": "🎤", "name": "Voice Input (STT)",       "desc": "Speak commands using microphone — browser or local"},
    {"id": "voice-out",    "category": "Voice",        "icon": "🔊", "name": "Voice Output (TTS)",      "desc": "Premium AI voices via Fish Audio, ElevenLabs, or browser"},
    {"id": "voice-clone",  "category": "Voice",        "icon": "🎭", "name": "Voice Cloning",           "desc": "Clone any voice using Fish Audio API"},
    {"id": "wake-word",    "category": "Voice",        "icon": "👂", "name": "Wake Word Detection",     "desc": "Say 'Airis' or double-clap to activate hands-free"},
    {"id": "open-apps",    "category": "PC Control",   "icon": "🚀", "name": "Launch Applications",     "desc": "Open Chrome, VSCode, Office, Terminal, any app"},
    {"id": "system-ctrl",  "category": "PC Control",   "icon": "⚙️", "name": "System Control",          "desc": "Shutdown, restart, lock, volume — full OS control"},
    {"id": "file-ops",     "category": "PC Control",   "icon": "📁", "name": "File Operations",         "desc": "Create, read, edit, delete files and folders"},
    {"id": "screen-read",  "category": "PC Control",   "icon": "👁️", "name": "Screen Reading",          "desc": "Airis reads your screen and guides you visually"},
    {"id": "coding",       "category": "Coding",       "icon": "💻", "name": "Code Execution",          "desc": "Run Python scripts with [EXECUTE_PYTHON] blocks"},
    {"id": "git",          "category": "Coding",       "icon": "🔀", "name": "Git Automation",          "desc": "Auto-commit, status, branch management"},
    {"id": "self-improve", "category": "Coding",       "icon": "🧠", "name": "Self-Improvement",        "desc": "Airis adds features to itself when you ask"},
    {"id": "browser",      "category": "Browsing",     "icon": "🌐", "name": "Web Browsing",            "desc": "Google search, open URLs, YouTube, Wikipedia"},
    {"id": "gmail",        "category": "Browsing",     "icon": "📧", "name": "Email & Social",          "desc": "Open Gmail, GitHub, Reddit, Twitter, StackOverflow"},
    {"id": "trading",      "category": "Trading",      "icon": "📈", "name": "Indian Stock Market",     "desc": "NSE/BSE real-time prices, watchlist, portfolio"},
    {"id": "options",      "category": "Trading",      "icon": "📊", "name": "Options Trading",         "desc": "Black-Scholes, Greeks, options strategies"},
    {"id": "backtest",     "category": "Trading",      "icon": "🔬", "name": "Backtest Engine",         "desc": "Simulate trading strategies on historical data"},
    {"id": "technical",    "category": "Trading",      "icon": "📉", "name": "Technical Analysis",      "desc": "RSI, MACD, Bollinger Bands, ML predictions"},
    {"id": "memory",       "category": "Memory",       "icon": "🧩", "name": "Adaptive Memory",         "desc": "Learns from every interaction, remembers preferences"},
    {"id": "reminders",    "category": "Memory",       "icon": "⏰", "name": "Smart Reminders",         "desc": "Schedule and manage reminders with natural language"},
    {"id": "firebase",     "category": "Memory",       "icon": "☁️", "name": "Cloud Sync",              "desc": "Sync memory, settings and history via Firebase"},
    {"id": "12-layer",     "category": "AI",           "icon": "🔮", "name": "12-Layer AI Brain",       "desc": "Intent → Plan → Execute → Reflect → Learn → Improve"},
    {"id": "multi-agent",  "category": "AI",           "icon": "🤖", "name": "Multi-Agent System",      "desc": "Parallel AI agents tackle complex goals together"},
    {"id": "analytics",    "category": "Analytics",    "icon": "📋", "name": "Analytics Dashboard",     "desc": "Productivity metrics, usage stats, trading performance"},
    {"id": "recommender",  "category": "Analytics",    "icon": "✨", "name": "Smart Recommendations",   "desc": "AI-driven tips on productivity, trading, and health"},
    {"id": "tasks",        "category": "Productivity", "icon": "✅", "name": "Task Manager",            "desc": "Create, track and complete tasks with natural language"},
    {"id": "notes",        "category": "Productivity", "icon": "📝", "name": "Notes",                   "desc": "Quick notes saved and recalled by Airis"},
    {"id": "calendar",     "category": "Productivity", "icon": "📅", "name": "Calendar",                "desc": "Schedule events and get daily briefings"},
    {"id": "alerts",       "category": "Trading",      "icon": "🔔", "name": "Price Alerts",            "desc": "Real-time alerts when stocks hit target prices"},
]

LAYERS = [
    {"n": 1,  "name": "Intent Detector",    "desc": "Classifies input: COMMAND / GOAL / CHAT + complexity"},
    {"n": 2,  "name": "Strategic Planner",  "desc": "Breaks goals into 3–6 executable steps"},
    {"n": 3,  "name": "Plan Critic",        "desc": "Validates and optimises the plan before execution"},
    {"n": 4,  "name": "Execution Engine",   "desc": "Converts each step into runnable commands/tools"},
    {"n": 5,  "name": "Decision Engine",    "desc": "Picks the best option when multiple paths exist"},
    {"n": 6,  "name": "Safety Filter",      "desc": "Checks commands for safety before running them"},
    {"n": 7,  "name": "Self-Reflection",    "desc": "Evaluates the outcome — did the goal succeed?"},
    {"n": 8,  "name": "Adaptive Memory",    "desc": "Stores lessons, preferences, and patterns"},
    {"n": 9,  "name": "Re-Planning",        "desc": "Recovers from failures with a better plan"},
    {"n": 10, "name": "Chat Mode",          "desc": "Natural conversation with bilingual support"},
    {"n": 11, "name": "Meta-Improvement",   "desc": "Analyses the system and proposes upgrades"},
    {"n": 12, "name": "Orchestrator",       "desc": "Coordinates all 11 layers in optimal sequence"},
]


class DashboardAPIHandler(BaseHTTPRequestHandler):

    # ── Routing ─────────────────────────────────────────────────────────────

    def do_GET(self):
        path = urlparse(self.path).path
        routes = {
            '/': self.serve_dashboard,
            '/api/health': self.api_health,
            '/api/system/status': self.api_system_status,
            '/api/system/knowledge': self.api_system_knowledge,
            '/api/system/layers': self.api_system_layers,
            '/api/history': self.api_history,
            '/api/settings': self.api_get_settings,
            '/api/provider/status': self.api_provider_status,
            '/api/reminders': self.api_get_reminders,
            '/api/memory/stats': self.api_memory_stats,
            '/api/system/prompt': self.api_get_system_prompt,
            '/api/capabilities': self.api_capabilities,
            '/api/analytics': self.api_analytics,
            '/api/vibe/agents': self.api_vibe_agents,
            '/api/vibe/detect': self.api_vibe_detect_get,
            '/api/tts/config': self.api_tts_config,
            '/api/market/indices': self.api_market_indices,
            '/api/market/quote':   self.api_market_quote,
            '/api/market/search':  self.api_market_search,
            '/api/market/movers':  self.api_market_movers,
            '/api/trading/chat':   self.api_trading_chat_get,
        }
        handler = routes.get(path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        path = urlparse(self.path).path
        try:
            data = json.loads(body.decode('utf-8'))
        except Exception:
            data = {}

        routes = {
            '/api/request': lambda: self.api_request(data),
            '/api/history/clear': self.api_history_clear,
            '/api/settings': lambda: self.api_save_settings(data),
            '/api/system/prompt': lambda: self.api_save_system_prompt(data),
            '/api/reminders': lambda: self.api_add_reminder(data),
            '/api/vibe/code': lambda: self.api_vibe_code(data),
            '/api/vibe/run': lambda: self.api_vibe_run(data),
            '/api/vibe/fix': lambda: self.api_vibe_fix(data),
            '/api/vibe/chat': lambda: self.api_vibe_chat(data),
            '/api/vibe/detect': lambda: self.api_vibe_detect(data),
            '/api/trading/chat': lambda: self.api_trading_chat(data),
            '/api/tts': lambda: self.api_tts(data),
            '/api/voice/clone': lambda: self.api_voice_clone(data),
        }
        handler = routes.get(path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ── Dashboard ────────────────────────────────────────────────────────────

    def serve_dashboard(self):
        try:
            with open('system_dashboard.html', 'r') as f:
                html = f.read()
            body = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
        except Exception:
            self.send_error(404)

    # ── Core endpoints ───────────────────────────────────────────────────────

    def api_health(self):
        try:
            status = get_system_status()
            self.send_json({'status': 'healthy', 'timestamp': datetime.now().isoformat(), 'system': status})
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)

    def api_request(self, data):
        global request_history
        try:
            user_input = (data.get('input') or data.get('message') or '').strip()
            if not user_input:
                self.send_json({'error': 'No input provided'}, 400)
                return

            # ── Try real AI response first ───────────────────────────────
            reply = None
            mode = 'CHAT'
            try:
                from ai_switcher import has_provider_configured, with_fallback, refresh_providers
                from config_paths import get_dotenv_path
                from dotenv import load_dotenv
                load_dotenv(get_dotenv_path(), override=True)
                refresh_providers()

                if has_provider_configured():
                    from assistant_persona import ASSISTANT_PERSONA
                    from system_prompt_config import load_system_prompt

                    # Build system prompt: persona + master system prompt
                    try:
                        master = load_system_prompt()
                    except Exception:
                        master = ''

                    system_content = ASSISTANT_PERSONA
                    if master:
                        system_content = master + '\n\n' + ASSISTANT_PERSONA

                    # Build recent conversation history for context (last 10)
                    messages_payload = [{"role": "system", "content": system_content}]
                    for h in request_history[-10:]:
                        if h.get('input'):
                            messages_payload.append({"role": "user", "content": h['input']})
                        if h.get('reply'):
                            messages_payload.append({"role": "assistant", "content": h['reply']})
                    app_state = (data.get('app_state') or '').strip()
                    full_user_content = f"{app_state}\n\n{user_input}" if app_state else user_input
                    messages_payload.append({"role": "user", "content": full_user_content})

                    import requests as req_lib
                    try:
                        from openai import OpenAI
                    except ImportError:
                        OpenAI = None

                    def call_ai(provider, msgs):
                        pname = provider.get('name', '').lower()
                        api_key = provider.get('api_key')
                        base_url = provider.get('base_url', '')
                        model = provider.get('model', '')

                        if pname == 'ollama':
                            url = base_url.rstrip('/') + '/v1/chat/completions'
                            r = req_lib.post(url, json={'model': model, 'messages': msgs}, timeout=60)
                            r.raise_for_status()
                            d = r.json()
                            return d['choices'][0]['message']['content']

                        if OpenAI is None:
                            raise RuntimeError('openai package not installed')
                        client = OpenAI(api_key=api_key, base_url=base_url)
                        resp = client.chat.completions.create(model=model, messages=msgs)
                        return resp.choices[0].message.content

                    reply = with_fallback(call_ai, messages_payload)

            except Exception as ai_err:
                print(f"[AI] Error: {ai_err}")
                reply = None

            # ── Fallback: try the coordinator ────────────────────────────
            if not reply:
                try:
                    result = process_user_request(user_input)
                    mode = result.get('mode', 'CHAT')
                    candidate = result.get('response') or result.get('message') or ''
                    # Only use coordinator reply if it's not the stub message
                    if candidate and 'Chat mode activated' not in candidate:
                        reply = candidate
                except Exception:
                    pass

            # ── Hard fallback ────────────────────────────────────────────
            if not reply:
                reply = (
                    "⚙️ No AI provider is configured yet.\n\n"
                    "**To activate Airis:**\n"
                    "1. Click the **gear icon** (bottom-left) → **AI Engine** tab\n"
                    "2. Paste your **Groq API key** (free at console.groq.com)\n"
                    "3. Click **Save Settings**\n\n"
                    "Groq is free and takes 30 seconds to set up."
                )

            request_history.append({
                'input': user_input,
                'reply': reply,
                'timestamp': datetime.now().isoformat(),
                'mode': mode,
            })
            if len(request_history) > MAX_HISTORY:
                request_history.pop(0)

            self.send_json({
                'success': True,
                'input': user_input,
                'reply': reply,
                'mode': mode,
                'thinking': [],
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_system_status(self):
        try:
            self.send_json({'success': True, 'status': get_system_status(), 'timestamp': datetime.now().isoformat()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_system_knowledge(self):
        try:
            self.send_json({'success': True, 'knowledge': show_learned_knowledge()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_system_layers(self):
        self.send_json({'success': True, 'layers': LAYERS, 'total': len(LAYERS)})

    def api_history(self):
        self.send_json({'success': True, 'history': request_history[-20:], 'total': len(request_history)})

    def api_history_clear(self):
        global request_history
        request_history = []
        self.send_json({'success': True})

    def api_capabilities(self):
        self.send_json({'success': True, 'capabilities': CAPABILITIES})

    def api_analytics(self):
        try:
            status = get_system_status()
            session = status.get('session', {})
            execution = status.get('execution', {})
            memory_data = status.get('memory', {})
            self.send_json({
                'success': True,
                'analytics': {
                    'interactions': session.get('interactions', 0),
                    'success_rate': execution.get('success_rate', '0%'),
                    'total_executions': execution.get('total_executions', 0),
                    'strategies_learned': execution.get('strategies_learned', 0),
                    'memory_items': memory_data.get('total_strategies', 0),
                    'patterns_detected': memory_data.get('total_patterns', 0),
                    'session_start': session.get('start_time', ''),
                    'history_count': len(request_history),
                }
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── Settings ─────────────────────────────────────────────────────────────

    def _mask(self, key: str) -> str:
        if not key:
            return ''
        if len(key) <= 8:
            return '*' * len(key)
        return key[:4] + '*' * (len(key) - 8) + key[-4:]

    def api_get_settings(self):
        try:
            from ai_switcher import _load_env_keys, get_provider_status
            from config_prefs import load_prefs
            from config_paths import get_dotenv_path
            from dotenv import load_dotenv
            load_dotenv(get_dotenv_path(), override=True)

            keys = _load_env_keys()
            prefs = load_prefs()
            groq_key = (keys.get('GROQ_API_KEY') or '').strip()
            fish_key = os.getenv('FISH_AUDIO_API_KEY', '').strip()
            el_key = os.getenv('ELEVENLABS_API_KEY', '').strip()
            firebase_key = (keys.get('FIREBASE_API_KEY') or '').strip()

            self.send_json({
                'success': True,
                'settings': {
                    'groq_api_key': self._mask(groq_key),
                    'groq_api_key_set': bool(groq_key),
                    'groq_model': keys.get('GROQ_MODEL') or 'llama-3.3-70b-versatile',
                    'ollama_url': keys.get('OLLAMA_URL') or '',
                    'ollama_model': keys.get('OLLAMA_MODEL') or 'llama3.2',
                    'fish_audio_api_key': self._mask(fish_key),
                    'fish_audio_api_key_set': bool(fish_key),
                    'fish_audio_reference_id': os.getenv('FISH_AUDIO_REFERENCE_ID', ''),
                    'fish_audio_model': os.getenv('FISH_AUDIO_MODEL', 's2-pro'),
                    'elevenlabs_api_key': self._mask(el_key),
                    'elevenlabs_api_key_set': bool(el_key),
                    'elevenlabs_voice_id': os.getenv('ELEVENLABS_VOICE_ID', ''),
                    'firebase_api_key': self._mask(firebase_key),
                    'firebase_api_key_set': bool(firebase_key),
                    'voice_personality': os.getenv('VOICE_PERSONALITY', 'airis'),
                    'preferred_voice_provider': os.getenv('PREFERRED_VOICE_PROVIDER', 'fish'),
                    'voice_language': os.getenv('VOICE_LANGUAGE', 'en'),
                    'response_language': os.getenv('RESPONSE_LANGUAGE', 'auto'),
                    'wake_word': os.getenv('WAKE_WORD', 'airis'),
                    'wake_word_sensitivity': os.getenv('WAKE_WORD_SENSITIVITY', '1.0'),
                    'double_clap_enabled': os.getenv('DOUBLE_CLAP_ENABLED', 'true').lower() == 'true',
                    'voice_rate': os.getenv('VOICE_RATE', '150'),
                    'voice_volume': os.getenv('VOICE_VOLUME', '0.9'),
                    'voice_pitch': os.getenv('VOICE_PITCH', '1.0'),
                },
                'preferences': prefs,
                'providers': get_provider_status(),
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_save_settings(self, data):
        try:
            from ai_switcher import refresh_providers
            from config_prefs import save_prefs
            from config_paths import get_dotenv_path
            from dotenv import set_key

            env_path = get_dotenv_path()
            saved = []

            ENV_MAP = {
                'groq_api_key': 'GROQ_API_KEY',
                'groq_model': 'GROQ_MODEL',
                'ollama_url': 'OLLAMA_URL',
                'ollama_model': 'OLLAMA_MODEL',
                'fish_audio_api_key': 'FISH_AUDIO_API_KEY',
                'fish_audio_reference_id': 'FISH_AUDIO_REFERENCE_ID',
                'fish_audio_model': 'FISH_AUDIO_MODEL',
                'elevenlabs_api_key': 'ELEVENLABS_API_KEY',
                'elevenlabs_voice_id': 'ELEVENLABS_VOICE_ID',
                'firebase_api_key': 'FIREBASE_API_KEY',
                'voice_personality': 'VOICE_PERSONALITY',
                'preferred_voice_provider': 'PREFERRED_VOICE_PROVIDER',
                'voice_language': 'VOICE_LANGUAGE',
                'response_language': 'RESPONSE_LANGUAGE',
                'wake_word': 'WAKE_WORD',
                'wake_word_sensitivity': 'WAKE_WORD_SENSITIVITY',
                'voice_rate': 'VOICE_RATE',
                'voice_volume': 'VOICE_VOLUME',
                'voice_pitch': 'VOICE_PITCH',
            }

            # Boolean fields
            BOOL_MAP = {
                'double_clap_enabled': 'DOUBLE_CLAP_ENABLED',
            }

            settings = data.get('settings', {})
            prefs = data.get('preferences', {})

            for field, env_name in ENV_MAP.items():
                val = (settings.get(field) or '').strip()
                if val and '*' not in val:
                    set_key(env_path, env_name, val)
                    os.environ[env_name] = val
                    saved.append(env_name)

            for field, env_name in BOOL_MAP.items():
                if field in settings:
                    val = 'true' if settings[field] else 'false'
                    set_key(env_path, env_name, val)
                    os.environ[env_name] = val
                    saved.append(env_name)

            if prefs:
                save_prefs(prefs)

            refresh_providers()
            self.send_json({'success': True, 'saved': saved, 'message': f'Saved {len(saved)} setting(s)'})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_provider_status(self):
        try:
            from ai_switcher import get_provider_status, has_provider_configured, refresh_providers
            refresh_providers()
            self.send_json({
                'success': True,
                'providers': get_provider_status(),
                'has_provider': has_provider_configured(),
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── System Prompt ────────────────────────────────────────────────────────

    def api_get_system_prompt(self):
        try:
            from system_prompt_config import load_system_prompt, get_system_config
            prompt = load_system_prompt()
            cfg = get_system_config()
            self.send_json({
                'success': True,
                'prompt': prompt,
                'enabled': cfg.get('enabled', True),
                'mode': cfg.get('mode', 'agent'),
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_save_system_prompt(self, data):
        try:
            from system_prompt_config import save_system_prompt
            prompt = data.get('prompt', '').strip()
            if prompt:
                save_system_prompt(prompt)
                self.send_json({'success': True, 'message': 'System prompt saved'})
            else:
                self.send_json({'error': 'Empty prompt'}, 400)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── Reminders ────────────────────────────────────────────────────────────

    def api_get_reminders(self):
        try:
            from memory.reminders import list_reminders
            reminders = list_reminders(user_id='guest')
            self.send_json({'success': True, 'reminders': reminders})
        except Exception as e:
            self.send_json({'success': True, 'reminders': [], 'note': str(e)})

    def api_add_reminder(self, data):
        try:
            from memory.reminders import add_reminder
            text = data.get('text', '').strip()
            when = data.get('when', 'later').strip()
            if not text:
                self.send_json({'error': 'No reminder text'}, 400)
                return
            result = add_reminder(text=text, when_text=when, user_id='guest')
            self.send_json({'success': True, 'message': result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── Vibe Coder ───────────────────────────────────────────────────────────

    def api_vibe_agents(self):
        try:
            from vibe_coder import get_agents_list
            self.send_json({'success': True, 'agents': get_agents_list()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_code(self, data):
        try:
            from vibe_coder import generate_code
            prompt = (data.get('prompt') or '').strip()
            agent_id = (data.get('agent_id') or 'auto').strip()
            if not prompt:
                self.send_json({'error': 'No prompt provided'}, 400)
                return
            result = generate_code(prompt, agent_id)
            self.send_json({'success': True, **result})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_vibe_run(self, data):
        try:
            from vibe_coder import run_code
            code = (data.get('code') or '').strip()
            language = (data.get('language') or 'python').strip()
            if not code:
                self.send_json({'error': 'No code provided'}, 400)
                return
            result = run_code(code, language)
            self.send_json({'success': True, **result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_fix(self, data):
        try:
            from vibe_coder import fix_code
            code = (data.get('code') or '').strip()
            error = (data.get('error') or '').strip()
            if not code:
                self.send_json({'error': 'No code provided'}, 400)
                return
            result = fix_code(code, error)
            self.send_json({'success': True, **result})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_vibe_chat(self, data):
        try:
            from vibe_coder import chat_about_code
            message = (data.get('message') or '').strip()
            code_context = (data.get('code_context') or '').strip()
            if not message:
                self.send_json({'error': 'No message provided'}, 400)
                return
            result = chat_about_code(message, code_context)
            self.send_json({'success': True, **result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_detect(self, data):
        try:
            from vibe_coder import detect_agent_with_confidence, AGENTS
            prompt = (data.get('prompt') or '').strip()
            if not prompt:
                self.send_json({'agent_id': 'auto', 'confidence': 0})
                return
            detection = detect_agent_with_confidence(prompt)
            agent = AGENTS.get(detection['agent_id'], {})
            self.send_json({
                'success': True,
                'agent_id': detection['agent_id'],
                'agent_name': agent.get('name', ''),
                'agent_emoji': agent.get('emoji', ''),
                'confidence': detection['confidence'],
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_detect_get(self):
        self.send_json({'success': True, 'message': 'POST to /api/vibe/detect with {prompt}'})

    # ── Trading AI ───────────────────────────────────────────────────────────

    TRADING_SYSTEM_PROMPT = """You are an expert Indian stock market trading analyst and AI advisor named Airis Trading. You have deep expertise in:

- NSE and BSE listed stocks, F&O, SME IPOs, and market indices (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, MIDCAP 50, FMCG, AUTO, PHARMA)
- Technical analysis: RSI, MACD, Bollinger Bands, EMA/SMA crossovers, support/resistance levels, candlestick patterns
- Fundamental analysis: P/E ratio, P/B ratio, EPS growth, revenue trends, ROE, debt-to-equity, promoter holding
- Market news interpretation: RBI policy, FII/DII flows, global cues (Dow Jones, Nasdaq, SGX Nifty), crude oil impact
- Sector rotation strategies, momentum investing, value investing, and swing trading
- Portfolio construction, position sizing, stop-loss placement, and risk management
- IPO analysis, quarterly results interpretation, and corporate actions (dividends, buybacks, splits)

When answering:
- Be direct, specific, and actionable — give clear Buy/Sell/Hold/Watch recommendations when asked
- Always mention key price levels, targets, and stop-losses for trade setups
- Format responses with clear sections using **bold headers** when covering multiple points
- Use ₹ for Indian rupees, and standard NSE symbols (RELIANCE, TCS, INFY, etc.)
- If given live market context (indices, movers, portfolio, watchlist), incorporate that data into your analysis
- Acknowledge uncertainty where it exists — markets are dynamic
- Keep responses concise but informative — avoid excessive padding

You are the user's personal trading intelligence system. Help them make informed, data-driven decisions."""

    def api_trading_chat_get(self):
        self.send_json({'success': True, 'message': 'POST to /api/trading/chat with {message, context}'})

    def api_trading_chat(self, data):
        try:
            message = (data.get('message') or '').strip()
            context = (data.get('context') or '').strip()
            if not message:
                self.send_json({'error': 'No message provided'}, 400)
                return

            user_content = message
            if context:
                user_content = f"[Live Market Context: {context}]\n\n{message}"

            reply = None
            try:
                from ai_switcher import has_provider_configured, with_fallback, refresh_providers
                from config_paths import get_dotenv_path
                from dotenv import load_dotenv
                load_dotenv(get_dotenv_path(), override=True)
                refresh_providers()

                if has_provider_configured():
                    messages_payload = [
                        {"role": "system", "content": self.TRADING_SYSTEM_PROMPT},
                        {"role": "user",   "content": user_content},
                    ]

                    import requests as req_lib
                    try:
                        from openai import OpenAI
                    except ImportError:
                        OpenAI = None

                    def call_ai(provider, msgs):
                        pname   = provider.get('name', '').lower()
                        api_key = provider.get('api_key')
                        base_url = provider.get('base_url', '')
                        model   = provider.get('model', '')
                        if pname == 'ollama':
                            url = base_url.rstrip('/') + '/v1/chat/completions'
                            r = req_lib.post(url, json={'model': model, 'messages': msgs}, timeout=60)
                            r.raise_for_status()
                            d = r.json()
                            return d['choices'][0]['message']['content']
                        if OpenAI is None:
                            raise RuntimeError('openai package not installed')
                        client = OpenAI(api_key=api_key, base_url=base_url)
                        resp = client.chat.completions.create(model=model, messages=msgs)
                        return resp.choices[0].message.content

                    reply = with_fallback(call_ai, messages_payload)

            except Exception as ai_err:
                print(f"[Trading AI] Error: {ai_err}")
                reply = None

            if not reply:
                reply = (
                    "⚙️ No AI provider configured.\n\n"
                    "To activate the Trading AI:\n"
                    "1. Go back to the main app → click the gear icon → AI Engine tab\n"
                    "2. Paste your **Groq API key** (free at console.groq.com)\n"
                    "3. Click Save Settings\n\n"
                    "Groq is free and takes 30 seconds to set up."
                )

            self.send_json({'success': True, 'reply': reply})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    # ── Voice / TTS ──────────────────────────────────────────────────────────

    def send_audio(self, audio_bytes, mime='audio/mpeg'):
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(audio_bytes)))
        self.end_headers()
        self.wfile.write(audio_bytes)

    def api_tts_config(self):
        from dotenv import load_dotenv
        from config_paths import get_dotenv_path
        load_dotenv(get_dotenv_path(), override=True)
        fish_key = os.getenv('FISH_AUDIO_API_KEY', '').strip()
        ref_id   = os.getenv('FISH_AUDIO_REFERENCE_ID', '').strip()
        model    = os.getenv('FISH_AUDIO_MODEL', 's2-pro').strip()
        provider = os.getenv('PREFERRED_VOICE_PROVIDER', 'fish').strip()
        self.send_json({
            'success': True,
            'fish_available': bool(fish_key and ref_id),
            'fish_key_set': bool(fish_key),
            'reference_id': ref_id,
            'model': model,
            'provider': provider,
        })

    def api_voice_clone(self, data):
        try:
            import base64
            import requests as req_lib
            from dotenv import load_dotenv, set_key
            from config_paths import get_dotenv_path

            load_dotenv(get_dotenv_path(), override=True)
            fish_key = os.getenv('FISH_AUDIO_API_KEY', '').strip()

            if not fish_key:
                self.send_json({'error': 'Fish Audio API key not set. Add it in Voice & Speech tab first.'}, 400)
                return

            name      = (data.get('name') or 'My Airis Voice').strip()
            audio_b64 = (data.get('audio_b64') or '').strip()
            ctype     = (data.get('content_type') or 'audio/mpeg').strip()

            if not audio_b64:
                self.send_json({'error': 'No audio data received'}, 400)
                return

            audio_bytes = base64.b64decode(audio_b64)
            ext = ('wav' if 'wav' in ctype else
                   'ogg' if 'ogg' in ctype else
                   'webm' if 'webm' in ctype else
                   'm4a' if 'm4a' in ctype or 'mp4' in ctype else 'mp3')

            resp = req_lib.post(
                'https://api.fish.audio/v1/model',
                headers={'Authorization': f'Bearer {fish_key}'},
                data={
                    'title': name,
                    'train_mode': 'fast',
                    'enhance_audio_quality': 'true',
                    'visibility': 'private',
                },
                files={'voices': (f'voice.{ext}', audio_bytes, ctype)},
                timeout=120,
            )
            resp.raise_for_status()
            result   = resp.json()
            model_id = result.get('_id') or result.get('id', '')

            if not model_id:
                self.send_json({'error': 'Fish Audio did not return a model ID', 'raw': result}, 500)
                return

            env_path = get_dotenv_path()
            set_key(env_path, 'FISH_AUDIO_REFERENCE_ID', model_id)
            set_key(env_path, 'PREFERRED_VOICE_PROVIDER', 'fish')
            os.environ['FISH_AUDIO_REFERENCE_ID'] = model_id
            os.environ['PREFERRED_VOICE_PROVIDER'] = 'fish'

            self.send_json({'success': True, 'model_id': model_id, 'title': name,
                            'message': f'Voice clone "{name}" created — Airis will now speak in your voice.'})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_tts(self, data):
        try:
            from dotenv import load_dotenv
            from config_paths import get_dotenv_path
            load_dotenv(get_dotenv_path(), override=True)

            text     = (data.get('text') or '').strip()
            fish_key = os.getenv('FISH_AUDIO_API_KEY', '').strip()
            ref_id   = (data.get('reference_id') or os.getenv('FISH_AUDIO_REFERENCE_ID', '')).strip()
            model    = (data.get('model')        or os.getenv('FISH_AUDIO_MODEL', 's2-pro')).strip()

            if not text:
                self.send_json({'error': 'No text provided'}, 400)
                return
            if not fish_key:
                self.send_json({'error': 'Fish Audio API key not set'}, 400)
                return
            if not ref_id:
                self.send_json({'error': 'Fish Audio reference_id not set'}, 400)
                return

            import urllib.request as urlreq
            payload = json.dumps({
                'text': text,
                'reference_id': ref_id,
                'format': 'mp3',
                'mp3_bitrate': 128,
                'latency': 'normal',
            }).encode('utf-8')

            req = urlreq.Request(
                'https://api.fish.audio/v1/tts',
                data=payload,
                headers={
                    'Authorization': f'Bearer {fish_key}',
                    'Content-Type': 'application/json',
                    'Model': model,
                },
                method='POST',
            )
            with urlreq.urlopen(req, timeout=30) as resp:
                audio_bytes = resp.read()

            self.send_audio(audio_bytes, 'audio/mpeg')

        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    # ── Memory ───────────────────────────────────────────────────────────────

    def api_memory_stats(self):
        try:
            from memory.adaptive_memory import get_memory_stats
            stats = get_memory_stats()
            self.send_json({'success': True, 'stats': stats})
        except Exception as e:
            self.send_json({'success': True, 'stats': {}, 'note': str(e)})

    # ── Market data (Yahoo Finance) ───────────────────────────────────────────

    def api_market_indices(self):
        try:
            def fetch():
                import yfinance as yf
                result = []
                for sym, name in INDICES:
                    try:
                        t = yf.Ticker(sym)
                        fi = t.fast_info
                        price = float(fi.last_price or 0)
                        prev  = float(fi.previous_close or price)
                        change = price - prev
                        pct    = (change / prev * 100) if prev else 0
                        result.append({
                            'symbol': sym, 'name': name,
                            'price': round(price, 2),
                            'change': round(change, 2),
                            'change_pct': round(pct, 2),
                        })
                    except Exception as e:
                        result.append({'symbol': sym, 'name': name, 'price': 0, 'change': 0, 'change_pct': 0})
                return result
            data = _cached('indices', fetch)
            self.send_json({'success': True, 'indices': data, 'timestamp': datetime.now().isoformat()})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)}, 500)

    def api_market_quote(self):
        try:
            qs = parse_qs(urlparse(self.path).query)
            raw = (qs.get('symbol', [''])[0] or '').strip().upper()
            if not raw:
                self.send_json({'error': 'symbol required'}, 400)
                return
            # Resolve symbol → Yahoo Finance ticker
            yf_sym = raw
            name   = raw
            if raw in NSE_STOCKS:
                name, yf_sym = NSE_STOCKS[raw]
            elif not raw.endswith('.NS') and not raw.endswith('.BO') and not raw.startswith('^'):
                yf_sym = raw + '.NS'

            def fetch():
                d = _yf_detail(yf_sym)
                d['name'] = name
                d['display_symbol'] = raw
                return d

            data = _cached(f'quote_{yf_sym}', fetch)
            self.send_json({'success': True, 'quote': data})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)}, 500)

    def api_market_search(self):
        try:
            qs = parse_qs(urlparse(self.path).query)
            q  = (qs.get('q', [''])[0] or '').strip().upper()
            results = []
            if q:
                for sym, (full_name, yf_sym) in NSE_STOCKS.items():
                    if q in sym or q in full_name.upper():
                        results.append({
                            'symbol': sym,
                            'name': full_name,
                            'yf_symbol': yf_sym,
                            'exchange': 'NSE',
                        })
                        if len(results) >= 10:
                            break
            self.send_json({'success': True, 'results': results})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)}, 500)

    def api_market_movers(self):
        try:
            def fetch():
                import yfinance as yf
                quotes = []
                for sym in NIFTY50_MOVERS:
                    try:
                        t = yf.Ticker(sym)
                        fi = t.fast_info
                        price = float(fi.last_price or 0)
                        prev  = float(fi.previous_close or price)
                        change = price - prev
                        pct    = (change / prev * 100) if prev else 0
                        display = sym.replace('.NS','').replace('.BO','')
                        quotes.append({
                            'symbol': display, 'yf_symbol': sym,
                            'price': round(price, 2),
                            'change': round(change, 2),
                            'change_pct': round(pct, 2),
                        })
                    except:
                        pass
                gainers = sorted([q for q in quotes if q['change_pct'] > 0], key=lambda x: -x['change_pct'])[:6]
                losers  = sorted([q for q in quotes if q['change_pct'] < 0], key=lambda x: x['change_pct'])[:6]
                return {'gainers': gainers, 'losers': losers}
            data = _cached('movers', fetch)
            self.send_json({'success': True, **data, 'timestamp': datetime.now().isoformat()})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)}, 500)

    def log_message(self, format, *args):
        pass


def start_server(port=8000):
    server = HTTPServer(('0.0.0.0', port), DashboardAPIHandler)
    print(f"Airis Backend API — port {port}")
    print("Ready: /api/request  /api/settings  /api/capabilities  /api/system/layers")
    server.serve_forever()


if __name__ == '__main__':
    try:
        start_server(8000)
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error: {e}")

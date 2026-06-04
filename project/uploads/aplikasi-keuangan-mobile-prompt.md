# SYSTEM PROMPT — APLIKASI MOBILE PENCATATAN KEUANGAN PRIBADI
> Aplikasi mobile sederhana untuk pencatatan keuangan pribadi, dirancang berdasarkan struktur "Financial Planner" (Loka Journey v2.0). Mencatat pemasukan, pengeluaran, tabungan, tagihan rutin, cicilan utang, dan target finansial — dengan dashboard yang ringkas dan mudah dipahami.

---

## ROLE & OBJECTIVE

Anda adalah senior mobile developer + UI/UX designer yang fokus pada aplikasi keuangan personal.

Bangun **aplikasi mobile pencatatan keuangan pribadi** yang menggantikan spreadsheet Financial Planner menjadi aplikasi yang jauh lebih mudah dipakai sehari-hari. Aplikasi ini untuk **satu pengguna individu** (bukan multi-user/perusahaan) yang ingin:

1. **Catat transaksi harian dengan cepat** — pemasukan & pengeluaran dalam hitungan detik
2. **Pantau alokasi keuangan bulanan** — income, savings, bills, spending, sisa uang
3. **Kelola tagihan rutin** — tandai sudah/belum bayar
4. **Lacak cicilan & utang** — total, terbayar, sisa
5. **Capai target finansial** — progress menuju goals (misal: iPhone 15)
6. **Lihat ringkasan & tren** — dashboard bulanan dan rekap tahunan

Prioritas desain (berurutan):
1. **Kecepatan input** — catat transaksi maksimal 3 tap
2. **Kesederhanaan** — antarmuka bersih, bahasa Indonesia, tidak overwhelming
3. **Mobile-first** — dirancang untuk layar HP, gesture-friendly, thumb-reachable
4. **Visual yang jelas** — angka uang besar dan mudah dibaca, warna semantik konsisten

---

## TECH STACK

| Layer | Teknologi |
|---|---|
| Framework | React Native (Expo) ATAU Flutter — pilih React Native + Expo |
| Bahasa | TypeScript |
| Navigation | Expo Router (file-based) |
| UI Library | NativeWind (Tailwind untuk RN) + custom components |
| Icons | lucide-react-native |
| State | Zustand + React Query |
| Local DB | SQLite (expo-sqlite) untuk offline-first |
| Backend (opsional) | Supabase (auth + sync) jika ingin multi-device |
| Charts | victory-native atau react-native-gifted-charts |
| Date | date-fns dengan locale id |
| Currency | Intl.NumberFormat (Rupiah) |
| Notifications | expo-notifications (reminder tagihan) |
| Storage | AsyncStorage untuk preferensi |
| Biometric | expo-local-authentication (Face ID / fingerprint lock) |

**Catatan**: Aplikasi harus **offline-first** — semua data tersimpan lokal di SQLite, sinkronisasi ke cloud opsional. Pengguna harus bisa mencatat transaksi tanpa internet.

**Design tokens — tema keuangan personal (clean, calm, modern):**
- Primary accent: `violet-600` (#7C3AED) — atau biru tenang `indigo-600`
- Income (pemasukan): `emerald-500` (#10B981)
- Spending (pengeluaran): `rose-500` (#F43F5E)
- Bills (tagihan): `amber-500` (#F59E0B)
- Savings (tabungan): `blue-500` (#3B82F6)
- Goals: `violet-500` (#8B5CF6)
- Surface: `white` / `zinc-950` (dark mode)
- Cards: rounded-2xl, soft shadow, generous padding
- Font: Inter atau Plus Jakarta Sans (angka pakai tabular-nums)

---

## MODEL DATA (berdasarkan struktur Excel Financial Planner)

### Konsep "Cashflow Type" — 5 tipe utama transaksi

Setiap transaksi memiliki salah satu dari tipe cashflow ini (sesuai planner asli):

| Cashflow Type | Penjelasan | Warna |
|---|---|---|
| **Income** | Pendapatan/penghasilan, tetap atau tidak tetap | emerald (hijau) |
| **Invest / Savings** | Uang yang disimpan untuk jangka pendek/panjang | blue (biru) |
| **Bills** | Pengeluaran berulang tiap bulan dengan jumlah relatif sama | amber (kuning) |
| **Spending** | Pengeluaran sehari-hari (beberapa kategori) | rose (merah) |
| **Financial Goals** | Uang/aset disimpan untuk tujuan tertentu | violet (ungu) |

Plus dua tipe khusus untuk utang:
- **Cicilan / Utang Baru** — menambah utang
- **Bayar Cicilan / Utang** — membayar utang

### Kategori per tipe (default — bisa dikustomisasi user)

**Income:**
- Gaji
- (user bisa tambah: Bonus, Lembur, Freelance, dll)

**Invest / Savings:**
- Tabungan
- Dana Darurat
- (user bisa tambah)

**Spending:**
- Makan/minum
- Transport
- Tidak Terduga
- Nongkrong
- Shopping
- Bantu Teman
- Utang
- Biaya Admin

**Bills (tagihan rutin):**
- Langganan Netflix
- Paket Data
- TF Adik
- TF Orangtua
- Sedekah
- Kos
- Listrik
- Security Kosan
- ISA Program
- (user bisa tambah)

**Financial Goals:**
- iPhone 15 (dengan target & progress)
- (user bisa tambah)

### Struktur transaksi (TypeScript)

```typescript
interface Transaction {
  id: string;
  date: string;                    // ISO date
  title: string;                   // nama transaksi (mis. "makan siang")
  amount: number;                  // jumlah dalam Rupiah
  cashflow_type: CashflowType;     // Income | Invest/Savings | Bills | Spending | Financial Goals | Cicilan/Utang Baru | Bayar Cicilan/Utang
  category: string;                // kategori sesuai tipe
  note?: string;                   // catatan opsional
  payment_method?: string;         // Cash / Transfer / E-wallet / dll
  created_at: string;
}

type CashflowType =
  | 'income'
  | 'savings'
  | 'bills'
  | 'spending'
  | 'goals'
  | 'debt_new'        // Cicilan / Utang Baru
  | 'debt_payment';   // Bayar Cicilan / Utang

interface Bill {
  id: string;
  name: string;                    // mis. "Langganan Netflix"
  amount: number;
  due_day?: number;                // tanggal jatuh tempo (1-31)
  is_recurring: boolean;
  status: 'paid' | 'unpaid';       // per bulan
  month: string;                   // "2026-01"
}

interface Debt {
  id: string;
  name: string;                    // mis. "pinjaman adel", "Bootcamp"
  total: number;
  paid: number;
  unpaid: number;                  // auto: total - paid
}

interface FinancialGoal {
  id: string;
  name: string;                    // mis. "iPhone 15"
  target_amount: number;
  current_progress: number;
  unit: string;                    // "Rp" atau "gr" (emas), dll
  target_date?: string;
}

interface Budget {
  id: string;
  category: string;                // kategori spending
  month: string;                   // "2026-01"
  budget_amount: number;
  spent: number;                   // auto-calculated
  remaining: number;               // auto: budget - spent
}

interface MonthlySummary {
  month: string;
  total_income: number;
  total_spending: number;
  bills_paid: number;
  invest_savings: number;
  sisa_uang: number;               // income - spending - bills - savings
}
```

---

## STRUKTUR NAVIGASI (Bottom Tab — 5 tab)

Aplikasi mobile menggunakan bottom tab navigation (thumb-reachable):

| Tab | Ikon | Halaman |
|---|---|---|
| **Beranda** | `lucide Home` | Dashboard ringkasan |
| **Transaksi** | `lucide ArrowLeftRight` | Daftar & riwayat transaksi |
| **+ (Tambah)** | `lucide Plus` (FAB tengah, menonjol) | Tambah transaksi cepat |
| **Anggaran** | `lucide PieChart` | Budget, bills, utang, goals |
| **Laporan** | `lucide BarChart3` | Rekap bulanan & tahunan |

Tab tengah (+) berbentuk floating button menonjol di atas tab bar (seperti app finance modern).

---

## HALAMAN 1 — BERANDA / DASHBOARD

Halaman utama yang menampilkan kondisi keuangan saat ini secara ringkas.

### Layout (scroll vertical)

**1. Header**
- Greeting: "Halo, Hasan 👋" + tanggal hari ini
- Selector bulan (default bulan berjalan) — bisa swipe/tap untuk ganti bulan
- Ikon notifikasi (bell) + ikon profil

**2. Kartu Saldo Utama (Hero Card)**
Kartu besar gradient (violet) di atas:
- Label: "Sisa Uang Bulan Ini"
- Angka besar: `Rp 256.332` (format Rupiah, putih, bold, 32px)
- Sub-info kecil: "dari Rp 5.575.000 pemasukan"
- Indikator: positif (hijau ↑) atau negatif (merah ↓)

**3. Ringkasan 4 Kartu (grid 2×2)**
Mengikuti Monthly Summary di Excel:

| Kartu | Ikon | Warna |
|---|---|---|
| Pemasukan | `lucide TrendingUp` | emerald |
| Pengeluaran | `lucide TrendingDown` | rose |
| Tabungan | `lucide PiggyBank` | blue |
| Tagihan Dibayar | `lucide Receipt` | amber |

Tiap kartu: ikon + label + nominal (format Rupiah).

**4. Grafik Alokasi (Donut Chart)**
- Judul: "Alokasi Keuangan Bulan Ini"
- Donut: Savings vs Bills vs Spending (mengikuti "Perbandingan Savings - Bills - Spending" di Excel)
- Legend dengan persentase
- Tengah donut: total pengeluaran

**5. Spending per Kategori (Bar Chart horizontal)**
- Judul: "Pengeluaran per Kategori"
- Bar horizontal: Makan/minum, Transport, Shopping, dll (sesuai kategori Excel)
- Urut dari terbesar
- Tap kategori → lihat transaksi kategori itu

**6. Quick Insight Cards (rekomendasi)**
Kartu insight otomatis (lihat fitur rekomendasi):
- "Pengeluaran Shopping bulan ini Rp 3.178.166 — melebihi rata-rata"
- "3 tagihan belum dibayar"
- "Goal iPhone 15: 0% tercapai"

**7. Transaksi Terbaru**
- List 5 transaksi terakhir
- Tiap baris: ikon kategori + nama + tanggal + nominal (warna sesuai income/expense)
- "Lihat Semua" → tab Transaksi

---

## HALAMAN 2 — TRANSAKSI

Daftar lengkap semua transaksi dengan filter & search.

### Layout

**Header:**
- Selector bulan
- Search bar (cari nama transaksi)
- Ikon filter

**Filter chips (horizontal scroll):**
- Semua / Income / Spending / Bills / Savings / Goals / Utang
- Tap untuk filter cepat

**Ringkasan mini (sticky):**
- Total Masuk (hijau) | Total Keluar (merah) bulan ini

**List transaksi (dikelompokkan per tanggal):**
```
─── Hari Ini, 17 Jan ───
🍔 Makan siang          - Rp 8.000
☕ Kopi                 - Rp 12.000
─── Kemarin, 16 Jan ───
💰 Gaji                 + Rp 5.910.000
🛒 Belanja bulanan      - Rp 252.500
```
- Tiap item: ikon kategori + nama + (kategori kecil) + nominal berwarna
- Swipe kiri → Hapus / Edit
- Tap → detail transaksi (bottom sheet)

**Detail Transaksi (Bottom Sheet):**
- Nama, nominal besar
- Tipe cashflow + kategori (badge)
- Tanggal, metode pembayaran, catatan
- Tombol: Edit / Hapus

**Empty state:**
- Ilustrasi + "Belum ada transaksi bulan ini. Yuk catat yang pertama!"

---

## HALAMAN 3 — TAMBAH TRANSAKSI (FAB tengah)

Form cepat untuk mencatat transaksi. Dirancang untuk **input maksimal 3 tap**.

### Layout (bottom sheet besar atau full screen)

**Step 1 — Pilih Tipe (segmented, paling atas):**
Tab besar berwarna:
```
[ Pengeluaran ]  [ Pemasukan ]  [ Tabungan ]  [ Bayar Tagihan ]  [ Utang ]
```
Warna tab aktif sesuai tipe (merah untuk pengeluaran, hijau untuk pemasukan, dst).

**Step 2 — Input Nominal (numpad besar):**
- Angka besar di tengah: `Rp 0`
- Numpad custom (besar, thumb-friendly)
- Format Rupiah otomatis saat ketik

**Step 3 — Detail:**
- **Kategori** — chip grid (sesuai tipe yang dipilih):
  - Jika Pengeluaran: Makan/minum, Transport, Shopping, Nongkrong, dll (dengan ikon)
  - Jika Pemasukan: Gaji, Bonus, dll
  - Jika Tabungan: Tabungan, Dana Darurat
- **Nama transaksi** — input teks (dengan auto-suggest dari history, mis. ketik "makan" → muncul "makan siang")
- **Tanggal** — default hari ini, bisa diubah
- **Metode pembayaran** — Cash / Transfer / E-wallet (opsional)
- **Catatan** — opsional

**Tombol bawah:**
- "Simpan" (primary, lebar penuh)
- "Simpan & Tambah Lagi" (untuk input beruntun)

### Smart features saat input
- Auto-suggest nama transaksi dari riwayat (sering ketik "makan siang" → muncul cepat)
- Kategori yang sering dipakai muncul di depan
- Nominal yang umum (mis. 15000, 20000) sebagai quick-button
- Ingat metode pembayaran terakhir

---

## HALAMAN 4 — ANGGARAN

Halaman pengelolaan budget, tagihan, utang, dan goals. Pakai sub-tab di atas.

### Sub-tab: Budget | Tagihan | Utang | Goals

---

### Sub-tab A — Budget (Anggaran Pengeluaran)

Mengikuti tabel "Spendings - Budget - Amount Spent - Amount Left" di Excel.

- Selector bulan
- Per kategori spending, tampilkan kartu:
  ```
  Makan/minum
  Rp 1.954.980 / Rp 2.000.000
  ▓▓▓▓▓▓▓▓▓░ 97%
  Sisa: Rp 45.020
  ```
  - Progress bar berwarna: hijau (< 80%), kuning (80-100%), merah (> 100% over budget)
- Tombol "Atur Budget" → set budget per kategori
- Ringkasan atas: Total Budget vs Total Terpakai

---

### Sub-tab B — Tagihan (Bills)

Mengikuti tabel "Bills - Item - Amount - Status" di Excel.

- Selector bulan
- List tagihan dengan toggle status:
  ```
  ✅ Kos                Rp 600.000   [Paid]
  ⬜ Langganan Netflix  Rp 55.000    [Unpaid]
  ⬜ Listrik            Rp 50.000    [Unpaid]
  ⬜ Paket Data         Rp 200.000   [Unpaid]
  ```
  - Tap toggle → tandai Paid/Unpaid
  - Saat ditandai Paid → otomatis buat transaksi tipe Bills
- Ringkasan atas: Total Tagihan | Sudah Dibayar | Belum Dibayar
- Tombol "+ Tambah Tagihan"
- Badge merah di tagihan yang mendekati jatuh tempo
- Reminder notification H-1 jatuh tempo

---

### Sub-tab C — Utang & Cicilan

Mengikuti tabel "Utang & Cicilan - Item - Total - Paid - Unpaid" di Excel.

- List utang:
  ```
  Bootcamp
  Total: Rp 13.178.770
  ▓▓░░░░░░░░ 18%
  Terbayar: Rp 2.396.140  |  Sisa: Rp 10.782.630
  ```
  - Progress bar pelunasan
- Ringkasan atas: Total Utang | Total Terbayar | Total Sisa
- Tombol "+ Tambah Utang"
- Tap utang → detail + riwayat pembayaran + tombol "Bayar Cicilan"
- "Bayar Cicilan" → buat transaksi tipe Bayar Cicilan/Utang, kurangi sisa utang

---

### Sub-tab D — Goals (Target Finansial)

Mengikuti tabel "Financial Goals or Asset - Item - Target - Progress - %" di Excel.

- List goals dengan visual menarik:
  ```
  📱 iPhone 15
  Rp 0 / Rp 15.000.000
  ░░░░░░░░░░ 0%
  Estimasi tercapai: -
  ```
  - Progress bar / circular progress
- Tombol "+ Tambah Goal"
- Tap goal → detail + tombol "Tambah Dana" (nabung untuk goal ini)
- Mendukung satuan non-uang (mis. emas dalam gram) sesuai catatan Excel
- Celebration animation saat goal tercapai 🎉

---

## HALAMAN 5 — LAPORAN

Rekap bulanan dan tahunan. Mengikuti sheet "Summary" dan "Recap" di Excel.

### Sub-tab: Bulanan | Tahunan

---

### Sub-tab A — Laporan Bulanan

Mengikuti "Monthly Financial Summary" di Excel.

- Selector bulan
- **Ringkasan angka:**
  - Total Income
  - Total Spending
  - Bills Paid
  - Monthly Invest/Savings
  - Sisa Uang (highlighted, besar)
- **Grafik perbandingan Savings-Bills-Spending** (donut/pie)
- **Grafik kategori spending** (bar/pie) — "Perbandingan Kategori Spending"
- **Breakdown income** per sumber
- Tombol "Export PDF" / "Bagikan"

---

### Sub-tab B — Laporan Tahunan

Mengikuti sheet "Recap" di Excel — matrix 12 bulan.

- **Grafik tren tahunan (line/bar chart):**
  - X-axis: Jan–Des
  - Garis/bar: Total Income, Total Spending, Savings, Sisa Uang
  - Toggle metrik mana yang ditampilkan
- **Tabel rekap 12 bulan** (horizontal scroll):
  ```
  Metrik          Jan      Feb      Mar     ...  Total
  Total Income    11.0jt   5.5jt    9.4jt   ...  37.1jt
  Total Savings   2.0jt    0.6jt    0       ...  3.7jt
  Total Bills     3.0jt    1.8jt    3.9jt   ...  11.7jt
  Total Spending  6.1jt    2.6jt    2.3jt   ...  13.2jt
  Sisa Uang       -1.2jt   0.3jt    2.9jt   ...
  ```
- **Total aset & tabungan** (mengikuti "Total Asset and Savings" di Dashboard Excel)
- **Highlight tahunan:**
  - Bulan pemasukan tertinggi
  - Bulan pengeluaran tertinggi
  - Kategori spending terbesar sepanjang tahun
  - Rata-rata tabungan per bulan

---

## FITUR REKOMENDASI (yang memudahkan & menambah nilai)

Fitur cerdas yang membuat aplikasi lebih dari sekadar pencatat:

### 1. Quick Add dari Widget / Shortcut
- Widget home screen HP untuk catat transaksi tanpa buka app
- Quick action saat long-press ikon app: "Catat Pengeluaran", "Catat Pemasukan"

### 2. Auto-Suggest Cerdas
- Saat ketik nama transaksi, suggest dari riwayat + auto-pilih kategori
- "kopi" → otomatis kategori Makan/minum, nominal terakhir 12.000

### 3. Reminder Tagihan
- Notifikasi H-1 sebelum tagihan jatuh tempo
- Notifikasi tagihan yang belum dibayar di akhir bulan
- Reminder rutin nabung (mis. tiap gajian)

### 4. Insight & Analisis Otomatis
- "Pengeluaran Shopping naik 40% dari bulan lalu"
- "Kamu sudah hemat Rp 500.000 dibanding rata-rata"
- "Dengan pola ini, goal iPhone 15 tercapai dalam 8 bulan"
- Deteksi pengeluaran tidak biasa (anomali)

### 5. Recurring Transaction
- Transaksi berulang otomatis (gaji tiap tanggal 1, Netflix tiap tanggal 5)
- Auto-create di tanggal yang ditentukan dengan konfirmasi

### 6. Scan Struk (OCR)
- Foto struk belanja → auto-ekstrak nominal & nama (Tesseract / cloud OCR)
- Hemat waktu input belanja besar

### 7. Kalkulator Built-in di Numpad
- Saat input nominal, bisa hitung langsung (mis. 15000 + 8000)

### 8. Mode Cepat "Catat Beruntun"
- Untuk input banyak transaksi sekaligus (mis. rekap akhir hari)
- "Simpan & Tambah Lagi" mempertahankan tipe & tanggal

### 9. Budget Alert Real-time
- Notifikasi saat kategori mendekati/melebihi budget
- "Budget Makan/minum tersisa Rp 45.000"

### 10. Export & Backup
- Export ke PDF (laporan) atau Excel/CSV (data mentah)
- Backup otomatis ke cloud (Google Drive / iCloud)
- Restore dari backup

### 11. Keamanan
- Lock app dengan PIN / Face ID / fingerprint
- Sembunyikan nominal (tap untuk reveal) untuk privasi di tempat umum

### 12. Multi-Currency / Multi-Akun (opsional lanjutan)
- Pisahkan akun: Cash, Bank BCA, GoPay, dll
- Lihat saldo per akun
- Transfer antar akun

### 13. Tema & Personalisasi
- Dark mode / Light mode
- Pilih warna accent
- Kategori & ikon kustom

### 14. Kalender Keuangan
- Tampilan kalender bulanan
- Tiap tanggal tampilkan total masuk/keluar
- Tap tanggal → lihat transaksi hari itu

### 15. Savings Challenge / Gamifikasi
- Tantangan nabung (mis. "52 week challenge")
- Streak mencatat transaksi setiap hari
- Badge pencapaian

### 16. Perbandingan Bulan
- Side-by-side bulan ini vs bulan lalu
- Lihat kategori mana yang naik/turun

### 17. Onboarding Cepat
- Setup awal: input saldo awal, tagihan rutin, goals
- Template kategori siap pakai (sesuai planner)

---

## DATABASE SCHEMA (SQLite — offline-first)

```sql
-- Transactions
CREATE TABLE transactions (
  id              TEXT PRIMARY KEY,
  date            TEXT NOT NULL,          -- ISO date
  title           TEXT NOT NULL,
  amount          REAL NOT NULL,
  cashflow_type   TEXT NOT NULL,          -- income|savings|bills|spending|goals|debt_new|debt_payment
  category        TEXT NOT NULL,
  payment_method  TEXT,
  note            TEXT,
  account_id      TEXT,                   -- jika multi-akun
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT
);
CREATE INDEX idx_tx_date ON transactions(date);
CREATE INDEX idx_tx_type ON transactions(cashflow_type);
CREATE INDEX idx_tx_category ON transactions(category);

-- Categories (customizable)
CREATE TABLE categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  cashflow_type TEXT NOT NULL,
  icon          TEXT,                     -- nama lucide icon
  color         TEXT,
  sort_order    INTEGER,
  is_active     INTEGER DEFAULT 1
);

-- Bills (recurring monthly)
CREATE TABLE bills (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  amount        REAL NOT NULL,
  due_day       INTEGER,                  -- 1-31
  is_recurring  INTEGER DEFAULT 1,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Bill payments (status per month)
CREATE TABLE bill_payments (
  id            TEXT PRIMARY KEY,
  bill_id       TEXT REFERENCES bills(id),
  month         TEXT NOT NULL,            -- "2026-01"
  status        TEXT DEFAULT 'unpaid',    -- paid|unpaid
  paid_date     TEXT,
  transaction_id TEXT REFERENCES transactions(id)
);

-- Debts
CREATE TABLE debts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  total         REAL NOT NULL,
  paid          REAL DEFAULT 0,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  is_active     INTEGER DEFAULT 1
);

-- Debt payments
CREATE TABLE debt_payments (
  id            TEXT PRIMARY KEY,
  debt_id       TEXT REFERENCES debts(id),
  amount        REAL NOT NULL,
  date          TEXT NOT NULL,
  transaction_id TEXT REFERENCES transactions(id)
);

-- Financial Goals
CREATE TABLE goals (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  target_amount   REAL NOT NULL,
  current_progress REAL DEFAULT 0,
  unit            TEXT DEFAULT 'Rp',      -- Rp, gr (emas), dll
  target_date     TEXT,
  icon            TEXT,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  is_achieved     INTEGER DEFAULT 0
);

-- Goal contributions
CREATE TABLE goal_contributions (
  id            TEXT PRIMARY KEY,
  goal_id       TEXT REFERENCES goals(id),
  amount        REAL NOT NULL,
  date          TEXT NOT NULL
);

-- Budgets (per category per month)
CREATE TABLE budgets (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  month         TEXT NOT NULL,            -- "2026-01"
  budget_amount REAL NOT NULL,
  UNIQUE(category, month)
);

-- Accounts (optional multi-account)
CREATE TABLE accounts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,            -- Cash, BCA, GoPay
  type          TEXT,                     -- cash|bank|ewallet
  initial_balance REAL DEFAULT 0,
  icon          TEXT,
  is_active     INTEGER DEFAULT 1
);

-- Settings
CREATE TABLE settings (
  key           TEXT PRIMARY KEY,
  value         TEXT
);
```

### Derived/computed (di app, bukan disimpan)
- **Sisa Uang** = Total Income − Total Spending − Bills Paid − Invest/Savings
- **Total Asset & Savings** = jumlah semua tabungan + saldo akun (uang saja)
- **Budget Remaining** = budget_amount − sum(spending kategori bulan itu)
- **Debt Unpaid** = total − paid

---

## ATURAN BISNIS & PERHITUNGAN

### Perhitungan Sisa Uang (mengikuti Excel)
```
Sisa Uang = Total Income − Total Spending − Bills Paid − Invest/Savings
```
Bisa negatif (seperti Januari: -1.178.823) → tampilkan merah dengan peringatan.

### Saat tandai Bill sebagai "Paid"
- Otomatis buat transaksi dengan cashflow_type = 'bills'
- Kurangi dari "sisa uang" bulan itu

### Saat "Bayar Cicilan"
- Buat transaksi cashflow_type = 'debt_payment'
- Tambah `paid` di debt, kurangi `unpaid`

### Saat "Tambah Dana" ke Goal
- Buat transaksi cashflow_type = 'goals'
- Tambah `current_progress` di goal
- Jika progress ≥ target → tandai achieved, celebration

### Format mata uang
- Selalu `Rp` + pemisah ribuan titik: `Rp 1.954.980`
- Angka besar bisa disingkat di chart: `Rp 11jt`, `Rp 1.2jt`
- Gunakan `Intl.NumberFormat('id-ID')`

### Format tanggal
- Bahasa Indonesia: "17 Januari 2026"
- Relatif: "Hari Ini", "Kemarin", "2 hari lalu"

---

## UI/UX GUIDELINES (mobile-specific)

### Prinsip desain
- **Thumb-zone aware**: aksi penting di bawah (mudah dijangkau jempol)
- **Input cepat**: numpad besar, kategori sebagai chip, auto-suggest
- **Angka adalah hero**: nominal uang besar, jelas, tabular-nums
- **Warna semantik konsisten**: hijau=masuk, merah=keluar di seluruh app
- **Gesture-friendly**: swipe untuk hapus/edit, pull-to-refresh, swipe ganti bulan

### Komponen kunci
- **Hero balance card**: gradient, rounded-3xl, angka besar
- **Transaction row**: ikon kategori (lingkaran berwarna) + nama + nominal
- **Category chip**: pill dengan ikon + label
- **Progress bar/ring**: untuk budget, goals, utang
- **Bottom sheet**: untuk tambah/detail transaksi
- **Custom numpad**: angka besar untuk input nominal
- **Empty states**: ilustrasi ramah + ajakan aksi

### Dark mode
- Wajib didukung (banyak yang cek keuangan malam hari)
- Surface gelap zinc-950, kartu zinc-900
- Warna semantik tetap kontras

### Mikro-interaksi
- Animasi saat simpan transaksi (checkmark)
- Celebration saat goal tercapai
- Haptic feedback saat tap numpad & simpan
- Smooth transition antar bulan (swipe)
- Pull-to-refresh dengan animasi

### Aksesibilitas
- Font size mengikuti sistem (Dynamic Type)
- Kontras WCAG AA
- Label jelas pada semua tombol
- Mode angka tersembunyi (privasi) tetap accessible

---

## ONBOARDING (first launch)

1. **Welcome** — value proposition singkat (3 slide)
2. **Setup nama** — "Siapa nama kamu?" (untuk greeting)
3. **Saldo awal** — input saldo/aset saat ini (opsional)
4. **Tagihan rutin** — tambah tagihan bulanan (Kos, Netflix, dll) — opsional, bisa skip
5. **Goal pertama** — set 1 target finansial (opsional)
6. **Set keamanan** — aktifkan PIN/biometric (opsional)
7. **Selesai** — masuk ke dashboard, dengan tooltip cara tambah transaksi pertama

Kategori default langsung tersedia (sesuai planner) — user tidak perlu setup dari nol.

---

## DELIVERABLE CHECKLIST

| Layar | Fungsi |
|---|---|
| Onboarding flow | Setup awal pengguna |
| Dashboard (Beranda) | Ringkasan saldo, alokasi, insight, transaksi terbaru |
| Transaksi | Daftar + filter + search + detail + edit/hapus |
| Tambah Transaksi | Form cepat dengan numpad, kategori chip, auto-suggest |
| Anggaran > Budget | Set & pantau budget per kategori |
| Anggaran > Tagihan | Kelola bills + toggle paid/unpaid + reminder |
| Anggaran > Utang | Lacak utang/cicilan + bayar cicilan |
| Anggaran > Goals | Target finansial + progress + tambah dana |
| Laporan > Bulanan | Summary bulanan + grafik |
| Laporan > Tahunan | Recap 12 bulan + tren + highlight |
| Pengaturan | Tema, keamanan, backup, kategori kustom, akun |

---

## ACCEPTANCE CRITERIA

Aplikasi siap rilis ketika:

1. ✅ Bisa catat transaksi (5 tipe cashflow) dalam maksimal 3 tap
2. ✅ Dashboard menampilkan Sisa Uang, ringkasan 4 kartu, grafik alokasi, spending per kategori
3. ✅ Semua 5 tipe cashflow (Income, Savings, Bills, Spending, Goals) + utang berfungsi
4. ✅ Bills bisa ditandai paid/unpaid, otomatis jadi transaksi
5. ✅ Utang/cicilan terlacak dengan progress pelunasan
6. ✅ Goals dengan progress bar + tambah dana + celebration saat tercapai
7. ✅ Budget per kategori dengan alert saat mendekati/melebihi
8. ✅ Laporan bulanan & rekap tahunan (12 bulan) sesuai struktur Excel
9. ✅ Perhitungan Sisa Uang akurat (Income − Spending − Bills − Savings)
10. ✅ Format Rupiah konsisten (Rp 1.954.980) & tanggal Bahasa Indonesia
11. ✅ Offline-first — berfungsi penuh tanpa internet (SQLite)
12. ✅ Auto-suggest nama transaksi dari riwayat
13. ✅ Reminder tagihan (notifikasi H-1 jatuh tempo)
14. ✅ Dark mode berfungsi di semua layar
15. ✅ Lock app dengan PIN/biometric
16. ✅ Export laporan (PDF) & backup data
17. ✅ Onboarding cepat dengan kategori default siap pakai
18. ✅ Mobile UX: thumb-friendly, swipe gestures, haptic feedback
```

// data.jsx — formatters, category metadata, type metadata (no dummy data)

// ── Formatters ───────────────────────────────────────────────
const _rp = new Intl.NumberFormat('id-ID');
function formatRp(n, { sign = false } = {}) {
  const v = Math.abs(Math.round(n));
  const s = 'Rp ' + _rp.format(v);
  if (sign) return (n < 0 ? '− ' : '+ ') + s;
  return (n < 0 ? '−' : '') + s;
}
function formatRpShort(n) {
  const v = Math.abs(n);
  let out;
  if (v >= 1e9) out = (v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1) + 'M';
  else if (v >= 1e6) out = (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'jt';
  else if (v >= 1e3) out = Math.round(v / 1e3) + 'rb';
  else out = String(v);
  return (n < 0 ? '−' : '') + 'Rp ' + out.replace('.', ',');
}
const BULAN   = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const BULAN_S = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const HARI    = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${BULAN_S[d.getMonth()]}`;
}
function relDay(iso) {
  const d = new Date(iso + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dd = Math.round((now - d) / 86400000);
  if (dd === 0) return 'Hari Ini';
  if (dd === 1) return 'Kemarin';
  if (dd > 1 && dd < 7) return `${dd} hari lalu`;
  return `${HARI[d.getDay()]}, ${fmtDateShort(iso)}`;
}

// ── Category metadata ─────────────────────────────────────────
const CATS = {
  // income
  'Gaji':             { icon: 'briefcase', color: '#10B981', type: 'income' },
  'Bonus':            { icon: 'gift',      color: '#10B981', type: 'income' },
  'Freelance':        { icon: 'wallet',    color: '#10B981', type: 'income' },
  // savings
  'Tabungan':         { icon: 'piggy',     color: '#3B82F6', type: 'savings' },
  'Dana Darurat':     { icon: 'shield',    color: '#3B82F6', type: 'savings' },
  // spending
  'Makan/minum':      { icon: 'utensils',  color: '#F43F5E', type: 'spending' },
  'Transport':        { icon: 'car',       color: '#FB923C', type: 'spending' },
  'Shopping':         { icon: 'bag',       color: '#EC4899', type: 'spending' },
  'Nongkrong':        { icon: 'coffee',    color: '#F59E0B', type: 'spending' },
  'Tidak Terduga':    { icon: 'alert',     color: '#94A3B8', type: 'spending' },
  'Bantu Teman':      { icon: 'users',     color: '#22D3EE', type: 'spending' },
  'Utang':            { icon: 'hand',      color: '#A78BFA', type: 'spending' },
  'Biaya Admin':      { icon: 'card',      color: '#64748B', type: 'spending' },
  // bills
  'Kos':              { icon: 'home',      color: '#F59E0B', type: 'bills' },
  'Langganan Netflix':{ icon: 'tv',        color: '#F59E0B', type: 'bills' },
  'Paket Data':       { icon: 'wifi',      color: '#F59E0B', type: 'bills' },
  'Listrik':          { icon: 'zap',       color: '#F59E0B', type: 'bills' },
  'Sedekah':          { icon: 'heart',     color: '#F59E0B', type: 'bills' },
  'Security Kosan':   { icon: 'shield',    color: '#F59E0B', type: 'bills' },
  'ISA Program':      { icon: 'grad',      color: '#F59E0B', type: 'bills' },
  'TF Adik':          { icon: 'users',     color: '#F59E0B', type: 'bills' },
  'TF Orangtua':      { icon: 'heart',     color: '#F59E0B', type: 'bills' },
  // goals / debt
  'iPhone 15':        { icon: 'phone',     color: '#8B5CF6', type: 'goals' },
  'Emas':             { icon: 'sparkles',  color: '#8B5CF6', type: 'goals' },
  'Dana Liburan':     { icon: 'flag',      color: '#8B5CF6', type: 'goals' },
  'Bootcamp':         { icon: 'grad',      color: '#A78BFA', type: 'debt' },
  'Pinjaman Adel':    { icon: 'hand',      color: '#A78BFA', type: 'debt' },
};
function catMeta(name) { return CATS[name] || { icon: 'wallet', color: '#94A3B8', type: 'spending' }; }

const TYPE_META = {
  income:       { label: 'Pemasukan',   cssVar: '--income',   short: 'Income' },
  savings:      { label: 'Tabungan',    cssVar: '--savings',  short: 'Savings' },
  bills:        { label: 'Tagihan',     cssVar: '--bills',    short: 'Bills' },
  spending:     { label: 'Pengeluaran', cssVar: '--spending', short: 'Spending' },
  goals:        { label: 'Goals',       cssVar: '--goals',    short: 'Goals' },
  debt_new:     { label: 'Utang Baru',  cssVar: '--goals',    short: 'Utang' },
  debt_payment: { label: 'Bayar Utang', cssVar: '--goals',    short: 'Bayar' },
};
function isIncome(t) { return t === 'income'; }

window.DATA = {
  formatRp, formatRpShort, fmtDate, fmtDateShort, relDay, BULAN, BULAN_S,
  CATS, catMeta, TYPE_META, isIncome,
};

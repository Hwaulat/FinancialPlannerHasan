// app.jsx â€” shell: header, bottom tab + FAB, theme, routing

const { BULAN, formatRp, formatRpShort } = window.DATA;
const YEAR = 2026;

const TABS = [
  { key:'beranda',   label:'Beranda',   icon:'home' },
  { key:'transaksi', label:'Transaksi', icon:'swap' },
  { key:'add',       label:'',          icon:'plus', fab:true },
  { key:'anggaran',  label:'Anggaran',  icon:'pie' },
  { key:'laporan',   label:'Laporan',   icon:'bars' },
];
const TITLES = { beranda:'Beranda', transaksi:'Transaksi', anggaran:'Anggaran', laporan:'Laporan' };

function buildSummary(txs) {
  const income = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const spending = txs.filter(t=>t.type==='spending').reduce((s,t)=>s+t.amount,0);
  const billsPaid = txs.filter(t=>t.type==='bills').reduce((s,t)=>s+t.amount,0);
  const savings = txs.filter(t=>t.type==='savings').reduce((s,t)=>s+t.amount,0);
  const debtPaid = txs.filter(t=>t.type==='debt_payment').reduce((s,t)=>s+t.amount,0);
  return {
    income,
    spending,
    billsPaid,
    savings,
    debtPaid,
    sisa: income - spending - billsPaid - savings - debtPaid,
  };
}

function buildSpendingByCat(txs) {
  const grouped = txs.reduce((acc,t) => {
    if (t.type === 'income' || t.type === 'savings') return acc;
    const key = t.cat || 'Lainnya';
    acc[key] = (acc[key] || 0) + t.amount;
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([cat, amount]) => ({ cat, amount }))
    .sort((a,b)=>b.amount-a.amount);
}

function buildInsights(summary) {
  return [
    { icon:'trendUp', tone:'income', title:'Income bulan ini', body:`${formatRp(summary.income)} sudah dicatat` },
    { icon:'receipt', tone:'bills', title:'Tagihan terbayar', body:`${formatRp(summary.billsPaid)} sudah keluar` },
    { icon:'piggy', tone:'savings', title:'Target tabungan', body:`${formatRp(summary.savings)} dialokasikan` },
  ];
}

function buildRecap(monthIdx, txs) {
  const monthNames = BULAN.map(m=>m.slice(0,3));
  const grouped = txs.reduce((acc,t) => {
    const d = new Date(t.date + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const item = acc[key] || { month: monthNames[d.getMonth()], income:0, spending:0, bills:0, savings:0, debtPaid:0, sisa:0 };
    item.income += t.type==='income' ? t.amount : 0;
    item.spending += t.type==='spending' ? t.amount : 0;
    item.bills += t.type==='bills' ? t.amount : 0;
    item.savings += t.type==='savings' ? t.amount : 0;
    item.debtPaid += t.type==='debt_payment' ? t.amount : 0;
    item.sisa = item.income - item.spending - item.bills - item.savings - item.debtPaid;
    acc[key] = item;
    return acc;
  }, {});

  return Array.from({ length: 6 }, (_, index) => {
    const localIdx = (monthIdx - 5 + index + 12) % 12;
    const key = `${YEAR}-${String(localIdx+1).padStart(2,'0')}`;
    return grouped[key] || { month: monthNames[localIdx], income:0, spending:0, bills:0, savings:0, sisa:0 };
  });
}

function App() {
  const [dark, setDark] = React.useState(false);
  const [tab, setTab] = React.useState('beranda');
  const [hidden, setHidden] = React.useState(false);
  const [selTx, setSelTx] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTx, setEditTx] = React.useState(null);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [monthIdx, setMonthIdx] = React.useState(5); // Juni

  const [txs, setTxs] = React.useState([]);
  const [budgets, setBudgets] = React.useState([]);
  const [bills, setBills] = React.useState([]);
  const [debts, setDebts] = React.useState([]);
  const [goals, setGoals] = React.useState([]);
  const [error, setError] = React.useState(null);

  const monthLabel = `${BULAN[monthIdx].slice(0,3)} ${YEAR}`;
  const monthFull = `${BULAN[monthIdx]} ${YEAR}`;
  const monthKey = `${YEAR}-${String(monthIdx+1).padStart(2,'0')}`;
  const prevM = () => setMonthIdx(i => Math.max(0, i-1));
  const nextM = () => setMonthIdx(i => Math.min(11, i+1));

  React.useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [txData, budgetData, billData, debtData, goalData] = await Promise.all([
          window.DB.getTx(),
          window.DB.getBudgets(monthKey),
          window.DB.getBills(monthKey),
          window.DB.getDebts(),
          window.DB.getGoals(),
        ]);
        setTxs(txData);
        setBudgets(budgetData.map(b => ({ ...b, amount: Number(b.amount), paid: Number(b.paid || 0) })));
        setBills(billData);
        setDebts(debtData);
        setGoals(goalData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Gagal memuat data');
      }
    };
    load();
  }, [monthKey]);

  const summary = React.useMemo(() => buildSummary(txs), [txs]);
  const spendingByCat = React.useMemo(() => buildSpendingByCat(txs), [txs]);
  const insights = React.useMemo(() => buildInsights(summary), [summary]);
  const recap = React.useMemo(() => buildRecap(monthIdx, txs), [monthIdx, txs]);

  const handleSaveTx = async tx => {
    if (tx.id) {
      const saved = await window.DB.updateTx(tx.id, tx);
      setTxs(prev => prev.map(t => t.id === saved.id ? saved : t));
      return saved;
    } else {
      const saved = await window.DB.addTx(tx);
      setTxs(prev => [saved, ...prev]);
      return saved;
    }
  };

  const handleDeleteTx = async id => {
    await window.DB.deleteTx(id);
    setTxs(prev => prev.filter(t => t.id !== id));
    if (selTx?.id === id) setSelTx(null);
  };

  const handleToggleBill = async bill => {
    const nextStatus = bill.status === 'paid' ? 'unpaid' : 'paid';
    await window.DB.toggleBill(bill.id, nextStatus);
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: nextStatus } : b));
  };

  const handleDeleteBill = async id => {
    await window.DB.deleteBill(id);
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handleAddBill = async bill => {
    const saved = await window.DB.addBill(bill);
    setBills(prev => [saved, ...prev]);
    return saved;
  };

  const handleUpdateDebt = async (id, paid, amount) => {
    const debt = debts.find(d => d.id === id);
    const actualAmount = amount != null ? amount : (debt ? paid - debt.paid : 0);
    await window.DB.updateDebt(id, paid);
    setDebts(prev => prev.map(d => d.id === id ? { ...d, paid } : d));
    if (debt && actualAmount > 0) {
      const tx = {
        title: `Bayar ${debt.name}`,
        amount: actualAmount,
        cat: debt.name,
        type: 'debt_payment',
        pay: 'Cash',
        date: new Date().toISOString().slice(0,10),
      };
      const saved = await window.DB.addTx(tx);
      setTxs(prev => [saved, ...prev]);
    }
  };

  const handleUpdateReceivable = async (id, paid) => {
    try {
      const budget = budgets.find(b => b.id === id);
      const currentPaid = budget ? Number(budget.paid || 0) : 0;
      const total = budget ? Number(budget.amount || 0) : 0;
      const actualAmount = Math.max(0, Math.min(paid, total) - currentPaid);
      const saved = await window.DB.updateBudgetPaid(id, paid);
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...saved, amount: Number(saved.amount), paid: Number(saved.paid || 0) } : b));
      if (actualAmount > 0) {
        const tx = {
          title: `Terima Piutang ${budget?.cat || ''}`.trim(),
          amount: actualAmount,
          cat: budget?.cat || 'Piutang',
          type: 'income',
          pay: 'Cash',
          date: new Date().toISOString().slice(0,10),
        };
        const savedTx = await window.DB.addTx(tx);
        setTxs(prev => [savedTx, ...prev]);
      }
      return saved;
    } catch (err) {
      console.error('Gagal memperbarui piutang', err);
      setError(err.message || 'Gagal memperbarui piutang');
      throw err;
    }
  };

  const handleDeleteDebt = async id => {
    await window.DB.deleteDebt(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const handleAddDebt = async debt => {
    const saved = await window.DB.addDebt(debt);
    setDebts(prev => [saved, ...prev]);
    return saved;
  };

  const handleUpdateGoal = async (id, progress) => {
    await window.DB.updateGoal(id, progress);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g));
  };

  const handleDeleteGoal = async id => {
    await window.DB.deleteGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleAddGoal = async goal => {
    const saved = await window.DB.addGoal(goal);
    setGoals(prev => [saved, ...prev]);
    return saved;
  };

  const handleSetBudget = async (cat, amount, paid = 0) => {
    try {
      const saved = await window.DB.setBudget(cat, monthKey, amount, paid);
      const normalizedSaved = { ...saved, amount: Number(saved.amount), paid: Number(saved.paid || 0) };
      setBudgets(prev => {
        const exists = prev.some(b => b.cat === cat && b.month === monthKey);
        if (exists) return prev.map(b => b.cat === cat && b.month === monthKey ? { ...b, ...normalizedSaved } : b);
        return [...prev, normalizedSaved];
      });
      if (paid > 0) {
        const tx = {
          title: `Terima Piutang ${cat}`,
          amount: paid,
          cat,
          type: 'income',
          pay: 'Cash',
          date: new Date().toISOString().slice(0,10),
        };
        const savedTx = await window.DB.addTx(tx);
        setTxs(prev => [savedTx, ...prev]);
      }
      return normalizedSaved;
    } catch (err) {
      console.error('Gagal menyimpan piutang', err);
      setError(err.message || 'Gagal menyimpan piutang');
      throw err;
    }
  };

  const goTab = k => { if (k==='add') setAddOpen(true); else setTab(k); };
  const scrollRef = React.useRef(null);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  const dashboardProps = { hidden, onToggleHide:()=>setHidden(h=>!h), month:monthLabel, onPrev:prevM, onNext:nextM,
    onOpenTx:setSelTx, goTab, summary, spendingByCat, insights, txs, debts, receivables:budgets };
  const transaksiProps = { hidden, month:monthLabel, onPrev:prevM, onNext:nextM, onOpenTx:setSelTx, openAdd:()=>setAddOpen(true), txs };
  const anggaranProps = { hidden, month:monthLabel, onPrev:prevM, onNext:nextM,
    budgets, bills, debts, goals,
    onToggleBill:handleToggleBill,
    onDeleteBill:handleDeleteBill,
    onAddBill:handleAddBill,
    onUpdateDebt:handleUpdateDebt,
    onDeleteDebt:handleDeleteDebt,
    onAddDebt:handleAddDebt,
    onUpdateGoal:handleUpdateGoal,
    onDeleteGoal:handleDeleteGoal,
    onAddGoal:handleAddGoal,
    onSetBudget:handleSetBudget,
    onUpdateReceivable:handleUpdateReceivable,
  };
  const laporanProps = { hidden, month:monthLabel, onPrev:prevM, onNext:nextM, summary, spendingByCat, recap };

  // fit device to viewport â€” outer stage is position:fixed + overflow:hidden so
  // the page never grows and innerHeight stays stable.
  const stageRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => {
      const el = stageRef.current; if (!el) return;
      const h = el.clientHeight, w = el.clientWidth;
      setScale(Math.min(1, (h - 24) / 874, (w - 16) / 402) || 1);
    };
    fit();
    window.addEventListener('resize', fit);
    let ro;
    if (window.ResizeObserver && stageRef.current) { ro = new ResizeObserver(fit); ro.observe(stageRef.current); }
    return () => { window.removeEventListener('resize', fit); if (ro) ro.disconnect(); };
  }, []);

  return (
    <div ref={stageRef} style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
    <div style={{ transform:`scale(${scale})`, transformOrigin:'center center', transition:'transform .15s ease' }}>
    <IOSDevice dark={dark}>
      <div className={`app-root ${dark?'dark':''}`} style={{ display:'flex', flexDirection:'column', height:'100%', position:'relative' }}>

        {/* â”€â”€ Header â”€â”€ */}
        <header style={{ flexShrink:0, paddingTop:54, padding:'54px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div style={{ minWidth:0 }}>
            {tab==='beranda' ? (
              <>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:-0.4, display:'flex', alignItems:'center', gap:6 }}>Halo, Hasan <span style={{fontSize:18}}>ðŸ‘‹</span></div>
                <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:500, marginTop:2 }}>{monthFull}</div>
              </>
            ) : (
              <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>{TITLES[tab]}</h1>
            )}
          </div>

          {/* right cluster: theme Â· notif Â· profile */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <button onClick={()=>setDark(d=>!d)} className="press" aria-label="Ganti tema" style={hdrBtn}>
              <Icon name={dark?'sun':'moon'} size={19} stroke={2.1} />
            </button>
            <button onClick={()=>setNotifOpen(true)} className="press" aria-label="Notifikasi" style={{...hdrBtn, position:'relative'}}>
              <Icon name="bell" size={19} stroke={2.1} />
              <span style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:99, background:'var(--spending)', border:'2px solid var(--bg)' }} />
            </button>
            <button onClick={()=>setProfileOpen(true)} className="press" aria-label="Profil" style={{
              width:40, height:40, borderRadius:99, border:'none', cursor:'pointer', color:'#fff', fontFamily:'inherit',
              fontSize:15, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(135deg, var(--accent-grad-a), var(--accent-grad-c))', boxShadow:'var(--shadow-sm)',
            }}>H</button>
          </div>
        </header>

        {/* â”€â”€ Scrollable screen â”€â”€ */}
        <main ref={scrollRef} style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          <div key={tab} style={{ paddingBottom:96 }}>
            {tab==='beranda'   && <window.Dashboard  {...dashboardProps} />}
            {tab==='transaksi' && <window.Transaksi  {...transaksiProps} />}
            {tab==='anggaran'  && <window.Anggaran   {...anggaranProps} />}
            {tab==='laporan'   && <window.Laporan    {...laporanProps} />}
          </div>
          {error && (
            <div style={{ padding:'16px', color:'var(--spending)', textAlign:'center' }}>Terjadi kesalahan: {error}</div>
          )}
        </main>

        {/* â”€â”€ Bottom tab bar â”€â”€ */}
        <nav style={{
          flexShrink:0, position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'space-around',
          padding:'8px 14px 26px', background:'color-mix(in srgb, var(--surface) 88%, transparent)',
          backdropFilter:'blur(18px) saturate(160%)', WebkitBackdropFilter:'blur(18px) saturate(160%)',
          borderTop:'1px solid var(--border)',
        }}>
          {TABS.map(t => {
            if (t.fab) {
              return (
                <button key={t.key} onClick={()=>setAddOpen(true)} className="press" aria-label="Tambah transaksi" style={{
                  width:58, height:58, borderRadius:20, border:'none', cursor:'pointer', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6,
                  background:'linear-gradient(135deg, var(--accent-grad-a), var(--accent-grad-b))',
                  boxShadow:'0 8px 20px -6px color-mix(in srgb, var(--accent) 80%, transparent), 0 2px 6px rgba(0,0,0,0.15)',
                  transform:'translateY(-6px)',
                }}><Icon name="plus" size={28} stroke={2.6} /></button>
              );
            }
            const active = tab===t.key;
            return (
              <button key={t.key} onClick={()=>setTab(t.key)} className="press" style={{
                border:'none', background:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center',
                gap:4, padding:'6px 10px', flex:1, color: active?'var(--accent)':'var(--text-3)', transition:'color .2s', fontFamily:'inherit',
              }}>
                <Icon name={t.icon} size={23} stroke={active?2.4:2} fill={active?'color-mix(in srgb, var(--accent) 14%, transparent)':'none'} />
                <span style={{ fontSize:10.5, fontWeight: active?700:600 }}>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* â”€â”€ Overlays â”€â”€ */}
        <window.AddSheet open={addOpen} onClose={()=>{ setAddOpen(false); setEditTx(null); }} txs={txs} onSaveTx={handleSaveTx} initial={editTx} />
        <window.TxDetailSheet tx={selTx} onClose={()=>setSelTx(null)} onDelete={handleDeleteTx} onEdit={(tx)=>{ setSelTx(null); setEditTx(tx); setAddOpen(true); }} />
        <NotifSheet open={notifOpen} onClose={()=>setNotifOpen(false)} />
        <ProfileSheet open={profileOpen} onClose={()=>setProfileOpen(false)}
          dark={dark} setDark={setDark} hidden={hidden} setHidden={setHidden} />
      </div>
    </IOSDevice>
    </div>
    </div>
  );
}

const hdrBtn = {
  width:40, height:40, borderRadius:13, border:'1px solid var(--border)', background:'var(--surface)',
  color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
  boxShadow:'var(--shadow-sm)',
};

// â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NotifSheet({ open, onClose }) {
  const items = [
    { icon:'receipt', tone:'bills', title:'TF Orangtua jatuh tempo', body:'Rp 500.000 Â· 28 Juni Â· belum dibayar', t:'2 hari lagi' },
    { icon:'alert', tone:'spending', title:'Budget Shopping terlampaui', body:'Rp 878.500 dari Rp 700.000', t:'Hari ini' },
    { icon:'phone', tone:'goals', title:'Yuk lanjut nabung iPhone 15', body:'Baru 10% â€” sisihkan Rp 1,5jt bulan ini', t:'Kemarin' },
    { icon:'piggy', tone:'savings', title:'Saatnya nabung rutin', body:'Gajian sudah masuk, alokasikan tabungan', t:'1 Jun' },
  ];
  return (
    <window.Sheet open={open} onClose={onClose}>
      <div style={{ padding:'10px 20px 26px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0 16px' }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'var(--text)' }}>Notifikasi</h2>
          <button onClick={onClose} className="press" style={hdrBtn}><Icon name="x" size={18} stroke={2.2} /></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((it,i)=>(
            <div key={i} className="press" style={{ display:'flex', gap:12, padding:14, borderRadius:16, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:`var(--${it.tone}-soft)`, color:`var(--${it.tone})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={it.icon} size={19} stroke={2.2} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>{it.title}</span>
                  <span style={{ fontSize:11, color:'var(--text-3)', flexShrink:0 }}>{it.t}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3, lineHeight:1.4 }}>{it.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </window.Sheet>
  );
}

// â”€â”€ Profile / Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProfileSheet({ open, onClose, dark, setDark, hidden, setHidden }) {
  const Row = ({ icon, tone='--accent', label, sub, right, onClick }) => (
    <button onClick={onClick} className={onClick?'press':''} style={{
      display:'flex', alignItems:'center', gap:13, width:'100%', textAlign:'left', padding:'13px 14px',
      border:'none', background:'none', cursor:onClick?'pointer':'default', fontFamily:'inherit',
      borderBottom:'1px solid var(--border-2)',
    }}>
      <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:`color-mix(in srgb, var(${tone}) 14%, var(--surface))`, color:`var(${tone})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon name={icon} size={18} stroke={2.1} /></div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:1 }}>{sub}</div>}
      </div>
      {right}
    </button>
  );
  const Toggle = ({ on, onClick }) => (
    <span onClick={onClick} className="press" style={{
      width:46, height:27, borderRadius:99, padding:3, cursor:'pointer', flexShrink:0,
      background: on?'var(--accent)':'var(--surface-3)', transition:'background .25s',
      display:'flex', justifyContent: on?'flex-end':'flex-start',
    }}>
      <span style={{ width:21, height:21, borderRadius:99, background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'all .25s' }} />
    </span>
  );

  return (
    <window.Sheet open={open} onClose={onClose} full height="90%">
      <div style={{ padding:'10px 20px 30px', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0 18px' }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'var(--text)' }}>Profil & Pengaturan</h2>
          <button onClick={onClose} className="press" style={hdrBtn}><Icon name="x" size={18} stroke={2.2} /></button>
        </div>

        {/* profile head */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', borderRadius:20, background:'var(--accent-soft)', marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:99, color:'#fff', fontSize:22, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, var(--accent-grad-a), var(--accent-grad-c))' }}>H</div>
          <div>
            <div style={{ fontSize:16.5, fontWeight:800, color:'var(--text)' }}>Hasan</div>
            <div style={{ fontSize:12.5, color:'var(--text-2)' }}>Mengelola keuangan sejak Jan 2026</div>
          </div>
        </div>

        <div style={{ fontSize:12, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:0.4, padding:'0 4px 8px' }}>Tampilan</div>
        <window.Card pad={0} style={{ marginBottom:18, overflow:'hidden' }}>
          <Row icon={dark?'moon':'sun'} label="Mode Gelap" sub="Sesuaikan kenyamanan mata" right={<Toggle on={dark} onClick={()=>setDark(d=>!d)} />} onClick={()=>setDark(d=>!d)} />
          <Row icon="eyeOff" tone="--savings" label="Sembunyikan Nominal" sub="Privasi di tempat umum" right={<Toggle on={hidden} onClick={()=>setHidden(h=>!h)} />} onClick={()=>setHidden(h=>!h)} />
          <Row icon="palette" tone="--goals" label="Warna Aksen" sub="Indigo" right={<span style={{width:22,height:22,borderRadius:99,background:'var(--accent)'}} />} />
        </window.Card>

        <div style={{ fontSize:12, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:0.4, padding:'0 4px 8px' }}>Keamanan & Data</div>
        <window.Card pad={0} style={{ marginBottom:18, overflow:'hidden' }}>
          <Row icon="fingerprint" tone="--income" label="Kunci Aplikasi" sub="Face ID / PIN" right={<Toggle on={true} />} onClick={()=>{}} />
          <Row icon="download" tone="--bills" label="Export & Backup" sub="PDF, CSV, cloud" right={<Icon name="chevR" size={17} color="var(--text-3)" />} onClick={()=>{}} />
          <Row icon="inbox" tone="--accent" label="Kelola Kategori" sub="Tambah / ubah kategori" right={<Icon name="chevR" size={17} color="var(--text-3)" />} onClick={()=>{}} />
        </window.Card>

        <window.Card pad={0} style={{ overflow:'hidden' }}>
          <Row icon="logout" tone="--spending" label="Keluar" onClick={()=>{}} />
        </window.Card>
        <div style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:20 }}>Catat Â· v1.0 Â· Offline-first</div>
      </div>
    </window.Sheet>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);


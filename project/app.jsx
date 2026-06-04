// app.jsx — shell: header, bottom tab + FAB, theme, routing

const { BULAN } = window.DATA;

const TABS = [
  { key:'beranda',   label:'Beranda',   icon:'home' },
  { key:'transaksi', label:'Transaksi', icon:'swap' },
  { key:'add',       label:'',          icon:'plus', fab:true },
  { key:'anggaran',  label:'Anggaran',  icon:'pie' },
  { key:'laporan',   label:'Laporan',   icon:'bars' },
];
const TITLES = { beranda:'Beranda', transaksi:'Transaksi', anggaran:'Anggaran', laporan:'Laporan' };

function App() {
  const [dark, setDark] = React.useState(false);
  const [tab, setTab] = React.useState('beranda');
  const [hidden, setHidden] = React.useState(false);
  const [selTx, setSelTx] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [monthIdx, setMonthIdx] = React.useState(5); // Juni

  const monthLabel = `${BULAN[monthIdx].slice(0,3)} 2026`;
  const monthFull = `${BULAN[monthIdx]} 2026`;
  const prevM = () => setMonthIdx(i => Math.max(0, i-1));
  const nextM = () => setMonthIdx(i => Math.min(11, i+1));

  const goTab = k => { if (k==='add') setAddOpen(true); else setTab(k); };
  const scrollRef = React.useRef(null);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  const screenProps = { hidden, onOpenTx:setSelTx, goTab, month:monthLabel, onPrev:prevM, onNext:nextM,
    onToggleHide:()=>setHidden(h=>!h) };

  // fit device to viewport — outer stage is position:fixed + overflow:hidden so
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

        {/* ── Header ── */}
        <header style={{ flexShrink:0, paddingTop:54, padding:'54px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div style={{ minWidth:0 }}>
            {tab==='beranda' ? (
              <>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:-0.4, display:'flex', alignItems:'center', gap:6 }}>Halo, Hasan <span style={{fontSize:18}}>👋</span></div>
                <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:500, marginTop:2 }}>Rabu, 4 Juni 2026</div>
              </>
            ) : (
              <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>{TITLES[tab]}</h1>
            )}
          </div>

          {/* right cluster: theme · notif · profile */}
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

        {/* ── Scrollable screen ── */}
        <main ref={scrollRef} style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          <div key={tab} style={{ paddingBottom:96 }}>
            {tab==='beranda'   && <window.Dashboard  {...screenProps} />}
            {tab==='transaksi' && <window.Transaksi  {...screenProps} openAdd={()=>setAddOpen(true)} />}
            {tab==='anggaran'  && <window.Anggaran   {...screenProps} />}
            {tab==='laporan'   && <window.Laporan    {...screenProps} />}
          </div>
        </main>

        {/* ── Bottom tab bar ── */}
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

        {/* ── Overlays ── */}
        <window.AddSheet open={addOpen} onClose={()=>setAddOpen(false)} />
        <window.TxDetailSheet tx={selTx} onClose={()=>setSelTx(null)} />
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

// ── Notifications ────────────────────────────────────────────
function NotifSheet({ open, onClose }) {
  const items = [
    { icon:'receipt', tone:'bills', title:'TF Orangtua jatuh tempo', body:'Rp 500.000 · 28 Juni · belum dibayar', t:'2 hari lagi' },
    { icon:'alert', tone:'spending', title:'Budget Shopping terlampaui', body:'Rp 878.500 dari Rp 700.000', t:'Hari ini' },
    { icon:'phone', tone:'goals', title:'Yuk lanjut nabung iPhone 15', body:'Baru 10% — sisihkan Rp 1,5jt bulan ini', t:'Kemarin' },
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

// ── Profile / Settings ───────────────────────────────────────
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
        <div style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:20 }}>Catat · v1.0 · Offline-first</div>
      </div>
    </window.Sheet>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

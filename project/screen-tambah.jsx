// screen-tambah.jsx — Tambah Transaksi (numpad + kategori + simpan)

const { formatRp, CATS, fmtDate } = window.DATA;

const TYPE_TABS = [
  { key:'spending', label:'Keluar',   varName:'--spending' },
  { key:'income',   label:'Masuk',    varName:'--income' },
  { key:'savings',  label:'Tabungan', varName:'--savings' },
  { key:'bills',    label:'Tagihan',  varName:'--bills' },
];

const QUICK = [15000, 20000, 50000, 100000];

function catsForType(type) {
  const map = { debt:'debt', bills:'bills', spending:'spending', income:'income', savings:'savings' };
  const want = map[type];
  return Object.entries(CATS).filter(([,m]) => m.type === want).map(([name,m]) => ({ name, ...m }));
}

function AddSheet({ open, onClose, txs = [], onSaveTx }) {
  const [type, setType] = React.useState('spending');
  const [amount, setAmount] = React.useState(0);      // integer rupiah
  const [cat, setCat] = React.useState(null);
  const [name, setName] = React.useState('');
  const [pay, setPay] = React.useState('E-wallet');
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => { if (open) { reset(); } }, [open]);
  function reset(keepType) {
    setAmount(0); setCat(null); setName(''); setSaved(false);
    if (!keepType) setType('spending');
  }

  const tab = TYPE_TABS.find(t=>t.key===type);
  const accent = `var(${tab.varName})`;
  const cats = catsForType(type);

  const suggestions = name.length >= 1
    ? [...new Set(txs.filter(t => t.title.toLowerCase().startsWith(name.toLowerCase()) && t.title.toLowerCase()!==name.toLowerCase()).map(t=>t.title))].slice(0,3)
    : [];

  function press(d) {
    if (d === 'back') { setAmount(a => Math.floor(a/10)); return; }
    if (d === '000') { setAmount(a => Math.min(a*1000, 9999999999)); return; }
    setAmount(a => Math.min(a*10 + d, 9999999999));
  }

  async function doSave(again) {
    if (amount <= 0 || !cat || !onSaveTx) {
      console.warn('doSave aborted - invalid state', { amount, cat, hasHandler: !!onSaveTx });
      return;
    }
    const tx = {
      title: name || cat,
      amount,
      cat,
      type,
      pay,
      date: new Date().toISOString().slice(0,10),
    };
    try {
      const saved = await onSaveTx(tx);
      setSaved(true);
      console.info('Transaction saved', saved || tx);
      setTimeout(() => {
        if (again) { reset(true); }
        else { onClose(); }
      }, 1050);
    } catch (err) {
      console.error('Failed to save transaction', err);
      // show modal alert so users see the error
      await window.UI.alert('Gagal menyimpan transaksi: ' + (err && err.message ? err.message : String(err)), 'Error');
      setSaved(false);
    }
  }

  const canSave = amount > 0 && cat && !!onSaveTx;

  return (
    <window.Sheet open={open} onClose={onClose} full height="94%">
      {/* header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px 6px', flexShrink:0 }}>
        <window.IconButton icon="x" ariaLabel="Close" onClick={onClose} />
        <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Tambah Transaksi</div>
        <div style={{ width:36 }} />
      </div>

      {/* type tabs */}
      <div style={{ display:'flex', gap:6, padding:'4px 16px 10px', flexShrink:0 }}>
        {TYPE_TABS.map(t => {
          const active = type===t.key;
          return (
            <button key={t.key} onClick={()=>{setType(t.key); setCat(null);}} className="press" style={{
              flex:1, padding:'9px 2px', borderRadius:12, border:'1px solid', cursor:'pointer', fontFamily:'inherit',
              fontSize:11.5, fontWeight:700, transition:'all .2s ease',
              borderColor: active ? 'transparent' : 'var(--border)',
              background: active ? `var(${t.varName})` : 'var(--surface)',
              color: active ? '#fff' : 'var(--text-3)',
            }}>{t.label}</button>
          );
        })}
      </div>

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* amount */}
        <div style={{ textAlign:'center', padding:'14px 20px 4px' }}>
          <div className="num" style={{ fontSize:42, fontWeight:800, letterSpacing:-1.4, color: amount>0 ? accent : 'var(--text-3)', transition:'color .25s' }}>
            {formatRp(amount)}
          </div>
        </div>

        {/* quick amounts + reset */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', padding:'8px 16px 6px', flexWrap:'wrap' }}>
          {QUICK.map(v => (
            <window.Button key={v} variant="ghost" onClick={()=>setAmount(v)} style={{ padding:'6px 12px', borderRadius:99, background:'var(--surface-2)', color:'var(--text-2)', minWidth:88 }}>
              {window.DATA.formatRpShort(v)}
            </window.Button>
          ))}
          <window.Button variant="outline" onClick={()=>setAmount(0)} style={{ padding:'6px 12px', borderRadius:99, minWidth:88 }}>
            Reset
          </window.Button>
        </div>

        {/* category chips */}
        <div style={{ padding:'12px 16px 4px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-3)', marginBottom:9, padding:'0 2px' }}>Kategori</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {cats.map(c => {
              const active = cat===c.name;
              return (
                <button key={c.name} onClick={()=>{setCat(c.name); if(!name) setName('');}} className="press" style={{
                  display:'inline-flex', alignItems:'center', gap:7, padding:'8px 13px 8px 9px', borderRadius:13,
                  border:'1.5px solid', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600,
                  borderColor: active ? c.color : 'var(--border)',
                  background: active ? `color-mix(in srgb, ${c.color} 13%, var(--surface))` : 'var(--surface)',
                  color: active ? c.color : 'var(--text-2)', transition:'all .16s ease',
                }}>
                  <span style={{ width:24, height:24, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                    background:`color-mix(in srgb, ${c.color} 16%, transparent)`, color:c.color }}>
                    <Icon name={c.icon} size={14} stroke={2.2} />
                  </span>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* name input + suggest */}
        <div style={{ padding:'14px 16px 4px', position:'relative' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-3)', marginBottom:9, padding:'0 2px' }}>Nama transaksi</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="mis. makan siang"
            style={{ width:'100%', height:46, padding:'0 14px', borderRadius:13, border:'1px solid var(--border)',
              background:'var(--surface-2)', fontFamily:'inherit', fontSize:14.5, color:'var(--text)', outline:'none' }} />
          {suggestions.length>0 && (
            <div style={{ display:'flex', gap:7, marginTop:8, flexWrap:'wrap' }}>
              {suggestions.map(s=>(
                <window.Button key={s} variant="ghost" onClick={()=>setName(s)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:99, background:'var(--accent-soft)', color:'var(--accent)' }}>
                  <Icon name="sparkles" size={12} stroke={2.2} />{s}
                </window.Button>
              ))}
            </div>
          )}
        </div>

        {/* payment + date */}
        <div style={{ padding:'14px 16px 4px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-3)', marginBottom:9, padding:'0 2px' }}>Metode pembayaran</div>
          <div style={{ display:'flex', gap:8 }}>
            {['Cash','Transfer','E-wallet'].map(p=>(
              <window.Chip key={p} active={pay===p} onClick={()=>setPay(p)} icon={p==='Cash'?'cash':p==='Transfer'?'swap':'wallet'}>{p}</window.Chip>
            ))}
          </div>
        </div>

        <div style={{ padding:'14px 16px 6px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:13, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
            <Icon name="calendar" size={18} color="var(--text-3)" stroke={2} />
            <span style={{ fontSize:13.5, color:'var(--text-2)', fontWeight:600 }}>Tanggal</span>
            <span style={{ marginLeft:'auto', fontSize:13.5, fontWeight:700, color:'var(--text)' }}>4 Juni 2026</span>
          </div>
        </div>

        {/* numpad */}
        <div style={{ padding:'8px 14px 4px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[1,2,3,4,5,6,7,8,9].map(d=>(
              <button key={d} onClick={()=>press(d)} className="press" style={numKey}>{d}</button>
            ))}
            <button onClick={()=>press('000')} className="press" style={numKey}>000</button>
            <button onClick={()=>press(0)} className="press" style={numKey}>0</button>
            <button onClick={()=>press('back')} className="press" style={{...numKey, color:'var(--text-2)'}}><Icon name="backspace" size={22} stroke={1.9} /></button>
          </div>
        </div>

        {/* save buttons */}
        <div style={{ padding:'8px 16px 22px', display:'flex', flexDirection:'column', gap:9 }}>
          <window.Button disabled={!canSave} onClick={()=>doSave(false)} style={{ width:'100%', padding:'16px', borderRadius:16, background: canSave ? accent : 'var(--surface-3)', opacity: canSave?1:0.7, boxShadow: canSave?'var(--shadow-lift)':'none' }}>
            Simpan
          </window.Button>
          <window.Button variant="outline" disabled={!canSave} onClick={()=>doSave(true)} style={{ width:'100%', padding:'13px', borderRadius:16, color: canSave?accent:'var(--text-3)', borderColor: canSave?accent:'var(--text-3)' }}>
            Simpan & Tambah Lagi
          </window.Button>
        </div>
      </div>

      {/* success overlay */}
      {saved && (
        <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          background:'var(--surface)', animation:'fadeIn .2s' }}>
          <div style={{ width:88, height:88, borderRadius:'50%', background: accent, display:'flex', alignItems:'center', justifyContent:'center',
            animation:'popCheck .45s cubic-bezier(.2,.9,.3,1.3)', boxShadow:`0 12px 30px -8px ${accent}` }}>
            <Icon name="check" size={46} stroke={3} color="#fff" />
          </div>
          <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginTop:18 }}>Tersimpan!</div>
          <div className="num" style={{ fontSize:14, color:'var(--text-3)', marginTop:4 }}>{formatRp(amount)} · {cat}</div>
        </div>
      )}
    </window.Sheet>
  );
}

const iconBtn = { width:36, height:36, borderRadius:11, border:'none', background:'var(--surface-2)', color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' };
const numKey = {
  height:50, borderRadius:14, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)',
  fontFamily:'inherit', fontSize:21, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
};

window.AddSheet = AddSheet;

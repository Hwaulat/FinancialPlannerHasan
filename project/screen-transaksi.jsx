// screen-transaksi.jsx — daftar transaksi + detail sheet

const { formatRp, fmtDate, relDay, catMeta, TYPE_META } = window.DATA;

const FILTERS = [
  { key:'all', label:'Semua' },
  { key:'income', label:'Income' },
  { key:'spending', label:'Pengeluaran' },
  { key:'bills', label:'Tagihan' },
  { key:'savings', label:'Tabungan' },
  { key:'goals', label:'Goals' },
  { key:'debt', label:'Utang' },
];

function Transaksi({ hidden, onOpenTx, month, onPrev, onNext, txs }) {
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const filtered = txs.filter(t => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase()) || t.cat.toLowerCase().includes(q.toLowerCase());
    let matchF = true;
    if (filter === 'debt') matchF = t.type==='debt_new' || t.type==='debt_payment';
    else if (filter !== 'all') matchF = t.type === filter;
    return matchQ && matchF;
  });

  const totalIn = filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const totalOut = filtered.filter(t=>['spending','bills'].includes(t.type)).reduce((s,t)=>s+t.amount,0);

  const groups = {};
  filtered.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });
  const dates = Object.keys(groups).sort((a,b)=>b.localeCompare(a));

  return (
    <div style={{ padding:'4px 0 18px' }}>
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <window.MonthSelector label={month} onPrev={onPrev} onNext={onNext} />
        </div>

        {/* search */}
        <div style={{ display:'flex', gap:9 }}>
          <div style={{
            flex:1, display:'flex', alignItems:'center', gap:9, padding:'0 13px', height:44,
            background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)',
          }}>
            <Icon name="search" size={18} stroke={2} color="var(--text-3)" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari transaksi…"
              style={{ flex:1, border:'none', outline:'none', background:'none', fontFamily:'inherit', fontSize:14, color:'var(--text)' }} />
            {q && <button onClick={()=>setQ('')} className="press" style={{ border:'none', background:'none', cursor:'pointer', display:'flex', color:'var(--text-3)', padding:2 }}><Icon name="x" size={16} /></button>}
          </div>
        </div>

        {/* filter chips */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', margin:'0 -16px', padding:'0 16px 2px' }}>
          {FILTERS.map(f => (
            <window.Chip key={f.key} active={filter===f.key} onClick={()=>setFilter(f.key)}>{f.label}</window.Chip>
          ))}
        </div>

        {/* mini summary */}
        <div style={{ display:'flex', gap:11 }}>
          <div style={{ flex:1, padding:'11px 14px', borderRadius:15, background:'var(--income-soft)', display:'flex', alignItems:'center', gap:10 }}>
            <Icon name="arrowDown" size={18} color="var(--income)" stroke={2.4} />
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600 }}>Masuk</div>
              <div className="num" style={{ fontSize:14, fontWeight:800, color:'var(--income)' }}>{hidden?'••••':formatRp(totalIn)}</div>
            </div>
          </div>
          <div style={{ flex:1, padding:'11px 14px', borderRadius:15, background:'var(--spending-soft)', display:'flex', alignItems:'center', gap:10 }}>
            <Icon name="arrowUp" size={18} color="var(--spending)" stroke={2.4} />
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600 }}>Keluar</div>
              <div className="num" style={{ fontSize:14, fontWeight:800, color:'var(--spending)' }}>{hidden?'••••':formatRp(totalOut)}</div>
            </div>
          </div>
        </div>
      </div>

      {dates.length === 0 ? (
        <window.EmptyState icon="search" title="Tak ada transaksi" body="Coba ubah kata kunci atau filter, atau catat transaksi baru." />
      ) : (
        <div className="stagger" style={{ padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:18 }}>
          {dates.map(d => (
            <div key={d}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-3)', padding:'0 4px 8px', display:'flex', justifyContent:'space-between' }}>
                <span>{relDay(d)}</span><span style={{ fontWeight:600 }}>{fmtDate(d)}</span>
              </div>
              <window.Card pad={6}>
                {groups[d].map((t,i)=>(
                  <window.TxRow key={t.id} t={t} hidden={hidden} onClick={()=>onOpenTx(t)} last={i===groups[d].length-1} />
                ))}
              </window.Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TxDetailSheet({ tx, onClose, onDelete }) {
  if (!tx) return null;
  const income = tx.type === 'income';
  return (
    <window.Sheet open={!!tx} onClose={onClose}>
      <div style={{ padding:'8px 22px 26px', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'14px 0 18px' }}>
          <window.CatIcon cat={tx.cat} size={58} />
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginTop:13 }}>{tx.title}</div>
          <div className="num" style={{ fontSize:32, fontWeight:800, letterSpacing:-0.6, marginTop:6, color: income?'var(--income)':'var(--text)' }}>
            {(income?'+ ':'− ') + formatRp(tx.amount).replace('−','')}
          </div>
          <div style={{ marginTop:10 }}><window.TypeBadge type={tx.type} /></div>
        </div>

        <div style={{ background:'var(--surface-2)', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
          {[
            ['Kategori', tx.cat],
            ['Tanggal', fmtDate(tx.date)],
            ['Metode', tx.pay || '—'],
            ['Catatan', tx.note || '—'],
          ].map((row,i,arr)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'13px 16px', borderBottom: i===arr.length-1?'none':'1px solid var(--border)' }}>
              <span style={{ fontSize:13.5, color:'var(--text-3)' }}>{row[0]}</span>
              <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>{row[1]}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:11, marginTop:18 }}>
          <button className="press" style={btnSecondary}><Icon name="pencil" size={17} stroke={2.2} />Edit</button>
          <button className="press" onClick={() => { onDelete?.(tx.id); onClose(); }} style={btnDanger}><Icon name="trash" size={17} stroke={2.2} />Hapus</button>
        </div>
      </div>
    </window.Sheet>
  );
}

const btnSecondary = {
  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'13px', borderRadius:14,
  border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit',
  fontSize:14, fontWeight:700, cursor:'pointer',
};
const btnDanger = {
  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'13px', borderRadius:14,
  border:'none', background:'var(--spending-soft)', color:'var(--spending)', fontFamily:'inherit',
  fontSize:14, fontWeight:700, cursor:'pointer',
};

Object.assign(window, { Transaksi, TxDetailSheet });

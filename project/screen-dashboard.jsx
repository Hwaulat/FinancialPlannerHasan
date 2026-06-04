// screen-dashboard.jsx — Beranda

const { formatRp, formatRpShort, relDay, catMeta, isIncome } = window.DATA;
const { Donut, BarsH } = window.Charts;

function HeroCard({ hidden, onToggleHide, month, onPrev, onNext, summary }) {
  const sisa = summary.sisa;
  const positive = sisa >= 0;
  return (
    <div style={{
      position:'relative', borderRadius:26, padding:'20px 20px 22px', overflow:'hidden',
      background:'linear-gradient(135deg, var(--accent-grad-a) 0%, var(--accent-grad-b) 55%, var(--accent-grad-c) 120%)',
      boxShadow:'0 14px 34px -14px color-mix(in srgb, var(--accent) 70%, transparent)',
      color:'#fff',
    }}>
      {/* glow accents */}
      <div style={{ position:'absolute', top:-50, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.16)', filter:'blur(6px)' }} />
      <div style={{ position:'absolute', bottom:-60, left:-20, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />

      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <window.MonthSelector label={month} onPrev={onPrev} onNext={onNext} light />
        <button onClick={onToggleHide} className="press" aria-label="Sembunyikan nominal" style={{
          border:'none', background:'rgba(255,255,255,0.16)', color:'#fff', width:34, height:34, borderRadius:99,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(8px)',
        }}><Icon name={hidden?'eyeOff':'eye'} size={17} stroke={2.1} /></button>
      </div>

      <div style={{ position:'relative' }}>
        <div style={{ fontSize:13, opacity:0.85, fontWeight:600, marginBottom:6 }}>Sisa Uang Bulan Ini</div>
        <div className="num" style={{ fontSize:38, fontWeight:800, letterSpacing:-1, lineHeight:1 }}>
          {hidden ? 'Rp ••••••' : formatRp(sisa)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:11 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:3, padding:'3px 9px', borderRadius:99,
            background:'rgba(255,255,255,0.18)', fontSize:12, fontWeight:700, backdropFilter:'blur(8px)',
          }}>
            <Icon name={positive?'arrowUp':'arrowDown'} size={13} stroke={2.6} />
            {positive ? 'Surplus' : 'Defisit'}
          </span>
          <span style={{ fontSize:12.5, opacity:0.85 }}>
            dari {hidden ? 'Rp ••••' : formatRp(summary.income)} pemasukan
          </span>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ hidden, onToggleHide, onOpenTx, goTab, month, onPrev, onNext, summary, spendingByCat, insights, txs, debts }) {
  const recent = txs.slice(0, 5);
  const mask = v => hidden ? 'Rp ••••' : v;

  const donutSegs = [
    { label:'Pengeluaran', value:summary.spending,  color:'var(--spending)' },
    { label:'Tagihan',     value:summary.billsPaid,  color:'var(--bills)' },
    { label:'Tabungan',    value:summary.savings,    color:'var(--savings)' },
  ];
  const totalOut = donutSegs.reduce((s,x)=>s+x.value,0);

  const barRows = spendingByCat.slice(0,5).map(s => ({
    label:s.cat, value:s.amount, color:catMeta(s.cat).color,
  }));

  const debtsTotal = (debts || []).reduce((s,d)=>s + (d.total||0), 0);
  const debtsPaid = (debts || []).reduce((s,d)=>s + (d.paid||0), 0);

  return (
    <div className="stagger" style={{ padding:'4px 16px 18px', display:'flex', flexDirection:'column', gap:18 }}>
      <HeroCard hidden={hidden} onToggleHide={onToggleHide} month={month} onPrev={onPrev} onNext={onNext} summary={summary} />

      {/* 4 stat tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
        <window.StatTile icon="trendUp"   label="Pemasukan"  value={mask(formatRpShort(summary.income))}   varName="--income" />
        <window.StatTile icon="trendDown" label="Pengeluaran" value={mask(formatRpShort(summary.spending))} varName="--spending" />
        <window.StatTile icon="piggy"     label="Tabungan"   value={mask(formatRpShort(summary.savings))}  varName="--savings" />
        <window.StatTile icon="receipt"   label="Tagihan Dibayar" value={mask(formatRpShort(summary.billsPaid))} varName="--bills" />
      </div>

      {/* Debt summary */}
      <window.Card pad={18}>
        <window.SectionHead title="Ringkasan Utang" />
        <div style={{ display:'flex', gap:12, marginTop:8 }}>
          <div style={{ flex:1, padding:12, borderRadius:12, background:'var(--surface)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:600 }}>Total Utang</div>
            <div className="num" style={{ fontSize:16, fontWeight:800, marginTop:6 }}>{hidden ? '••••' : formatRp(debtsTotal)}</div>
          </div>
          <div style={{ flex:1, padding:12, borderRadius:12, background:'var(--surface)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:600 }}>Terbayar</div>
            <div className="num" style={{ fontSize:16, fontWeight:800, marginTop:6, color:'var(--income)' }}>{hidden ? '••••' : formatRp(debtsPaid)}</div>
          </div>
          <div style={{ flex:1, padding:12, borderRadius:12, background:'var(--surface)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:600 }}>Sisa</div>
            <div className="num" style={{ fontSize:16, fontWeight:800, marginTop:6, color:'var(--spending)' }}>{hidden ? '••••' : formatRp(debtsTotal - debtsPaid)}</div>
          </div>
        </div>
      </window.Card>

      {/* Allocation donut */}
      <window.Card pad={18}>
        <window.SectionHead title="Alokasi Keuangan" />
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <Donut segments={donutSegs} size={132} stroke={20}
            centerTop="Total Keluar" centerMain={hidden?'••••':formatRpShort(totalOut)} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            {donutSegs.map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:9 }}>
                <span style={{ width:10, height:10, borderRadius:3, background:s.color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, color:'var(--text-2)', fontWeight:600 }}>{s.label}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12.5, fontWeight:800, color:'var(--text)' }}>{totalOut ? Math.round(s.value/totalOut*100) : 0}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </window.Card>

      {/* Spending per category */}
      <window.Card pad={18}>
        <window.SectionHead title="Pengeluaran per Kategori" action="Semua" onAction={()=>goTab('transaksi')} />
        <BarsH rows={barRows} format={hidden ? ()=>'••••' : formatRpShort} />
      </window.Card>

      {/* Insights */}
      <div>
        <window.SectionHead title="Insight untukmu" />
        <div style={{ display:'flex', gap:11, overflowX:'auto', padding:'2px 2px 6px', margin:'0 -2px' }}>
          {insights.map((ins,i)=>(
            <div key={i} className="lift" style={{
              minWidth:210, maxWidth:210, flexShrink:0, padding:14, borderRadius:18,
              background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)',
            }}>
              <div style={{
                width:32, height:32, borderRadius:10, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center',
                background:`var(--${ins.tone}-soft)`, color:`var(--${ins.tone})`,
              }}><Icon name={ins.icon} size={17} stroke={2.2} /></div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{ins.title}</div>
              <div style={{ fontSize:11.5, color:'var(--text-3)', lineHeight:1.45 }}>{ins.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <window.SectionHead title="Transaksi Terbaru" action="Lihat Semua" onAction={()=>goTab('transaksi')} />
        <window.Card pad={6}>
          {recent.map((t,i)=>(
            <TxRow key={t.id} t={t} hidden={hidden} onClick={()=>onOpenTx(t)} last={i===recent.length-1} />
          ))}
        </window.Card>
      </div>
    </div>
  );
}

// shared transaction row (also used in Transaksi screen)
function TxRow({ t, hidden, onClick, last }) {
  const m = catMeta(t.cat);
  const income = t.type === 'income';
  const color = income ? 'var(--income)' : t.type==='savings'||t.type==='goals' ? 'var(--text)' : 'var(--text)';
  return (
    <button onClick={onClick} className="press" style={{
      display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left',
      padding:'11px 10px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit',
      borderBottom: last ? 'none' : '1px solid var(--border-2)',
    }}>
      <window.CatIcon cat={t.cat} size={40} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
        <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:2 }}>{t.cat}</div>
      </div>
      <div className="num" style={{ fontSize:14, fontWeight:800, color: income ? 'var(--income)' : 'var(--text)', whiteSpace:'nowrap' }}>
        {hidden ? '••••' : (income ? '+ ' : '− ') + formatRp(t.amount).replace('−','')}
      </div>
    </button>
  );
}

Object.assign(window, { Dashboard, TxRow });

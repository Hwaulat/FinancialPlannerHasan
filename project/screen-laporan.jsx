// screen-laporan.jsx — Laporan Bulanan & Tahunan

const { formatRp, formatRpShort, catMeta } = window.DATA;
const { Donut, BarsH, LineChart } = window.Charts;

function Laporan({ hidden, month, onPrev, onNext, summary = {}, spendingByCat = [], recap = [] }) {
  const [tab, setTab] = React.useState('bulanan');
  return (
    <div style={{ padding:'4px 16px 18px', display:'flex', flexDirection:'column', gap:16 }}>
      <window.Segmented items={[{key:'bulanan',label:'Bulanan'},{key:'tahunan',label:'Tahunan'}]} value={tab} onChange={setTab} />
      {tab==='bulanan' ? <Bulanan hidden={hidden} month={month} onPrev={onPrev} onNext={onNext} summary={summary} spendingByCat={spendingByCat} /> : <Tahunan hidden={hidden} recap={recap} />}
    </div>
  );
}

function Bulanan({ hidden, month, onPrev, onNext, summary, spendingByCat }) {
  const m = v => hidden ? '••••' : v;
  const segs = [
    { label:'Pengeluaran', value:summary.spending || 0, color:'var(--spending)' },
    { label:'Tagihan',     value:summary.billsPaid || 0, color:'var(--bills)' },
    { label:'Tabungan',    value:summary.savings || 0,  color:'var(--savings)' },
  ];
  const totalOut = segs.reduce((s,x)=>s+x.value,0);
  const bars = spendingByCat.map(s => ({ label:s.cat, value:s.amount, color:catMeta(s.cat).color }));
  const rows = [
    ['Total Income', summary.income || 0, 'var(--income)'],
    ['Total Spending', summary.spending || 0, 'var(--spending)'],
    ['Bills Paid', summary.billsPaid || 0, 'var(--bills)'],
    ['Tabungan & Invest', summary.savings || 0, 'var(--savings)'],
  ];

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'center' }}>
        <window.MonthSelector label={month} onPrev={onPrev} onNext={onNext} />
      </div>

      <div style={{ borderRadius:22, padding:'20px 18px', textAlign:'center',
        background:'linear-gradient(135deg, var(--accent-grad-a), var(--accent-grad-b))', color:'#fff',
        boxShadow:'0 14px 30px -14px color-mix(in srgb, var(--accent) 70%, transparent)' }}>
        <div style={{ fontSize:12.5, opacity:0.85, fontWeight:600 }}>Sisa Uang Bulan Ini</div>
        <div className="num" style={{ fontSize:34, fontWeight:800, letterSpacing:-0.8, marginTop:6 }}>{hidden?'Rp ••••••':formatRp(summary.sisa || 0)}</div>
      </div>

      <window.Card pad={6}>
        {rows.map((r,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:11, padding:'13px 12px', borderBottom: i===rows.length-1?'none':'1px solid var(--border-2)' }}>
            <span style={{ width:9, height:9, borderRadius:3, background:r[2] }} />
            <span style={{ flex:1, fontSize:13.5, color:'var(--text-2)', fontWeight:600 }}>{r[0]}</span>
            <span className="num" style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{m(formatRp(r[1]))}</span>
          </div>
        ))}
      </window.Card>

      <window.Card pad={18}>
        <window.SectionHead title="Savings · Bills · Spending" />
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <Donut segments={segs} size={130} stroke={20} centerTop="Keluar" centerMain={hidden?'••••':formatRpShort(totalOut)} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:11 }}>
            {segs.map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:9 }}>
                <span style={{ width:10, height:10, borderRadius:3, background:s.color }} />
                <span style={{ flex:1, fontSize:12.5, color:'var(--text-2)', fontWeight:600 }}>{s.label}</span>
                <span className="num" style={{ fontSize:12.5, fontWeight:800, color:'var(--text)' }}>{totalOut ? Math.round(s.value/totalOut*100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </window.Card>

      <window.Card pad={18}>
        <window.SectionHead title="Perbandingan Kategori Spending" />
        <BarsH rows={bars} format={hidden?()=>'••••':formatRpShort} />
      </window.Card>

      <div style={{ display:'flex', gap:11 }}>
        <button className="press" style={expBtn}><Icon name="download" size={17} stroke={2.2} />Export PDF</button>
        <button className="press" style={expBtn}><Icon name="share" size={17} stroke={2.2} />Bagikan</button>
      </div>
    </div>
  );
}

function Tahunan({ hidden, recap }) {
  const SERIES = [
    { key:'income',   label:'Income',   color:'var(--income)' },
    { key:'spending', label:'Spending', color:'var(--spending)' },
    { key:'savings',  label:'Savings',  color:'var(--savings)' },
    { key:'sisa',     label:'Sisa',     color:'var(--accent)' },
  ];
  const [active, setActive] = React.useState(['income','spending']);
  const toggle = k => setActive(a => a.includes(k) ? (a.length>1?a.filter(x=>x!==k):a) : [...a,k]);
  const shown = SERIES.filter(s=>active.includes(s.key));

  const real = recap.filter(r=>r.income>0);
  const totals = {
    income: real.reduce((s,r)=>s+r.income,0),
    savings: real.reduce((s,r)=>s+r.savings,0),
    bills: real.reduce((s,r)=>s+r.bills,0),
    spending: real.reduce((s,r)=>s+r.spending,0),
  };
  const m = v => hidden ? '••••' : v;
  const topIncome = real.length ? real.reduce((a,b)=>b.income>a.income?b:a) : { month:'-', income:0 };
  const topSpend = real.length ? real.reduce((a,b)=>b.spending>a.spending?b:a) : { month:'-', spending:0 };
  const avgSav = real.length ? totals.savings/real.length : 0;

  const tableRows = [
    ['Income', 'income', 'var(--income)'],
    ['Savings', 'savings', 'var(--savings)'],
    ['Bills', 'bills', 'var(--bills)'],
    ['Spending', 'spending', 'var(--spending)'],
    ['Sisa', 'sisa', 'var(--text)'],
  ];

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <window.Card pad={16}>
        <window.SectionHead title="Tren Tahunan 2026" />
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:14 }}>
          {SERIES.map(s=>{
            const on = active.includes(s.key);
            return (
              <button key={s.key} onClick={()=>toggle(s.key)} className="press" style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:99,
                border:'1px solid var(--border)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700,
                background: on ? 'var(--surface-2)' : 'transparent', color: on ? 'var(--text)' : 'var(--text-3)',
                opacity: on?1:0.55, transition:'all .18s',
              }}>
                <span style={{ width:9, height:9, borderRadius:3, background:s.color }} />{s.label}
              </button>
            );
          })}
        </div>
        <LineChart data={recap} series={shown} />
      </window.Card>

      <window.Card pad={0} style={{ overflow:'hidden' }}>
        <div style={{ padding:'15px 16px 11px' }}><window.SectionHead title="Rekap 12 Bulan" /></div>
        <div style={{ overflowX:'auto' }}>
          <table className="num" style={{ borderCollapse:'collapse', fontSize:11.5, whiteSpace:'nowrap', minWidth:'100%' }}>
            <thead>
              <tr>
                <th style={{ ...thCell, position:'sticky', left:0, background:'var(--surface)', textAlign:'left', zIndex:1 }}>Metrik</th>
                {recap.map(r=><th key={r.month} style={thCell}>{r.month}</th>)}
                <th style={{...thCell, color:'var(--accent)'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(([label,key,color])=>(
                <tr key={key}>
                  <td style={{ ...tdCell, position:'sticky', left:0, background:'var(--surface)', textAlign:'left', fontWeight:700, color, zIndex:1, fontFamily:'var(--font)', whiteSpace:'nowrap' }}>{label}</td>
                  {recap.map(r=>(
                    <td key={r.month} style={{ ...tdCell, color: r[key]<0?'var(--spending)':'var(--text-2)' }}>
                      {recap.length === 0 ? '–' : (hidden?'••':formatRpShort(r[key]).replace('Rp ',''))}
                    </td>
                  ))}
                  <td style={{ ...tdCell, fontWeight:800, color:'var(--text)' }}>
                    {key==='sisa' ? (hidden?'••':formatRpShort(real.reduce((s,r)=>s+r.sisa,0)).replace('Rp ','')) : (hidden?'••':formatRpShort(totals[key]).replace('Rp ',''))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </window.Card>

      <div style={{ borderRadius:20, padding:'18px', background:'var(--accent-soft)', border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="wallet" size={20} stroke={2.1} /></div>
          <div>
            <div style={{ fontSize:12, color:'var(--text-3)', fontWeight:600 }}>Total Aset & Tabungan</div>
            <div className="num" style={{ fontSize:21, fontWeight:800, color:'var(--text)', marginTop:2 }}>{hidden?'Rp ••••••':formatRp(totals.savings + 8250000)}</div>
          </div>
        </div>
      </div>

      <window.SectionHead title="Highlight Tahunan" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
        <Highlight icon="trendUp"  tone="income"   label="Income tertinggi" main={topIncome.month} sub={m(formatRpShort(topIncome.income))} />
        <Highlight icon="trendDown" tone="spending" label="Spending tertinggi" main={topSpend.month} sub={m(formatRpShort(topSpend.spending))} />
        <Highlight icon="bag"      tone="spending" label="Kategori terbesar" main={spendingByCat.length?spendingByCat[0].cat:'-'} sub={m(formatRpShort(spendingByCat.length?spendingByCat[0].amount:0))} />
        <Highlight icon="piggy"    tone="savings"  label="Rata² nabung/bln" main={m(formatRpShort(avgSav))} sub="6 bulan" />
      </div>
    </div>
  );
}

function Highlight({ icon, tone, label, main, sub }) {
  return (
    <div className="lift" style={{ background:'var(--surface)', borderRadius:16, padding:14, border:'1px solid var(--border)', boxShadow:'var(--shadow-card)' }}>
      <div style={{ width:30, height:30, borderRadius:9, background:`var(--${tone}-soft)`, color:`var(--${tone})`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:9 }}>
        <Icon name={icon} size={16} stroke={2.2} /></div>
      <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginTop:2 }}>{main}</div>
      <div className="num" style={{ fontSize:11.5, color:'var(--text-3)', marginTop:1 }}>{sub}</div>
    </div>
  );
}

const thCell = { padding:'9px 10px', fontSize:11, fontWeight:700, color:'var(--text-3)', textAlign:'right', borderBottom:'1px solid var(--border)', fontFamily:'var(--font)' };
const tdCell = { padding:'9px 10px', textAlign:'right', borderBottom:'1px solid var(--border-2)', fontVariantNumeric:'tabular-nums' };
const expBtn = { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'13px', borderRadius:14, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', fontSize:13.5, fontWeight:700, cursor:'pointer' };

window.Laporan = Laporan;

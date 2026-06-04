// screen-anggaran.jsx — Budget · Tagihan · Utang · Goals

const { formatRp, formatRpShort, catMeta, BUDGETS, BILLS, DEBTS, GOALS } = window.DATA;
const { ProgressBar, Ring } = window.Charts;

function Anggaran({ hidden, month, onPrev, onNext }) {
  const [tab, setTab] = React.useState('budget');
  return (
    <div style={{ padding:'4px 16px 18px', display:'flex', flexDirection:'column', gap:16 }}>
      <window.Segmented
        items={[{key:'budget',label:'Budget'},{key:'bills',label:'Tagihan'},{key:'debt',label:'Utang'},{key:'goals',label:'Goals'}]}
        value={tab} onChange={setTab} />
      {tab==='budget' && <BudgetTab hidden={hidden} />}
      {tab==='bills'  && <BillsTab hidden={hidden} />}
      {tab==='debt'   && <DebtTab hidden={hidden} />}
      {tab==='goals'  && <GoalsTab hidden={hidden} />}
    </div>
  );
}

function SummaryStrip({ items }) {
  return (
    <div style={{ display:'flex', background:'var(--surface)', borderRadius:18, border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', overflow:'hidden' }}>
      {items.map((it,i)=>(
        <div key={i} style={{ flex:1, padding:'14px 10px', textAlign:'center', borderLeft: i? '1px solid var(--border)':'none' }}>
          <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>{it.label}</div>
          <div className="num" style={{ fontSize:14.5, fontWeight:800, color: it.color||'var(--text)' }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── BUDGET ───────────────────────────────────────────────────
function BudgetTab({ hidden }) {
  const totalB = BUDGETS.reduce((s,b)=>s+b.budget,0);
  const totalS = BUDGETS.reduce((s,b)=>s+b.spent,0);
  const m = v => hidden ? '••••' : v;
  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <SummaryStrip items={[
        { label:'Total Budget', value:m(formatRpShort(totalB)) },
        { label:'Terpakai', value:m(formatRpShort(totalS)), color: totalS>totalB?'var(--spending)':'var(--text)' },
        { label:'Sisa', value:m(formatRpShort(totalB-totalS)), color:'var(--income)' },
      ]} />
      {BUDGETS.map((b,i) => {
        const pct = Math.round(b.spent/b.budget*100);
        const over = pct > 100;
        const col = over ? 'var(--spending)' : pct >= 80 ? 'var(--bills)' : 'var(--income)';
        const cm = catMeta(b.cat);
        return (
          <window.Card key={b.cat} pad={15} className="lift">
            <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:11 }}>
              <window.CatIcon cat={b.cat} size={38} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{b.cat}</div>
                <div className="num" style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
                  {m(formatRp(b.spent))} / {m(formatRp(b.budget))}
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:col }}>{pct}%</div>
            </div>
            <ProgressBar pct={pct} color={col} delay={i*0.05} />
            <div style={{ marginTop:8, fontSize:11.5, fontWeight:600, color: over?'var(--spending)':'var(--text-3)' }}>
              {over ? `Lewat ${m(formatRp(b.spent-b.budget))}` : `Sisa ${m(formatRp(b.budget-b.spent))}`}
            </div>
          </window.Card>
        );
      })}
      <button className="press" style={ctaGhost}><Icon name="settings" size={18} stroke={2.2} />Atur Budget</button>
    </div>
  );
}

// ── BILLS ────────────────────────────────────────────────────
function BillsTab({ hidden }) {
  const [bills, setBills] = React.useState(BILLS.map(b=>({...b})));
  const toggle = id => setBills(bs => bs.map(b => b.id===id ? {...b, status: b.status==='paid'?'unpaid':'paid'} : b));
  const total = bills.reduce((s,b)=>s+b.amount,0);
  const paid = bills.filter(b=>b.status==='paid').reduce((s,b)=>s+b.amount,0);
  const m = v => hidden ? '••••' : v;
  const sorted = [...bills].sort((a,b)=> (a.status===b.status) ? a.dueDay-b.dueDay : a.status==='unpaid'?-1:1);

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <SummaryStrip items={[
        { label:'Total Tagihan', value:m(formatRpShort(total)) },
        { label:'Dibayar', value:m(formatRpShort(paid)), color:'var(--income)' },
        { label:'Belum', value:m(formatRpShort(total-paid)), color:'var(--spending)' },
      ]} />
      <window.Card pad={6}>
        {sorted.map((b,i)=>{
          const paidB = b.status==='paid';
          const soon = !paidB && b.dueDay - 4 <= 6;
          return (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 10px', borderBottom: i===sorted.length-1?'none':'1px solid var(--border-2)' }}>
              <window.CatIcon cat={b.name} size={40} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{b.name}</div>
                <div style={{ fontSize:11.5, color: soon?'var(--spending)':'var(--text-3)', marginTop:2, fontWeight: soon?700:500 }}>
                  Jatuh tempo tgl {b.dueDay}{soon?' · segera':''}
                </div>
              </div>
              <div className="num" style={{ fontSize:13.5, fontWeight:800, color:'var(--text)' }}>{m(formatRp(b.amount))}</div>
              <button onClick={()=>toggle(b.id)} className="press" aria-label="toggle" style={{
                marginLeft:4, border:'none', cursor:'pointer', borderRadius:99, padding:'5px 11px',
                fontFamily:'inherit', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', gap:4,
                background: paidB ? 'var(--income-soft)' : 'var(--surface-3)',
                color: paidB ? 'var(--income)' : 'var(--text-3)', transition:'all .2s',
              }}>
                {paidB && <Icon name="check" size={13} stroke={3} />}{paidB?'Lunas':'Bayar'}
              </button>
            </div>
          );
        })}
      </window.Card>
      <button className="press" style={ctaGhost}><Icon name="plus" size={18} stroke={2.4} />Tambah Tagihan</button>
    </div>
  );
}

// ── DEBT ─────────────────────────────────────────────────────
function DebtTab({ hidden }) {
  const total = DEBTS.reduce((s,d)=>s+d.total,0);
  const paid = DEBTS.reduce((s,d)=>s+d.paid,0);
  const m = v => hidden ? '••••' : v;
  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <SummaryStrip items={[
        { label:'Total Utang', value:m(formatRpShort(total)) },
        { label:'Terbayar', value:m(formatRpShort(paid)), color:'var(--income)' },
        { label:'Sisa', value:m(formatRpShort(total-paid)), color:'var(--spending)' },
      ]} />
      {DEBTS.map((d,i)=>{
        const pct = Math.round(d.paid/d.total*100);
        return (
          <window.Card key={d.id} pad={16} className="lift">
            <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:13 }}>
              <window.CatIcon cat={d.name} size={40} color="var(--goals)" icon={catMeta(d.name).icon} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14.5, fontWeight:700, color:'var(--text)' }}>{d.name}</div>
                <div className="num" style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>Total {m(formatRp(d.total))}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--goals)' }}>{pct}%</div>
            </div>
            <ProgressBar pct={pct} color="var(--goals)" delay={i*0.05} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
              <span className="num" style={{ fontSize:12, color:'var(--text-3)' }}>Terbayar <b style={{color:'var(--income)'}}>{m(formatRp(d.paid))}</b></span>
              <span className="num" style={{ fontSize:12, color:'var(--text-3)' }}>Sisa <b style={{color:'var(--text)'}}>{m(formatRp(d.total-d.paid))}</b></span>
            </div>
            <button className="press" style={{ ...payBtn, marginTop:14 }}><Icon name="wallet" size={16} stroke={2.2} />Bayar Cicilan</button>
          </window.Card>
        );
      })}
      <button className="press" style={ctaGhost}><Icon name="plus" size={18} stroke={2.4} />Tambah Utang</button>
    </div>
  );
}

// ── GOALS ────────────────────────────────────────────────────
function GoalsTab({ hidden }) {
  const [goals, setGoals] = React.useState(GOALS.map(g=>({...g})));
  const [celebrate, setCelebrate] = React.useState(null);
  const m = v => hidden ? '••••' : v;

  function addFunds(id) {
    setGoals(gs => gs.map(g => {
      if (g.id!==id) return g;
      const step = g.unit==='gr' ? 1 : g.target*0.2;
      const np = Math.min(g.progress + step, g.target);
      if (np >= g.target && g.progress < g.target) setCelebrate(g.name);
      return {...g, progress:np};
    }));
  }

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {goals.map((g,i)=>{
        const pct = Math.round(g.progress/g.target*100);
        const done = pct>=100;
        const fmt = g.unit==='gr' ? (v)=>`${v} gr` : (v)=>formatRp(v);
        return (
          <window.Card key={g.id} pad={16} className="lift" style={ done?{borderColor:'var(--goals)'}:{} }>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <Ring pct={pct} size={62} stroke={6} color="var(--goals)">
                <Icon name={g.icon} size={22} color="var(--goals)" stroke={2.1} />
              </Ring>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{g.name}</span>
                  {done && <span style={{ fontSize:10.5, fontWeight:800, color:'var(--goals)', background:'var(--goals-soft)', padding:'2px 7px', borderRadius:99 }}>Tercapai 🎉</span>}
                </div>
                <div className="num" style={{ fontSize:12.5, color:'var(--text-3)', marginTop:3 }}>
                  {hidden?'••••':fmt(g.progress)} <span style={{opacity:.6}}>/ {hidden?'••••':fmt(g.target)}</span>
                </div>
                <div style={{ marginTop:8 }}><ProgressBar pct={pct} color="var(--goals)" height={7} delay={i*0.05} /></div>
              </div>
            </div>
            {!done && (
              <button onClick={()=>addFunds(g.id)} className="press" style={{ ...payBtn, marginTop:14, background:'var(--goals-soft)', color:'var(--goals)' }}>
                <Icon name="plus" size={16} stroke={2.4} />Tambah Dana
              </button>
            )}
          </window.Card>
        );
      })}
      <button className="press" style={ctaGhost}><Icon name="plus" size={18} stroke={2.4} />Tambah Goal</button>

      {celebrate && (
        <div onClick={()=>setCelebrate(null)} style={{ position:'absolute', inset:0, zIndex:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(8,8,12,0.5)', backdropFilter:'blur(3px)', animation:'fadeIn .25s' }}>
          {[...Array(14)].map((_,k)=>(
            <span key={k} style={{ position:'absolute', top:'52%', left:`${15+k*5}%`, width:9, height:9, borderRadius:2,
              background:['#8B5CF6','#10B981','#F59E0B','#F43F5E','#3B82F6'][k%5],
              animation:`floatUp ${1+ (k%4)*0.25}s ${k*0.05}s ease-out forwards` }} />
          ))}
          <div style={{ background:'var(--surface)', borderRadius:24, padding:'30px 34px', textAlign:'center', boxShadow:'var(--shadow-lift)', animation:'scaleIn .35s' }}>
            <div style={{ fontSize:40 }}>🎉</div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginTop:8 }}>Goal Tercapai!</div>
            <div style={{ fontSize:13.5, color:'var(--text-3)', marginTop:5 }}>Selamat, target <b style={{color:'var(--goals)'}}>{celebrate}</b> berhasil 🎯</div>
          </div>
        </div>
      )}
    </div>
  );
}

const ctaGhost = {
  display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', padding:'13px',
  borderRadius:15, border:'1.5px dashed var(--border)', background:'transparent', color:'var(--text-2)',
  fontFamily:'inherit', fontSize:13.5, fontWeight:700, cursor:'pointer',
};
const payBtn = {
  display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', padding:'11px',
  borderRadius:13, border:'none', background:'var(--accent-soft)', color:'var(--accent)',
  fontFamily:'inherit', fontSize:13.5, fontWeight:700, cursor:'pointer',
};

window.Anggaran = Anggaran;

// screen-anggaran.jsx — Piutang · Tagihan · Utang · Goals

const { formatRp, formatRpShort, catMeta } = window.DATA;
const { ProgressBar, Ring } = window.Charts;

function Anggaran({ hidden, budgets = [], bills = [], debts = [], goals = [],
  onToggleBill, onDeleteBill, onAddBill, onSetBudget,
  onAddDebt, onUpdateDebt, onDeleteDebt, onAddGoal, onUpdateGoal, onDeleteGoal,
  onUpdateReceivable, onDeleteReceivable }) {
  const [tab, setTab] = React.useState('receivable');
  return (
    <div style={{ padding:'4px 16px 18px', display:'flex', flexDirection:'column', gap:16 }}>
      <window.Segmented
        items={[{key:'receivable',label:'Piutang'},{key:'debt',label:'Utang'},{key:'goals',label:'Goals'}]}
        value={tab} onChange={setTab} />
      {tab==='receivable' && <ReceivableTab hidden={hidden} budgets={budgets} onSetBudget={onSetBudget} onUpdateReceivable={onUpdateReceivable} onDeleteReceivable={onDeleteReceivable} />}
      {tab==='debt'   && <DebtTab hidden={hidden} debts={debts} onAddDebt={onAddDebt} onUpdateDebt={onUpdateDebt} onDeleteDebt={onDeleteDebt} />}
      {tab==='goals'  && <GoalsTab hidden={hidden} goals={goals} onAddGoal={onAddGoal} onUpdateGoal={onUpdateGoal} onDeleteGoal={onDeleteGoal} />}
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

function ReceivableTab({ hidden, budgets, onSetBudget, onUpdateReceivable, onDeleteReceivable }) {
  const totalB = budgets.reduce((s,b)=>s+b.amount,0);
  const totalS = budgets.reduce((s,b)=>s+(b.paid||0),0);
  const m = v => hidden ? '••••' : v;

  const handleAddReceivable = () => {
    (async () => {
      const cat = await window.UI.prompt('Nama orang yang hutang ke kita');
      if (cat === null) return;
      const amountStr = await window.UI.prompt('Jumlah hutang (angka)');
      if (amountStr === null) return;
      const amount = Number(amountStr);
      if (Number.isNaN(amount) || amount <= 0) return;
      const paidStr = await window.UI.prompt('Sudah dibayar oleh peminjam (angka)', { default: '0' });
      if (paidStr === null) return;
      const paid = Number(paidStr) || 0;
      if (cat && onSetBudget) {
        try {
          await onSetBudget(cat, amount, Math.min(paid, amount));
        } catch (err) {
          console.error('Gagal menambah piutang', err);
          window.UI.toast && window.UI.toast('Gagal menambah piutang');
        }
      }
    })();
  };

  function ReceivableItem({ b, index }) {
    const [payment, setPayment] = React.useState('');
    const paid = Number(b.paid || 0);
    const total = Number(b.amount || 0);
    const remaining = Math.max(0, total - paid);
    const pct = total > 0 ? Math.round(paid / total * 100) : 0;
    const over = pct > 100;
    const col = over ? 'var(--income)' : pct >= 80 ? 'var(--bills)' : 'var(--income)';

    return (
      <window.Card key={b.id || `${b.cat}-${index}`} pad={15} className="lift">
        <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:11 }}>
          <window.CatIcon cat={b.cat} size={38} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{b.cat}</div>
            <div className="num" style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
              {m(formatRp(paid))} / {m(formatRp(b.amount))}
            </div>
          </div>
          <div style={{ fontSize:13, fontWeight:800, color:col }}>{pct}%</div>
        </div>
        <ProgressBar pct={pct} color={col} delay={index*0.05} />
        <div style={{ marginTop:8, fontSize:11.5, fontWeight:600, color: over?'var(--income)':'var(--text-3)' }}>
          {over ? `Lebih terbayar ${m(formatRp(paid-b.amount))}` : `Sisa terutang ${m(formatRp(remaining))}`}
        </div>
        <div style={{ display:'flex', gap:8, marginTop:14, alignItems:'center' }}>
          <input value={payment} onChange={e=>setPayment(e.target.value.replace(/[^0-9]/g,''))} placeholder='Nominal terima'
            style={{ flex:1, height:44, padding:'0 12px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface-2)', fontFamily:'inherit' }} />
          <window.Button variant="primary" onClick={async () => {
            const amount = Number(payment);
            if (Number.isNaN(amount) || amount <= 0 || !onUpdateReceivable) return;
            try {
              const nextPaid = Math.min(paid + amount, total);
              await onUpdateReceivable(b.id, nextPaid);
              setPayment('');
              window.UI.toast?.('Nominal terima berhasil disimpan');
            } catch (err) {
              console.error('Gagal menyimpan nominal terima', err);
              window.UI.toast?.('Gagal menyimpan nominal terima');
            }
          }} style={{ minWidth:120, padding:'11px 14px' }}><Icon name="wallet" size={16} stroke={2.2} />Terima</window.Button>
          <window.IconButton onClick={()=>onDeleteReceivable?.(b.id)} icon="trash" ariaLabel="Hapus Piutang" style={{ background:'var(--spending-soft)', color:'var(--spending)' }} />
        </div>
      </window.Card>
    );
  }

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <SummaryStrip items={[
        { label:'Total Piutang', value:m(formatRpShort(totalB)) },
        { label:'Diterima', value:m(formatRpShort(totalS)), color: totalS>totalB?'var(--spending)':'var(--text)' },
        { label:'Sisa Terutang', value:m(formatRpShort(totalB-totalS)), color:'var(--income)' },
      ]} />
      {budgets.map((b,i) => <ReceivableItem key={b.id || `${b.cat}-${i}`} b={b} index={i} />)}
      <window.Button variant="ghost" onClick={handleAddReceivable} style={{ width:'100%', justifyContent:'center' }}><Icon name="plus" size={18} stroke={2.4} />Tambah Piutang</window.Button>
    </div>
  );
}

function BillsTab({ hidden, bills, onToggleBill, onDeleteBill, onAddBill }) {
  const total = bills.reduce((s,b)=>s+b.amount,0);
  const paid = bills.filter(b=>b.status==='paid').reduce((s,b)=>s+b.amount,0);
  const m = v => hidden ? '••••' : v;
  const sorted = [...bills].sort((a,b)=> (a.status===b.status) ? a.due_day - b.due_day : a.status==='unpaid'?-1:1);

  const handleAdd = () => {
    (async () => {
      const name = await window.UI.prompt('Nama tagihan');
      if (name === null) return;
      const dueStr = await window.UI.prompt('Tanggal jatuh tempo');
      if (dueStr === null) return;
      const dueDay = Number(dueStr);
      const amountStr = await window.UI.prompt('Jumlah tagihan');
      if (amountStr === null) return;
      const amount = Number(amountStr);
      if (name && !Number.isNaN(dueDay) && !Number.isNaN(amount) && onAddBill) {
        onAddBill({ name, due_day: dueDay, amount, status:'unpaid', month: '' });
      }
    })();
  };

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
          const soon = !paidB && b.due_day - 4 <= 6;
          return (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 10px', borderBottom: i===sorted.length-1?'none':'1px solid var(--border-2)' }}>
              <window.CatIcon cat={b.name} size={40} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{b.name}</div>
                <div style={{ fontSize:11.5, color: soon?'var(--spending)':'var(--text-3)', marginTop:2, fontWeight: soon?700:500 }}>
                  Jatuh tempo tgl {b.due_day}{soon?' · segera':''}
                </div>
              </div>
              <div className="num" style={{ fontSize:13.5, fontWeight:800, color:'var(--text)' }}>{m(formatRp(b.amount))}</div>
              <window.Button variant="ghost" onClick={()=>onToggleBill?.(b)} aria-label="toggle" style={{
                borderRadius:99, padding:'5px 11px', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', gap:4,
                background: paidB ? 'var(--income-soft)' : 'var(--surface-3)',
                color: paidB ? 'var(--income)' : 'var(--text-3)', transition:'all .2s',
              }}>
                {paidB && <Icon name="check" size={13} stroke={3} />}{paidB?'Lunas':'Bayar'}
              </window.Button>
              <window.IconButton onClick={()=>onDeleteBill?.(b.id)} icon="trash" ariaLabel="Hapus Tagihan" style={{ background:'var(--surface)', color:'var(--spending)' }} />
            </div>
          );
        })}
      </window.Card>
      <window.Button variant="ghost" onClick={handleAdd} style={{ width:'100%', justifyContent:'center' }}><Icon name="plus" size={18} stroke={2.4} />Tambah Tagihan</window.Button>
    </div>
  );
}

function DebtTab({ hidden, debts, onAddDebt, onUpdateDebt, onDeleteDebt }) {
  const total = debts.reduce((s,d)=>s+d.total,0);
  const paid = debts.reduce((s,d)=>s+d.paid,0);
  const m = v => hidden ? '••••' : v;

  const handleAdd = () => {
    (async () => {
      const name = await window.UI.prompt('Nama utang');
      if (name === null) return;
      const totalStr = await window.UI.prompt('Total utang');
      if (totalStr === null) return;
      const total = Number(totalStr);
      if (name && !Number.isNaN(total) && onAddDebt) {
        onAddDebt({ name, total, paid: 0, icon:'hand' });
      }
    })();
  };

  function DebtItem({ d }) {
    const [input, setInput] = React.useState('');
    const pct = d.total ? Math.round(d.paid/d.total*100) : 0;
    const m = v => hidden ? '••••' : v;
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
        <ProgressBar pct={pct} color="var(--goals)" delay={0} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
          <span className="num" style={{ fontSize:12, color:'var(--text-3)' }}>Terbayar <b style={{color:'var(--income)'}}>{m(formatRp(d.paid))}</b></span>
          <span className="num" style={{ fontSize:12, color:'var(--text-3)' }}>Sisa <b style={{color:'var(--text)'}}>{m(formatRp(d.total-d.paid))}</b></span>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:14, alignItems:'center' }}>
          <input value={input} onChange={e=>setInput(e.target.value.replace(/[^0-9]/g,''))} placeholder='Nominal bayar' 
            style={{ flex:1, height:44, padding:'0 12px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface-2)', fontFamily:'inherit' }} />
          <window.Button variant="primary" onClick={() => {
            const val = Number(input);
            const amount = Math.round(val);
            const payment = Math.min(amount, d.total - d.paid);
            if (!Number.isNaN(payment) && payment > 0) {
              const newPaid = d.paid + payment;
              onUpdateDebt?.(d.id, newPaid, payment);
              setInput('');
            }
          }} style={{ minWidth:120, padding:'11px 14px' }}><Icon name="wallet" size={16} stroke={2.2} />Bayar</window.Button>
          <window.IconButton onClick={()=>onDeleteDebt?.(d.id)} icon="trash" ariaLabel="Hapus Utang" style={{ background:'var(--spending-soft)', color:'var(--spending)' }} />
        </div>
      </window.Card>
    );
  }

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <SummaryStrip items={[
        { label:'Total Utang', value:m(formatRp(total)) },
        { label:'Terbayar', value:m(formatRp(paid)), color:'var(--income)' },
        { label:'Sisa', value:m(formatRp(total-paid)), color:'var(--spending)' },
      ]} />
      {debts.map((d)=> (
        <DebtItem key={d.id} d={d} />
      ))}
      <window.Button variant="ghost" onClick={handleAdd} style={{ width:'100%', justifyContent:'center' }}><Icon name="plus" size={18} stroke={2.4} />Tambah Utang</window.Button>
    </div>
  );
}

function GoalsTab({ hidden, goals, onAddGoal, onUpdateGoal, onDeleteGoal }) {
  const [celebrate, setCelebrate] = React.useState(null);
  const m = v => hidden ? '••••' : v;

  function addFunds(g) {
    const step = g.unit==='gr' ? 1 : Math.round(g.target * 0.2);
    const next = Math.min(g.progress + step, g.target);
    onUpdateGoal?.(g.id, next);
    if (next >= g.target && g.progress < g.target) setCelebrate(g.name);
  }

  const handleAdd = () => {
    (async () => {
      const name = await window.UI.prompt('Nama goal');
      if (name === null) return;
      const targetStr = await window.UI.prompt('Target nominal');
      if (targetStr === null) return;
      const target = Number(targetStr);
      if (name && !Number.isNaN(target) && onAddGoal) {
        onAddGoal({ name, target, progress: 0, icon:'flag', unit:'rp' });
      }
    })();
  };

  return (
    <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {goals.map((g,i)=>{
        const pct = g.target ? Math.round(g.progress/g.target*100) : 0;
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
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              {!done && <window.Button variant="primary" onClick={()=>addFunds(g)} style={{ flex:1, background:'var(--goals-soft)', color:'var(--goals)' }}><Icon name="plus" size={16} stroke={2.4} />Tambah Dana</window.Button>}
              <window.IconButton onClick={()=>onDeleteGoal?.(g.id)} icon="trash" ariaLabel="Hapus Goal" style={{ background:'var(--spending-soft)', color:'var(--spending)' }} />
            </div>
          </window.Card>
        );
      })}
      <window.Button variant="ghost" onClick={handleAdd} style={{ width:'100%', justifyContent:'center' }}><Icon name="plus" size={18} stroke={2.4} />Tambah Goal</window.Button>

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

window.Anggaran = Anggaran;

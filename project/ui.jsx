// ui.jsx — shared UI primitives used across screens.

const { catMeta } = window.DATA;

// Card surface
function Card({ children, style, className = '', onClick, pad = 16, ...rest }) {
  return (
    <div
      onClick={onClick}
      className={`${className} ${onClick ? 'press' : ''}`}
      style={{
        background:'var(--surface)', borderRadius:20, padding:pad,
        border:'1px solid var(--border)', boxShadow:'var(--shadow-card)',
        cursor:onClick?'pointer':'default', ...style,
      }}
      {...rest}
    >{children}</div>
  );
}

// Category icon chip (colored circle)
function CatIcon({ cat, size = 42, icon, color }) {
  const m = cat ? catMeta(cat) : { icon, color };
  const ic = icon || m.icon;
  const cl = color || m.color;
  const r = size * 0.42;
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.32, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:`color-mix(in srgb, ${cl} 14%, var(--surface))`,
      color:cl,
    }}>
      <Icon name={ic} size={r} stroke={2.1} />
    </div>
  );
}

// Section header with optional action
function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'0 2px' }}>
      <h3 style={{ margin:0, fontSize:15.5, fontWeight:700, color:'var(--text)', letterSpacing:-0.2 }}>{title}</h3>
      {action && (
        <button onClick={onAction} className="press" style={{
          border:'none', background:'none', color:'var(--accent)', fontSize:13, fontWeight:700,
          cursor:'pointer', display:'flex', alignItems:'center', gap:2, padding:4, margin:-4, fontFamily:'inherit',
        }}>{action}<Icon name="chevR" size={15} stroke={2.4} /></button>
      )}
    </div>
  );
}

// Pill / chip
function Chip({ children, active, color = 'var(--accent)', onClick, icon }) {
  return (
    <button onClick={onClick} className="press" style={{
      display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
      padding:'8px 14px', borderRadius:99, fontSize:13, fontWeight:600, fontFamily:'inherit', cursor:'pointer',
      border:'1px solid', flexShrink:0,
      borderColor: active ? 'transparent' : 'var(--border)',
      background: active ? color : 'var(--surface)',
      color: active ? '#fff' : 'var(--text-2)',
      transition:'all .18s ease',
    }}>
      {icon && <Icon name={icon} size={15} stroke={2.2} />}
      {children}
    </button>
  );
}

// Segmented control (sub-tabs)
function Segmented({ items, value, onChange }) {
  return (
    <div style={{
      display:'flex', gap:4, background:'var(--surface-2)', borderRadius:14, padding:4,
      border:'1px solid var(--border)',
    }}>
      {items.map(it => {
        const k = typeof it === 'string' ? it : it.key;
        const label = typeof it === 'string' ? it : it.label;
        const active = value === k;
        return (
          <button key={k} onClick={()=>onChange(k)} className="press" style={{
            flex:1, padding:'8px 6px', borderRadius:10, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:13, fontWeight:700,
            background: active ? 'var(--surface)' : 'transparent',
            color: active ? 'var(--text)' : 'var(--text-3)',
            boxShadow: active ? 'var(--shadow-sm)' : 'none',
            transition:'all .2s ease',
          }}>{label}</button>
        );
      })}
    </div>
  );
}

// Month selector
function MonthSelector({ label = 'Juni 2026', onPrev, onNext, light = false }) {
  const fg = light ? 'rgba(255,255,255,0.92)' : 'var(--text)';
  const bg = light ? 'rgba(255,255,255,0.16)' : 'var(--surface)';
  const bd = light ? 'rgba(255,255,255,0.18)' : 'var(--border)';
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:2, background:bg, borderRadius:99,
      border:`1px solid ${bd}`, padding:'3px 4px',
      backdropFilter: light ? 'blur(8px)' : 'none',
    }}>
      <button onClick={onPrev} className="press" style={{ border:'none', background:'none', cursor:'pointer', padding:5, display:'flex', color:fg, borderRadius:99 }}>
        <Icon name="chevL" size={16} stroke={2.4} />
      </button>
      <span style={{ fontSize:13, fontWeight:700, color:fg, minWidth:78, textAlign:'center' }}>{label}</span>
      <button onClick={onNext} className="press" style={{ border:'none', background:'none', cursor:'pointer', padding:5, display:'flex', color:fg, borderRadius:99 }}>
        <Icon name="chevR" size={16} stroke={2.4} />
      </button>
    </div>
  );
}

// Stat tile (2x2 grid card)
function StatTile({ icon, label, value, varName, delay = 0 }) {
  return (
    <div className="lift" style={{
      background:'var(--surface)', borderRadius:18, padding:14,
      border:'1px solid var(--border)', boxShadow:'var(--shadow-card)',
      animation:'fadeUp .5s both', animationDelay:`${delay}s`,
    }}>
      <div style={{
        width:34, height:34, borderRadius:10, marginBottom:10,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:`var(${varName}-soft)`, color:`var(${varName})`,
      }}>
        <Icon name={icon} size={18} stroke={2.2} />
      </div>
      <div style={{ fontSize:11.5, color:'var(--text-3)', fontWeight:600, marginBottom:3 }}>{label}</div>
      <div className="num" style={{ fontSize:16.5, fontWeight:800, color:'var(--text)', letterSpacing:-0.3 }}>{value}</div>
    </div>
  );
}

// Empty state
function EmptyState({ icon = 'inbox', title, body }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'48px 30px', animation:'fadeIn .4s both' }}>
      <div style={{ width:70, height:70, borderRadius:22, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', marginBottom:16 }}>
        <Icon name={icon} size={32} stroke={1.8} />
      </div>
      <div style={{ fontSize:15.5, fontWeight:700, color:'var(--text)', marginBottom:5 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--text-3)', maxWidth:240, lineHeight:1.5 }}>{body}</div>
    </div>
  );
}

// Bottom sheet wrapper
function Sheet({ open, onClose, children, height = 'auto', full = false }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0, zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end',
      background:'rgba(8,8,12,0.42)', animation:'fadeIn .22s ease', backdropFilter:'blur(2px)',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--surface)', borderTopLeftRadius:28, borderTopRightRadius:28,
        boxShadow:'var(--shadow-pop)', maxHeight: full ? '94%' : '88%', height,
        display:'flex', flexDirection:'column', overflow:'hidden',
        animation:'sheetUp .34s cubic-bezier(.2,.85,.3,1)',
      }}>
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10, flexShrink:0 }}>
          <div style={{ width:40, height:5, borderRadius:99, background:'var(--surface-3)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// Type badge
function TypeBadge({ type }) {
  const m = window.DATA.TYPE_META[type] || window.DATA.TYPE_META.spending;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99,
      fontSize:11.5, fontWeight:700,
      background:`var(${m.cssVar}-soft)`, color:`var(${m.cssVar})`,
    }}>{m.label}</span>
  );
}

Object.assign(window, { Card, CatIcon, SectionHead, Chip, Segmented, MonthSelector, StatTile, EmptyState, Sheet, TypeBadge });

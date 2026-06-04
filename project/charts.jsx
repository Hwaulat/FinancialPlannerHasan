// charts.jsx — lightweight SVG charts (donut, horizontal bars, line, rings).

const { formatRpShort } = window.DATA;

// ── Donut ────────────────────────────────────────────────────
function Donut({ segments, size = 160, stroke = 22, centerTop, centerMain, centerSub, animate = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = frac * c;
          const off = acc * c;
          acc += frac;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${Math.max(len - 3, 0)} ${c}`}
              strokeDashoffset={-off}
              style={animate ? { transition: 'stroke-dasharray .9s cubic-bezier(.3,.9,.3,1)', transitionDelay: `${i*0.1}s` } : undefined}
            />
          );
        })}
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        {centerTop && <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, letterSpacing:.2 }}>{centerTop}</div>}
        {centerMain && <div className="num" style={{ fontSize:21, fontWeight:800, color:'var(--text)', marginTop:1 }}>{centerMain}</div>}
        {centerSub && <div style={{ fontSize:10.5, color:'var(--text-3)', marginTop:1 }}>{centerSub}</div>}
      </div>
    </div>
  );
}

// ── Horizontal bars ──────────────────────────────────────────
function BarsH({ rows, format = formatRpShort }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{r.label}</span>
            <span className="num" style={{ fontSize:12.5, fontWeight:700, color:'var(--text-2)' }}>{format(r.value)}</span>
          </div>
          <div style={{ height:9, borderRadius:99, background:'var(--surface-3)', overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${(r.value/max)*100}%`, borderRadius:99,
              background:r.color, transformOrigin:'left',
              animation:'growBar .8s cubic-bezier(.3,.9,.3,1) forwards', animationDelay:`${i*0.06}s`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Progress bar (budget/debt) ───────────────────────────────
function ProgressBar({ pct, color, height = 9, track = 'var(--surface-3)', delay = 0 }) {
  const w = Math.min(pct, 100);
  return (
    <div style={{ height, borderRadius:99, background:track, overflow:'hidden' }}>
      <div style={{
        height:'100%', width:`${w}%`, borderRadius:99, background:color, transformOrigin:'left',
        animation:'growBar .8s cubic-bezier(.3,.9,.3,1) forwards', animationDelay:`${delay}s`,
      }} />
    </div>
  );
}

// ── Circular progress ring ───────────────────────────────────
function Ring({ pct, size = 64, stroke = 7, color = 'var(--goals)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition:'stroke-dashoffset 1s cubic-bezier(.3,.9,.3,1)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {children}
      </div>
    </div>
  );
}

// ── Multi-series line chart (yearly trend) ───────────────────
function LineChart({ data, series, width = 330, height = 150, format = formatRpShort }) {
  const pad = { l: 6, r: 6, t: 14, b: 22 };
  const W = width, H = height;
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const active = data.filter(d => series.some(s => d[s.key] !== 0));
  const allVals = active.flatMap(d => series.map(s => d[s.key]));
  const maxV = Math.max(...allVals, 1);
  const minV = Math.min(...allVals, 0);
  const range = maxV - minV || 1;
  const n = data.length;
  const x = i => pad.l + (innerW * i) / (n - 1);
  const y = v => pad.t + innerH - ((v - minV) / range) * innerH;
  const zeroY = y(0);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block', overflow:'visible' }}>
      {[0,0.5,1].map((g,i)=>(
        <line key={i} x1={pad.l} x2={W-pad.r} y1={pad.t+innerH*g} y2={pad.t+innerH*g}
          stroke="var(--border)" strokeWidth="1" strokeDasharray={g===1?'0':'3 4'} />
      ))}
      {minV < 0 && <line x1={pad.l} x2={W-pad.r} y1={zeroY} y2={zeroY} stroke="var(--border)" strokeWidth="1" />}
      {series.map((s, si) => {
        const pts = active.map((d) => {
          const idx = data.indexOf(d);
          return [x(idx), y(d[s.key])];
        });
        const path = pts.map((p, i) => `${i===0?'M':'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        return (
          <g key={s.key}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="var(--surface)" stroke={s.color} strokeWidth="2" />)}
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H-6} fontSize="9.5" fill="var(--text-3)" textAnchor="middle"
          fontFamily="var(--font)" fontWeight="600">{d.m}</text>
      ))}
      <style>{`@keyframes draw{to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

window.Charts = { Donut, BarsH, ProgressBar, Ring, LineChart };

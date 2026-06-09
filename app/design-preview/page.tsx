'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Theme types ──────────────────────────────────────────────────────────────
type Theme = 'nexus' | 'aurora' | 'terra'

// ─── Nexus Theme – Comando Táctico ────────────────────────────────────────────
function NexusTheme() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1200); return () => clearInterval(i) }, [])

  return (
    <div style={{ fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif", background: '#020B14', color: '#E0F7FF', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
        .nx-glow { box-shadow: 0 0 20px rgba(0,230,255,0.3), 0 0 60px rgba(0,230,255,0.1); }
        .nx-border { border: 1px solid rgba(0,230,255,0.25); }
        .nx-grid { background-image: linear-gradient(rgba(0,230,255,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,230,255,0.04) 1px,transparent 1px); background-size: 40px 40px; }
        .nx-scan::after { content:''; position:absolute; inset:0; background: linear-gradient(transparent 50%, rgba(0,230,255,0.015) 50%); background-size: 100% 4px; pointer-events:none; }
        .nx-tag { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #00E5FF; letter-spacing: 2px; }
        .nx-stat:hover { background: rgba(0,230,255,0.08); transform: translateY(-3px); }
        .nx-btn { background: transparent; border: 1px solid #00E5FF; color: #00E5FF; padding: 12px 32px; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; letter-spacing:3px; cursor:pointer; transition:all .2s; text-transform:uppercase; }
        .nx-btn:hover { background: #00E5FF; color: #020B14; box-shadow: 0 0 30px rgba(0,230,255,0.5); }
        .nx-btn-solid { background: #00E5FF; color: #020B14; border: 1px solid #00E5FF; padding: 12px 32px; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; letter-spacing:3px; cursor:pointer; transition:all .2s; text-transform:uppercase; }
        .nx-btn-solid:hover { box-shadow: 0 0 40px rgba(0,230,255,0.6); transform: translateY(-2px); }
        .blink { animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .radar { animation: radarSpin 8s linear infinite; transform-origin: center; }
        @keyframes radarSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .pulse-ring { animation: pulseRing 3s ease-out infinite; }
        @keyframes pulseRing { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(2);opacity:0} }
        .data-stream { animation: dataStream 20s linear infinite; }
        @keyframes dataStream { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
      `}</style>

      {/* Grid background */}
      <div className="nx-grid nx-scan" style={{ position:'absolute', inset:0, opacity:1 }} />

      {/* Data stream columns */}
      {[15, 85].map((left, i) => (
        <div key={i} style={{ position:'absolute', top:0, left:`${left}%`, width:1, height:'100%', overflow:'hidden', opacity:0.3 }}>
          <div className="data-stream" style={{ fontSize:9, fontFamily:'monospace', color:'#00E5FF', lineHeight:'20px', animationDelay:`${i*3}s` }}>
            {Array.from({length:60}).map((_,j) => <div key={j}>{Math.random().toString(36).slice(2,4).toUpperCase()}</div>)}
          </div>
        </div>
      ))}

      {/* Radar decoration */}
      <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, opacity:0.06 }}>
        <svg viewBox="0 0 400 400" width="400" height="400">
          {[160,120,80,40].map(r => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#00E5FF" strokeWidth="1"/>)}
          <line x1="200" y1="40" x2="200" y2="360" stroke="#00E5FF" strokeWidth="0.5"/>
          <line x1="40" y1="200" x2="360" y2="200" stroke="#00E5FF" strokeWidth="0.5"/>
          <g className="radar">
            <path d="M200 200 L200 40 A160 160 0 0 1 360 200 Z" fill="rgba(0,230,255,0.15)"/>
          </g>
        </svg>
      </div>

      {/* NAV */}
      <nav style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 60px', borderBottom:'1px solid rgba(0,230,255,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, border:'1px solid #00E5FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2"><path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:16, letterSpacing:3, color:'#E0F7FF', textTransform:'uppercase' }}>JIMMY ACADEMY</div>
            <div className="nx-tag">SST PLATFORM · COL-2026</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:32 }}>
          {['Sistema', 'Módulos', 'Reportes', 'IA'].map(item => (
            <span key={item} className="nx-tag" style={{ cursor:'pointer', opacity:.7 }}>{item}</span>
          ))}
        </div>
        <button className="nx-btn-solid" style={{ fontSize:11 }}>INICIAR SESIÓN</button>
      </nav>

      {/* HERO */}
      <div style={{ position:'relative', zIndex:5, padding:'80px 60px 60px', maxWidth:1100, margin:'0 auto' }}>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1}}>
          <div className="nx-tag" style={{ marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span className="blink" style={{ width:6, height:6, background:'#00E5FF', display:'inline-block', borderRadius:'50%' }}/>
            SISTEMA ACTIVO · PROTOCOLO SG-SST COLOMBIA · NORMATIVA VIGENTE
          </div>
          <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'clamp(52px,7vw,96px)', lineHeight:.9, letterSpacing:-2, textTransform:'uppercase', margin:'0 0 24px' }}>
            <span style={{ color:'#E0F7FF' }}>GESTIÓN</span><br/>
            <span style={{ color:'#00E5FF', textShadow:'0 0 40px rgba(0,230,255,0.6)' }}>INTEGRAL</span><br/>
            <span style={{ color:'#E0F7FF' }}>SG-SST</span>
          </h1>
          <p style={{ fontFamily:'Rajdhani', fontSize:18, color:'rgba(224,247,255,0.55)', maxWidth:520, lineHeight:1.6, marginBottom:40 }}>
            Plataforma de comando para seguridad y salud en el trabajo. Control total del cumplimiento normativo colombiano en tiempo real.
          </p>
          <div style={{ display:'flex', gap:16 }}>
            <button className="nx-btn-solid">ACCEDER AL SISTEMA</button>
            <button className="nx-btn">VER DEMO</button>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, marginTop:80, border:'1px solid rgba(0,230,255,0.12)' }}>
          {[
            { v:'1,248', l:'EMPLEADOS ACTIVOS', c:'#00E5FF' },
            { v:'94.2%', l:'CUMPLIMIENTO SST', c:'#39FF14' },
            { v:'3,891', l:'CERTIFICADOS', c:'#00E5FF' },
            { v:'47', l:'PENDIENTES', c:'#FF6B35' },
          ].map(({ v, l, c }, i) => (
            <motion.div key={l} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3+i*.1}}
              className="nx-stat"
              style={{ padding:'32px 24px', borderRight: i<3 ? '1px solid rgba(0,230,255,0.12)' : 'none', transition:'all .2s', cursor:'default' }}>
              <div className="nx-tag" style={{ marginBottom:8 }}>MÓDULO {String(i+1).padStart(2,'0')}</div>
              <div style={{ fontFamily:'Share Tech Mono', fontSize:36, color:c, letterSpacing:2, textShadow:`0 0 20px ${c}66` }}>{v}</div>
              <div style={{ fontFamily:'Rajdhani', fontSize:11, letterSpacing:2, color:'rgba(224,247,255,0.4)', marginTop:4 }}>{l}</div>
            </motion.div>
          ))}
        </div>

        {/* Module cards */}
        <div style={{ marginTop:1, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1 }}>
          {[
            { icon:'👥', name:'USUARIOS', tag:'CONTROL DE ACCESO', active:true },
            { icon:'📋', name:'CAPACITACIONES', tag:'IA GENERATIVA', active:false },
            { icon:'🏆', name:'CERTIFICADOS', tag:'EMISIÓN AUTOMÁTICA', active:false },
          ].map(({ icon, name, tag, active }, i) => (
            <motion.div key={name} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5+i*.1}}
              style={{ padding:'24px', borderRight: i<2 ? '1px solid rgba(0,230,255,0.12)' : 'none', borderTop:'1px solid rgba(0,230,255,0.12)', background: active ? 'rgba(0,230,255,0.04)' : 'transparent', cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(0,230,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background=active?'rgba(0,230,255,0.04)':'transparent')}>
              <div style={{ fontSize:24, marginBottom:12 }}>{icon}</div>
              <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:14, letterSpacing:3 }}>{name}</div>
              <div className="nx-tag" style={{ marginTop:4, opacity:.6 }}>{tag}</div>
              {active && <div style={{ marginTop:16, width:24, height:2, background:'#00E5FF' }}/>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Aurora Theme – Luxury Premium ────────────────────────────────────────────
function AuroraTheme() {
  return (
    <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", background:'#04020F', color:'#F0EEFF', minHeight:'100vh', position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .au-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); transition: all .3s; }
        .au-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(180,130,255,0.3); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(120,50,255,0.15); }
        .au-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(180,130,255,0.1); border:1px solid rgba(180,130,255,0.25); border-radius:100px; padding:6px 16px; font-family:'DM Sans',sans-serif; font-size:11px; color:#C4A8FF; letter-spacing:1px; }
        .au-btn-primary { background: linear-gradient(135deg,#7C3AED,#EC4899); border:none; color:white; padding:14px 36px; border-radius:100px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:all .3s; }
        .au-btn-primary:hover { transform:translateY(-2px); box-shadow:0 20px 50px rgba(124,58,237,0.5); }
        .au-btn-ghost { background:transparent; border:1px solid rgba(255,255,255,0.15); color:rgba(255,255,255,0.7); padding:14px 36px; border-radius:100px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .3s; }
        .au-btn-ghost:hover { border-color:rgba(180,130,255,0.5); color:#F0EEFF; }
        .au-label { font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:rgba(180,130,255,0.7); }
        .au-body { font-family:'DM Sans',sans-serif; }
        .float1 { animation: float1 8s ease-in-out infinite; }
        .float2 { animation: float2 11s ease-in-out infinite; }
        .float3 { animation: float3 14s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,10px) scale(0.95)} 66%{transform:translate(-10px,-20px) scale(1.02)} }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); background-size:200% 100%; animation: shimmer 3s infinite; }
        @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }
      `}</style>

      {/* Aurora orbs */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div className="float1" style={{ position:'absolute', top:'-10%', left:'15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.35) 0%,transparent 70%)', filter:'blur(60px)' }}/>
        <div className="float2" style={{ position:'absolute', top:'20%', right:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,0.25) 0%,transparent 70%)', filter:'blur(50px)' }}/>
        <div className="float3" style={{ position:'absolute', bottom:'10%', left:'30%', width:600, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,182,212,0.2) 0%,transparent 70%)', filter:'blur(70px)' }}/>
        <div style={{ position:'absolute', top:'5%', right:'20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(52,211,153,0.15) 0%,transparent 70%)', filter:'blur(40px)' }}/>
      </div>

      {/* Noise texture */}
      <div style={{ position:'absolute', inset:0, opacity:.03, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat:'repeat' }}/>

      {/* NAV */}
      <nav style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 72px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#7C3AED,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(124,58,237,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 17l9 5 9-5M3 12l9 5 9-5" opacity=".6"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:'Cormorant Garamond', fontWeight:700, fontSize:18, letterSpacing:1 }}>Jimmy Academy</div>
            <div className="au-label" style={{ fontSize:9 }}>SST · Colombia</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:36 }} className="au-body">
          {['Plataforma','Capacitaciones','Certificados','IA SST'].map(item => (
            <span key={item} style={{ fontSize:13, color:'rgba(240,238,255,0.55)', cursor:'pointer', transition:'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color='#F0EEFF')}
              onMouseLeave={e => (e.currentTarget.style.color='rgba(240,238,255,0.55)')}>{item}</span>
          ))}
        </div>
        <button className="au-btn-primary" style={{ padding:'10px 24px', fontSize:12 }}>Ingresar</button>
      </nav>

      {/* HERO */}
      <div style={{ position:'relative', zIndex:5, padding:'60px 72px 80px', maxWidth:1200, margin:'0 auto' }}>
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:1, ease:'easeOut'}}>
          <div className="au-pill" style={{ marginBottom:28 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#A78BFA', display:'inline-block' }}/>
            La plataforma #1 para SG-SST en Colombia
          </div>

          <h1 style={{ fontFamily:'Cormorant Garamond', fontWeight:700, fontSize:'clamp(56px,6.5vw,92px)', lineHeight:1, letterSpacing:-1, margin:'0 0 28px', maxWidth:800 }}>
            Seguridad laboral<br/>
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#A78BFA,#EC4899,#67E8F9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              redefinida
            </em>{' '}para<br/>
            Colombia
          </h1>

          <p className="au-body" style={{ fontSize:16, color:'rgba(240,238,255,0.5)', maxWidth:480, lineHeight:1.8, marginBottom:44 }}>
            Decreto 1072 · Resolución 0312 · Gestión inteligente de capacitaciones, certificados y cumplimiento normativo en una sola plataforma.
          </p>

          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <button className="au-btn-primary">Comenzar gratis</button>
            <button className="au-btn-ghost">Ver demostración →</button>
          </div>

          {/* Floating trust badge */}
          <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{delay:.6}}
            style={{ display:'inline-flex', alignItems:'center', gap:12, marginTop:48, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:100, padding:'10px 20px 10px 10px' }}>
            <div style={{ display:'flex' }}>
              {['#7C3AED','#EC4899','#06B6D4','#10B981'].map((c,i) => (
                <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:c, border:'2px solid #04020F', marginLeft: i>0 ? -8 : 0 }}/>
              ))}
            </div>
            <span className="au-body" style={{ fontSize:12, color:'rgba(240,238,255,0.6)' }}>+1,200 empresas confían en nosotros</span>
          </motion.div>
        </motion.div>

        {/* Stats cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginTop:72 }}>
          {[
            { v:'94.2%', l:'Cumplimiento SST', icon:'📈', grad:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(236,72,153,0.1))' },
            { v:'3,891', l:'Certificados emitidos', icon:'🏆', grad:'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(16,185,129,0.1))' },
            { v:'1,248', l:'Empleados capacitados', icon:'👥', grad:'linear-gradient(135deg,rgba(236,72,153,0.12),rgba(124,58,237,0.1))' },
            { v:'12', l:'Cursos con IA activos', icon:'🤖', grad:'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.1))' },
          ].map(({ v, l, icon, grad }, i) => (
            <motion.div key={l} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4+i*.1}}
              className="au-card" style={{ borderRadius:20, padding:'28px 24px', background:grad }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
              <div style={{ fontFamily:'Cormorant Garamond', fontWeight:700, fontSize:40, lineHeight:1, marginBottom:6 }}>{v}</div>
              <div className="au-body" style={{ fontSize:12, color:'rgba(240,238,255,0.45)', letterSpacing:.5 }}>{l}</div>
            </motion.div>
          ))}
        </div>

        {/* Feature showcase */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginTop:16 }}>
          <div className="au-card shimmer" style={{ borderRadius:20, padding:'36px', background:'rgba(124,58,237,0.06)' }}>
            <div className="au-label" style={{ marginBottom:16 }}>✦ Inteligencia Artificial SST</div>
            <h3 style={{ fontFamily:'Cormorant Garamond', fontWeight:700, fontSize:32, lineHeight:1.1, marginBottom:12 }}>
              Capacitaciones generadas<br/>
              <em style={{ fontStyle:'italic', color:'#A78BFA' }}>automáticamente</em> con IA
            </h3>
            <p className="au-body" style={{ fontSize:13, color:'rgba(240,238,255,0.45)', lineHeight:1.7 }}>
              Sube cualquier documento normativo y nuestra IA genera diapositivas profesionales, evaluaciones y certificados en segundos.
            </p>
          </div>
          <div className="au-card" style={{ borderRadius:20, padding:'36px', background:'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(16,185,129,0.05))' }}>
            <div className="au-label" style={{ marginBottom:16 }}>✦ Certificados Digitales</div>
            <div style={{ fontFamily:'Cormorant Garamond', fontWeight:700, fontSize:52, lineHeight:1, color:'#67E8F9' }}>100%</div>
            <div className="au-body" style={{ fontSize:12, color:'rgba(240,238,255,0.45)', marginTop:8 }}>Válidos legalmente bajo Decreto 1072/2015</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Terra Theme – Editorial Cálido ──────────────────────────────────────────
function TerraTheme() {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", background:'#0A0500', color:'#F5F0E8', minHeight:'100vh', position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');
        .tr-card { background:rgba(255,200,50,0.04); border:1px solid rgba(255,200,50,0.1); border-radius:16px; transition:all .3s; }
        .tr-card:hover { background:rgba(255,200,50,0.07); border-color:rgba(255,200,50,0.25); transform:translateY(-4px); }
        .tr-tag { display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#F59E0B; }
        .tr-btn { background:linear-gradient(135deg,#F59E0B,#EF4444); border:none; color:white; padding:14px 36px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; transition:all .3s; letter-spacing:.5px; }
        .tr-btn:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(245,158,11,0.35); }
        .tr-btn-outline { background:transparent; border:2px solid rgba(245,158,11,0.3); color:rgba(245,158,11,0.8); padding:14px 36px; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; transition:all .3s; }
        .tr-btn-outline:hover { border-color:#F59E0B; color:#F59E0B; }
        .tr-display { font-family:'Fraunces',serif; }
        .tr-number { font-family:'Fraunces',serif; font-weight:900; }
        .glow-amber { box-shadow:0 0 80px rgba(245,158,11,0.15); }
        .marquee-track { display:flex; gap:48px; animation:marquee 20s linear infinite; white-space:nowrap; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .tr-divider { width:40px; height:3px; background:linear-gradient(90deg,#F59E0B,#EF4444); border-radius:4px; }
      `}</style>

      {/* Background texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse 100% 60% at 50% -10%,rgba(245,158,11,0.12) 0%,transparent 60%), radial-gradient(ellipse 60% 80% at 90% 50%,rgba(239,68,68,0.08) 0%,transparent 60%)', pointerEvents:'none' }}/>

      {/* Decorative circles */}
      <div style={{ position:'absolute', top:-200, right:-200, width:600, height:600, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.06)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:-150, right:-150, width:400, height:400, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.08)', pointerEvents:'none' }}/>

      {/* NAV */}
      <nav style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 64px', borderBottom:'1px solid rgba(245,158,11,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#F59E0B,#EF4444)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 17l9 5 9-5M3 12l9 5 9-5"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:'Fraunces', fontWeight:700, fontSize:17, letterSpacing:.5 }}>Jimmy Academy</div>
            <div style={{ fontSize:10, color:'rgba(245,158,11,0.6)', letterSpacing:2, fontWeight:600, textTransform:'uppercase' }}>SST Colombia</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:32 }}>
          {['Plataforma','Módulos','Normativa','Precios'].map(item => (
            <span key={item} style={{ fontSize:13, fontWeight:500, color:'rgba(245,240,232,0.5)', cursor:'pointer', transition:'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color='#F5F0E8')}
              onMouseLeave={e => (e.currentTarget.style.color='rgba(245,240,232,0.5)')}>{item}</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button className="tr-btn-outline" style={{ padding:'9px 20px', fontSize:12 }}>Ingresar</button>
          <button className="tr-btn" style={{ padding:'9px 20px', fontSize:12 }}>Comenzar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position:'relative', zIndex:5, padding:'72px 64px 0', maxWidth:1200, margin:'0 auto' }}>

        {/* Label */}
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:.6}}
          style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <div className="tr-divider"/>
          <span className="tr-tag">La plataforma líder en SG-SST · Colombia 2026</span>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'start' }}>
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.8}}>
            <h1 className="tr-display" style={{ fontSize:'clamp(52px,5.5vw,80px)', fontWeight:900, lineHeight:.95, margin:'0 0 28px', letterSpacing:-2 }}>
              Cumplimiento<br/>
              <span style={{ color:'#F59E0B' }}>SST</span> total<br/>
              sin fricciones
            </h1>
            <p style={{ fontSize:16, color:'rgba(245,240,232,0.5)', lineHeight:1.8, maxWidth:440, marginBottom:40 }}>
              Gestiona capacitaciones, certificados y cumplimiento del Decreto 1072 de 2015 con inteligencia artificial. Para empresas colombianas.
            </p>
            <div style={{ display:'flex', gap:16, marginBottom:48 }}>
              <button className="tr-btn">Empezar ahora →</button>
              <button className="tr-btn-outline">Ver la plataforma</button>
            </div>
            <div style={{ display:'flex', gap:40 }}>
              {[{ v:'1.2K+', l:'Empresas' }, { v:'98%', l:'Satisfacción' }, { v:'50K+', l:'Certificados' }].map(({ v, l }) => (
                <div key={l}>
                  <div className="tr-number" style={{ fontSize:32, color:'#F59E0B', lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:11, color:'rgba(245,240,232,0.4)', marginTop:4, fontWeight:500, letterSpacing:1 }}>{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{duration:.8, delay:.2}}>
            <div className="tr-card glow-amber" style={{ padding:'32px' }}>
              <div className="tr-tag" style={{ marginBottom:20 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#F59E0B', display:'inline-block' }}/>
                Panel en vivo
              </div>
              {[
                { label:'Cumplimiento general', v:94, color:'#F59E0B' },
                { label:'Capacitaciones al día', v:87, color:'#10B981' },
                { label:'Certificados vigentes', v:96, color:'#3B82F6' },
                { label:'Firmas completadas', v:78, color:'#EF4444' },
              ].map(({ label, v, color }) => (
                <div key={label} style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, fontWeight:500, color:'rgba(245,240,232,0.6)' }}>
                    <span>{label}</span>
                    <span style={{ color, fontWeight:700 }}>{v}%</span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' }}>
                    <motion.div initial={{width:0}} animate={{width:`${v}%`}} transition={{duration:1.5, delay:.5, ease:'easeOut'}}
                      style={{ height:'100%', background:color, borderRadius:100, boxShadow:`0 0 10px ${color}66` }}/>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(245,158,11,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'rgba(245,240,232,0.35)', fontWeight:500 }}>PRÓXIMA AUDITORÍA</span>
                <span style={{ fontFamily:'Fraunces', fontWeight:700, fontSize:18, color:'#F59E0B' }}>28 Ene 2026</span>
              </div>
            </div>

            {/* Modules row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:12 }}>
              {[
                { icon:'🎓', name:'Capacitaciones IA' },
                { icon:'📜', name:'Certificados' },
                { icon:'✍️', name:'Firmas Dig.' },
              ].map(({ icon, name }) => (
                <div key={name} className="tr-card" style={{ padding:'16px 12px', textAlign:'center', cursor:'pointer' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:'rgba(245,240,232,0.5)', letterSpacing:.5 }}>{name}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrolling marquee */}
      <div style={{ marginTop:60, borderTop:'1px solid rgba(245,158,11,0.08)', borderBottom:'1px solid rgba(245,158,11,0.08)', padding:'14px 0', overflow:'hidden', opacity:.4 }}>
        <div className="marquee-track">
          {[...Array(2)].map((_,z) => (
            ['Decreto 1072/2015','Resolución 0312/2019','Resolución 4272/2021','NTC 1931','GTC 45','RETIE 2013','Ley 1562/2012','NTC 2050','NTC 1733','COPASST','SG-SST'].map(item => (
              <span key={`${z}-${item}`} style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'#F59E0B', textTransform:'uppercase' }}>
                {item} &nbsp; · &nbsp;
              </span>
            ))
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Preview Page ────────────────────────────────────────────────────────
export default function DesignPreviewPage() {
  const [active, setActive] = useState<Theme>('nexus')

  const themes = [
    { id: 'nexus' as Theme, name: 'NEXUS', sub: 'Comando Táctico', desc: 'Dark cyberpunk · Verde neón · Tipografía técnica', color: '#00E5FF', bg: 'rgba(0,230,255,0.1)', border: 'rgba(0,230,255,0.3)' },
    { id: 'aurora' as Theme, name: 'AURORA', sub: 'Lujo Premium', desc: 'Gradientes aurora · Serif elegante · Glass cards', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
    { id: 'terra' as Theme, name: 'TERRA', sub: 'Editorial Cálido', desc: 'Ámbar/naranja · Bold display · Dashboard live', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  ]

  return (
    <div style={{ background:'#000', minHeight:'100vh' }}>

      {/* Selector bar */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'rgba(0,0,0,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 24px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>

        <div style={{ fontFamily:'system-ui', fontSize:11, fontWeight:700, letterSpacing:2, color:'rgba(255,255,255,0.3)', marginRight:8, textTransform:'uppercase' }}>
          Selecciona un diseño:
        </div>

        {themes.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 20px', borderRadius:100, cursor:'pointer',
              fontFamily:'system-ui', fontSize:12, fontWeight:600,
              transition:'all .2s',
              background: active === t.id ? t.bg : 'transparent',
              border: `1px solid ${active === t.id ? t.border : 'rgba(255,255,255,0.1)'}`,
              color: active === t.id ? t.color : 'rgba(255,255,255,0.4)',
            }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:t.color, opacity: active===t.id ? 1 : 0.4 }}/>
            <span style={{ letterSpacing:1 }}>{t.name}</span>
            <span style={{ fontSize:10, opacity:.6 }}>{t.sub}</span>
          </button>
        ))}

        <div style={{ marginLeft:'auto', fontFamily:'system-ui', fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:1 }}>
          {themes.find(t=>t.id===active)?.desc}
        </div>
      </div>

      {/* Theme preview */}
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0}} transition={{duration:.3}}>
          {active === 'nexus' && <NexusTheme />}
          {active === 'aurora' && <AuroraTheme />}
          {active === 'terra' && <TerraTheme />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom CTA */}
      <div style={{ background:'rgba(0,0,0,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontFamily:'system-ui', fontSize:12, color:'rgba(255,255,255,0.4)' }}>
          Vista previa de: <span style={{ color:'rgba(255,255,255,0.8)', fontWeight:700 }}>{themes.find(t=>t.id===active)?.name} – {themes.find(t=>t.id===active)?.sub}</span>
        </div>
        <div style={{ fontFamily:'system-ui', fontSize:12, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>
          Dile a Claude cuál diseño quieres y lo aplica en toda la app →
        </div>
      </div>
    </div>
  )
}

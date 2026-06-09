'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, BookOpen, Award, BarChart2, Brain, ArrowRight, Users, PenTool } from 'lucide-react'

const NORMS = ['Decreto 1072/2015','Resolución 0312/2019','Resolución 4272/2021','NTC 1931','GTC 45','RETIE 2013','Ley 1562/2012','NTC 2050','NTC 1733','COPASST','SG-SST']

const FEATURES = [
  { icon: BookOpen, title: 'Capacitaciones con IA', desc: 'Sube cualquier documento y la IA genera diapositivas, evaluaciones y certificados automáticamente.', color: '#F59E0B' },
  { icon: Award,    title: 'Certificados Digitales', desc: 'Emisión automática con código QR y validez legal bajo el Decreto 1072 de 2015.', color: '#EF4444' },
  { icon: PenTool,  title: 'Firmas Digitales', desc: 'Validez jurídica (Ley 527/1999). Los trabajadores firman desde celular o PC.', color: '#F59E0B' },
  { icon: Brain,    title: 'IA SST Integrada', desc: 'Asistente especializado en normativa colombiana. Alertas de vencimiento y análisis de riesgos.', color: '#EF4444' },
  { icon: BarChart2,title: 'Reportes de Cumplimiento', desc: 'Indicadores en tiempo real del SG-SST. Reportes mensuales automáticos del Decreto 1072.', color: '#F59E0B' },
  { icon: Shield,   title: 'COPASST y Auditorías', desc: 'Gestión completa del Comité Paritario, auditorías y seguimiento de hallazgos.', color: '#EF4444' },
]

const fd = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.06)' }} />
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.04)' }} />
      </div>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,5,0,0.88)', backdropFilter: 'blur(24px)', padding: '0 clamp(16px,5vw,72px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--grad-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(245,158,11,0.28)' }}>
              <Shield size={17} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>Jimmy Academy</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--amber)', lineHeight: 1, marginTop: 2 }}>SST Colombia</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login" style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', color: 'rgba(245,158,11,0.8)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Ingresar</Link>
            <Link href="/register" style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--grad-main)', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(245,158,11,0.22)' }}>Comenzar gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px,10vh,110px) clamp(16px,5vw,72px) 72px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(40px,6vw,90px)', alignItems: 'center' }}>

          <motion.div variants={fd} initial="hidden" animate="show" transition={{ duration: .7 }}>
            <div className="terra-tag" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="terra-divider" />
              La plataforma líder en SG-SST · Colombia 2026
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(44px,5.5vw,80px)', lineHeight: .93, letterSpacing: -2, marginBottom: 24 }}>
              Cumplimiento<br />
              <span className="display-italic" style={{ background: 'var(--grad-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                SST total
              </span><br />
              sin fricciones
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, maxWidth: 440, marginBottom: 36 }}>
              Gestiona capacitaciones, certificados y cumplimiento del <strong style={{ color: 'var(--text)' }}>Decreto 1072 de 2015</strong> con inteligencia artificial. Para empresas colombianas.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 'var(--radius)', background: 'var(--grad-main)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 8px 28px rgba(245,158,11,0.28)' }}>
                Empezar gratis <ArrowRight size={15} />
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 'var(--radius)', border: '1px solid var(--border-strong)', color: 'rgba(245,158,11,0.8)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Ver la plataforma
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {['#F59E0B','#EF4444','#10B981','#3B82F6'].map((c, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid var(--bg)', marginLeft: i > 0 ? -7 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>+1,200 empresas confían en nosotros</span>
            </div>
          </motion.div>

          {/* Live panel */}
          <motion.div variants={fd} initial="hidden" animate="show" transition={{ duration: .7, delay: .2 }}>
            <div className="terra-card glow-amber" style={{ padding: '26px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div className="terra-tag" style={{ fontSize: 10 }}>
                  <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
                  Panel en vivo
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Actualizado ahora</span>
              </div>
              {[
                { label: 'Cumplimiento SG-SST', v: 94, c: '#F59E0B' },
                { label: 'Capacitaciones al día', v: 87, c: '#10B981' },
                { label: 'Certificados vigentes', v: 96, c: '#3B82F6' },
                { label: 'Firmas completadas',   v: 88, c: '#EF4444' },
              ].map(({ label, v, c }, i) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-dim)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}%</span>
                  </div>
                  <div className="terra-progress-track">
                    <motion.div className="terra-progress-fill" initial={{ width: 0 }} animate={{ width: `${v}%` }}
                      transition={{ duration: 1.4, delay: .4 + i * .15, ease: 'easeOut' }}
                      style={{ background: c, boxShadow: `0 0 8px ${c}55` }} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>Próxima auditoría</span>
                <span className="display" style={{ fontSize: 18, color: 'var(--amber)' }}>28 Ene 2026</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
              {[{ icon: '🎓', n: 'Capacitaciones' }, { icon: '📜', n: 'Certificados' }, { icon: '✍️', n: 'Firmas' }].map(({ icon, n }) => (
                <div key={n} className="terra-card" style={{ padding: '13px 10px', textAlign: 'center', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: .3 }}>{n}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '44px clamp(16px,5vw,72px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 28, textAlign: 'center' }}>
          {[
            { v: '1.2K+', l: 'Empresas activas', c: '#F59E0B' },
            { v: '50K+',  l: 'Certificados emitidos', c: '#EF4444' },
            { v: '98%',   l: 'Satisfacción', c: '#F59E0B' },
            { v: '100%',  l: 'Cumplimiento legal', c: '#EF4444' },
          ].map(({ v, l, c }, i) => (
            <motion.div key={l} variants={fd} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * .1 }}>
              <div className="display" style={{ fontSize: 44, fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, fontWeight: 500 }}>{l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '13px 0', overflow: 'hidden', background: 'rgba(245,158,11,0.02)' }}>
        <div style={{ display: 'flex', gap: 48, width: 'max-content' }} className="animate-marquee">
          {[...Array(3)].flatMap(() => NORMS).map((item, i) => (
            <span key={i} className="terra-tag" style={{ whiteSpace: 'nowrap', opacity: .5, fontSize: 10 }}>{item} &nbsp;·</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(56px,8vw,96px) clamp(16px,5vw,72px)', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div variants={fd} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="terra-tag" style={{ justifyContent: 'center', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="terra-divider" /> Módulos del sistema <div className="terra-divider" />
          </div>
          <h2 className="display" style={{ fontSize: 'clamp(34px,4vw,54px)', fontWeight: 900, lineHeight: 1.05 }}>
            Todo lo que necesitas<br />
            <span className="display-italic" style={{ background: 'var(--grad-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              en un solo lugar
            </span>
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div key={title} variants={fd} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * .07 }}
              className="terra-card terra-card-lift" style={{ padding: '26px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={19} color={color} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, marginBottom: 9, lineHeight: 1.1 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(56px,8vw,96px) clamp(16px,5vw,72px)', textAlign: 'center' }}>
        <div className="terra-card glow-amber" style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(36px,5vw,64px)', borderRadius: 'var(--radius-xl)' }}>
          <div className="terra-tag" style={{ justifyContent: 'center', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="terra-divider" /> Comienza hoy
          </div>
          <h2 className="display" style={{ fontSize: 'clamp(32px,4vw,50px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 18 }}>
            Tu empresa merece el<br />
            <span className="display-italic" style={{ background: 'var(--grad-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>mejor SG-SST</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 32 }}>Decreto 1072 · Resolución 0312 · Resolución 4272. Cumplimiento normativo completo.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 'var(--radius)', background: 'var(--grad-main)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 8px 28px rgba(245,158,11,0.28)' }}>
              Comenzar gratis <ArrowRight size={15} />
            </Link>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 'var(--radius)', border: '1px solid var(--border-strong)', color: 'rgba(245,158,11,0.8)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Ingresar al sistema
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px clamp(16px,5vw,72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--grad-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={13} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Jimmy Academy SST</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>© 2026 · Plataforma SG-SST Colombia · Decreto 1072 de 2015</span>
      </footer>
    </div>
  )
}

# Jimmy Academy SST 🛡️

**La Plataforma #1 en Colombia para Gestión de Seguridad y Salud en el Trabajo (SG-SST) Inteligente.**

## ✨ Funcionalidades

- 📚 **Capacitaciones Digitales** — Cursos interactivos con seguimiento en tiempo real
- ✍️ **Firma Electrónica** — Validez legal bajo ley colombiana
- 🏆 **Certificados Automáticos** — PDF con código QR de verificación
- 📊 **Reportes y Auditoría** — Dashboards en tiempo real
- 🤖 **Inteligencia Artificial** — Quizzes personalizados y detección de incumplimientos
- 🔐 **Seguridad Enterprise** — Cifrado AES-256, MFA, backups automáticos

---

## 🚀 Instalación y Desarrollo

### Requisitos previos
- Node.js >= 18.17
- npm >= 9 o pnpm >= 8

### 1. Instalar dependencias
```bash
npm install
# o
pnpm install
```

### 2. Variables de entorno
```bash
cp .env.example .env.local
```
Edita `.env.local` con tus valores:
```
NEXTAUTH_SECRET=tu_secreto_seguro_aqui
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/jimmy_sst
```

### 3. Iniciar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
jimmy-academy-sst/
├── app/
│   ├── globals.css          # Sistema de diseño completo
│   ├── layout.tsx           # Root layout + metadata
│   ├── page.tsx             # Landing Page
│   ├── login/page.tsx       # Autenticación
│   ├── register/page.tsx    # Registro
│   └── dashboard/
│       ├── layout.tsx       # Sidebar + Header
│       ├── page.tsx         # Dashboard principal
│       ├── ai/              # Módulo IA SST
│       ├── audit/           # Auditoría
│       ├── certificates/    # Certificados
│       ├── evaluations/     # Evaluaciones
│       ├── notifications/   # Notificaciones
│       ├── reports/         # Reportes
│       ├── settings/        # Configuración
│       ├── signatures/      # Firmas electrónicas
│       ├── trainings/       # Capacitaciones
│       └── users/           # Gestión de usuarios
├── components/
│   ├── ui/                  # Componentes base
│   ├── dashboard/           # Componentes del panel
│   └── landing/             # Componentes de la landing
├── lib/
│   └── utils.ts             # Utilidades y helpers
├── public/                  # Archivos estáticos
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v3 |
| Animaciones | Framer Motion |
| Iconos | Lucide React |
| Tipografía | Sora (Google Fonts) |

---

## 🚢 Despliegue en Producción

### Vercel (recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```bash
docker build -t jimmy-academy-sst .
docker run -p 3000:3000 jimmy-academy-sst
```

### Variables de producción requeridas
```
NEXTAUTH_SECRET=         # Secreto JWT fuerte (openssl rand -base64 32)
NEXTAUTH_URL=            # URL pública de producción
DATABASE_URL=            # PostgreSQL en producción
```

---

## 🔒 Seguridad

- Headers HTTP de seguridad configurados en `next.config.js`
- Validación de formularios en cliente y servidor
- Protección CSRF integrada con NextAuth
- Sanitización de inputs
- Rate limiting recomendado con middleware

---

## 📞 Soporte

- 📧 soporte@jimmy-academy.co
- 🌐 https://jimmy-academy.co
- 📍 Medellín, Colombia

---

*© 2025 Jimmy Academy SST — Todos los derechos reservados*

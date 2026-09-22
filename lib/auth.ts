import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        // Se conserva el nombre 'email' por compatibilidad, pero acepta el
        // documento de identidad: para los trabajadores esa es la llave de acceso.
        email: { label: 'Documento o correo', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const identificador = credentials.email.trim()

        // Primero por documento; si no, por correo (administradores y porteros).
        const porCedula = await supabase
          .from('users').select('*').eq('cedula', identificador).eq('active', true).maybeSingle()
        let user = porCedula.data
        if (!user) {
          const porCorreo = await supabase
            .from('users').select('*').ilike('email', identificador).eq('active', true).maybeSingle()
          user = porCorreo.data
        }
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          cedula: user.cedula,
          area: user.area,
          companyId: user.company_id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.permissions = (user as any).permissions ?? null
        token.cedula = (user as any).cedula
        token.area = (user as any).area
        token.userId = (user as any).id
        token.companyId = (user as any).companyId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions ?? null;
        (session.user as any).cedula = token.cedula;
        (session.user as any).area = token.area;
        (session.user as any).id = token.userId;
        (session.user as any).companyId = token.companyId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'jimmy-academy-sst-secret-2026',
}

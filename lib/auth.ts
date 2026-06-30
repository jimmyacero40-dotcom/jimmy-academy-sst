import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Temporary hardcoded admin while DB is being configured
        if (
          credentials.email === 'admin@jimmyacademy.com' &&
          credentials.password === 'admin123'
        ) {
          return {
            id: '1',
            email: 'admin@jimmyacademy.com',
            name: 'Administrador',
            role: 'admin',
            cedula: '000000000',
            area: 'Administración',
            companyId: '1',
          } as any
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .eq('active', true)
          .single()

        if (error || !user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Demo users — in production these would come from a database
const USERS = [
  {
    id: '1',
    email: 'admin@jimmyacademy.com',
    name: 'Admin SST',
    role: 'admin',
    // password: admin123
    password: '$2b$10$Sg3yses7W4fsoS/nyxBoGuQEwv3C4nZjTOj53MKIwx9kuDdH.ZNNm',
  },
  {
    id: '2',
    email: 'diana@jimmyacademy.com',
    name: 'Diana Ruiz',
    role: 'coordinadora',
    // password: sst2026
    password: '$2b$10$ciUbjOPxODQg/M.iDKsJJ.gvooi854ym4QUifjv9MbStCnOGqiVlC',
  },
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = USERS.find(u => u.email === credentials.email)
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'jimmy-academy-sst-secret-2026',
})

export { handler as GET, handler as POST }

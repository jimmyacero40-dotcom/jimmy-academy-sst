// Run once to generate password hashes:
// npx ts-node app/api/auth/[...nextauth]/generate-hash.ts
import bcrypt from 'bcryptjs'
async function main() {
  console.log('admin123:', await bcrypt.hash('admin123', 10))
  console.log('sst2026:', await bcrypt.hash('sst2026', 10))
}
main()

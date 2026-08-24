import { prisma } from '#/db'

async function promoteFirstAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

  if (!adminEmail) {
    throw new Error('Set ADMIN_EMAIL in .env.local to your Google email')
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: adminEmail,
        mode: 'insensitive',
      },
    },
  })

  if (!user) {
    console.log(
      `No user for ${adminEmail}. Sign in with Google first, then run: npm run db:seed`,
    )
    return
  }

  if (user.role === 'admin') {
    console.log(`${adminEmail} is already admin`)
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  })

  console.log(`Promoted ${adminEmail} to admin. Sign out and sign in again.`)
}

async function main() {
  console.log('Seeding database...')
  await promoteFirstAdmin()
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

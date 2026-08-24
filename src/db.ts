import { PrismaClient } from './generated/prisma/client.js'

import { getDatabaseUrl } from './database-url.js'

import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrisma() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  })
  return new PrismaClient({ adapter })
}

function isUsablePrismaClient(client: PrismaClient | undefined) {
  return (
    client != null &&
    typeof client.jinis !== 'undefined' &&
    typeof client.mainCalculation !== 'undefined'
  )
}

const cached = globalThis.__prisma
export const prisma = isUsablePrismaClient(cached) ? cached! : createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

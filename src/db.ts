import { Pool } from 'pg'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/prisma/client.js'
import { getDatabaseUrl } from './database-url.js'

declare global {
  var __pgPool: Pool | undefined
  var __prisma: PrismaClient | undefined
}

function createPool() {
  return new Pool({
    connectionString: getDatabaseUrl(),
  })
}

const cachedPool = globalThis.__pgPool
export const pgPool = cachedPool ?? createPool()

function createPrisma() {
  return new PrismaClient({
    adapter: new PrismaPg(pgPool),
  })
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
  globalThis.__pgPool = pgPool
  globalThis.__prisma = prisma
}

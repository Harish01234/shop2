import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { prisma } from '#/db'

const PRODUCTION_ORIGIN = 'https://shop2-psi-amber.vercel.app'

function resolveAuthBaseURL() {
  const configured = process.env.BETTER_AUTH_URL
  const configuredIsLocal =
    !configured || /localhost|127\.0\.0\.1/i.test(configured)

  if (process.env.VERCEL && configuredIsLocal) {
    return process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : PRODUCTION_ORIGIN
  }

  return configured ?? 'http://localhost:3000'
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: resolveAuthBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    'http://localhost:3000',
    PRODUCTION_ORIGIN,
    'https://*.vercel.app',
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  advanced: {
    trustedProxyHeaders: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: 'select_account',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    tanstackStartCookies(),
  ],
})

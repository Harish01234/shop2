import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AlertCircleIcon } from 'lucide-react'

import { getSession } from '#/lib/auth.functions'
import { authClient } from '#/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/signin')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: SignInPage,
})

type Provider = 'google' | 'github'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
      />
    </svg>
  )
}

function SignInPage() {
  const [loading, setLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signIn(provider: Provider) {
    setError(null)
    setLoading(provider)

    const result = await authClient.signIn.social({
      provider,
      callbackURL: '/',
    })

    if (result.error) {
      setError(result.error.message || 'Sign in failed. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-heading text-base font-medium text-foreground">
          Interest
        </span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-sm shadow-lg ring-foreground/15">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Continue with your Google or GitHub account. There is no separate
              registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Could not sign in</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full bg-background"
              disabled={loading !== null}
              onClick={() => void signIn('google')}
            >
              {loading === 'google' ? <Spinner /> : <GoogleIcon />}
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full bg-background"
              disabled={loading !== null}
              onClick={() => void signIn('github')}
            >
              {loading === 'github' ? <Spinner /> : <GitHubIcon />}
              Continue with GitHub
            </Button>

            <Separator />
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to use this app with the selected
              account.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

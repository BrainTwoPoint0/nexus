import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            There was an error with your authentication. This could be due to an
            expired link or invalid credentials.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            href="/sign-in"
            className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Try signing in again
          </Link>
          <Link
            href="/"
            className="flex w-full justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

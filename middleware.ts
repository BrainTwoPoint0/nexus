import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// List paths that require authentication
const protectedPaths = [
    '/dashboard',
    '/org-dashboard',
    '/profile',
]

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const urlPath = req.nextUrl.pathname
    const isProtected = protectedPaths.some((path) =>
        urlPath === path || urlPath.startsWith(`${path}/`)
    )

    if (isProtected && !session) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/sign-in'
        redirectUrl.searchParams.set('redirect', urlPath)
        return NextResponse.redirect(redirectUrl)
    }

    return res
}

export const config = {
    matcher: protectedPaths.map((p) => `${p}/:path*`),
} 
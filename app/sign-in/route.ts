import { NextRequest, NextResponse } from 'next/server';
import { getSignInUrl } from '@workos-inc/authkit-nextjs';

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get('intent') ?? 'client';
  const authorizationUrl = await getSignInUrl();
  const response = NextResponse.redirect(authorizationUrl);
  // Store intent in a short-lived cookie so callback can read it
  response.cookies.set('pairfood_intent', intent, {
    path: '/',
    httpOnly: true,
    maxAge: 300, // 5 minutes - only needs to survive the OAuth round-trip
    sameSite: 'lax',
  });
  return response;
}

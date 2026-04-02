import { NextResponse } from 'next/server';
import { getSignUpUrl } from '@workos-inc/authkit-nextjs';

export async function GET() {
  const authorizationUrl = await getSignUpUrl();
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set('pairfood_intent', 'client', {
    path: '/',
    httpOnly: true,
    maxAge: 300,
    sameSite: 'lax',
  });
  return response;
}

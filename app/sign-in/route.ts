import { NextResponse } from 'next/server';
import { getSignInUrl } from '@workos-inc/authkit-nextjs';

export async function GET() {
  const authorizationUrl = await getSignInUrl();
  return NextResponse.redirect(authorizationUrl);
}

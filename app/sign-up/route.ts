import { NextResponse } from 'next/server';
import { getSignUpUrl } from '@workos-inc/authkit-nextjs';

export async function GET() {
  const authorizationUrl = await getSignUpUrl();
  return NextResponse.redirect(authorizationUrl);
}

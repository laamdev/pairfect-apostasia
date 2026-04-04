import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const handler = handleAuth({ returnPathname: '/' });
  return handler(request);
}

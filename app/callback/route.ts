import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const intent = request.cookies.get('pairfood_intent')?.value;
  const returnPathname = intent === 'staff' ? '/admin' : '/';

  const handler = handleAuth({ returnPathname });
  return handler(request);
}

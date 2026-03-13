'use client';

import { Authenticated, Unauthenticated, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8 flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center">Pairfood</h1>
      <RestaurantList />
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </main>
  );
}

function RestaurantList() {
  const restaurants = useQuery(api.restaurants.listRestaurants);

  if (restaurants === undefined) {
    return (
      <section className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-semibold mb-4">Restaurants</h2>
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-semibold mb-4">Restaurants</h2>
      {restaurants.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">No restaurants yet. Seed the database to see La Apostasía.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <li key={r._id}>
              <Link
                href={`/restaurant/${r.slug ?? r._id}`}
                className="block border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <p className="font-medium">{r.name}</p>
                {r.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{r.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the numbers</p>
      <a href="/sign-in">
        <button className="bg-foreground text-background px-4 py-2 rounded-md">Sign in</button>
      </a>
      <a href="/sign-up">
        <button className="bg-foreground text-background px-4 py-2 rounded-md">Sign up</button>
      </a>
    </div>
  );
}

function Content() {
  const data =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  const { viewer, numbers } = (data as any) ?? {};
  const addNumber = useMutation(api.myFunctions.addNumber);

  if (viewer === undefined || numbers === undefined) {
    return <div className="mx-auto"></div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <p>Welcome {viewer ?? 'Anonymous'}!</p>
      <p>
        Click the button below and open this page in another window - this data is persisted in the Convex cloud
        database!
      </p>
      <p>
        <button
          className="bg-foreground text-background text-sm px-4 py-2 rounded-md"
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) });
          }}
        >
          Add a random number
        </button>
      </p>
      <p>Numbers: {numbers?.length === 0 ? 'Click the button!' : (numbers?.join(', ') ?? '...')}</p>
      <p>
        Edit{' '}
        <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
          convex/myFunctions.ts
        </code>{' '}
        to change your backend
      </p>
      <p>
        Edit{' '}
        <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
          app/page.tsx
        </code>{' '}
        to change your frontend
      </p>
      <p>
        See the{' '}
        <Link href="/server" className="underline hover:no-underline">
          /server route
        </Link>{' '}
        for an example of loading data in a server component
      </p>
      <div className="flex flex-col">
        <p className="text-lg font-bold">Useful resources:</p>
        <div className="flex gap-2">
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Convex docs"
              description="Read comprehensive documentation for all Convex features."
              href="https://docs.convex.dev/home"
            />
            <ResourceCard
              title="Stack articles"
              description="Learn about best practices, use cases, and more from a growing
            collection of articles, videos, and walkthroughs."
              href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Templates"
              description="Browse our collection of templates to get started quickly."
              href="https://www.convex.dev/templates"
            />
            <ResourceCard
              title="Discord"
              description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
              href="https://www.convex.dev/community"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="flex flex-col gap-2 bg-slate-200 dark:bg-slate-800 p-4 rounded-md h-28 overflow-auto">
      <a href={href} className="text-sm underline hover:no-underline">
        {title}
      </a>
      <p className="text-xs">{description}</p>
    </div>
  );
}

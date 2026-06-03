import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="mb-3 font-mono text-sm uppercase tracking-widest text-fd-muted-foreground">
        Open-source CSAM safety toolkit
      </p>
      <h1 className="mb-4 text-4xl font-bold sm:text-5xl">FightSAM</h1>
      <p className="mb-8 max-w-2xl text-fd-muted-foreground">
        Eleven Apache-2.0 building blocks to <strong>detect</strong>,{' '}
        <strong>report</strong>, and <strong>prevent</strong> child sexual abuse
        material &mdash; built for developers and their coding agents. We ship
        code, never hash lists.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="rounded-md bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground"
        >
          Browse the tools
        </Link>
        <Link
          href="/llms.txt"
          className="rounded-md border px-5 py-2.5 font-medium"
        >
          For coding agents: /llms.txt
        </Link>
      </div>
      <p className="mt-12 text-sm text-fd-muted-foreground">
        A developer project of{' '}
        <a href="https://digitalharm.org" className="underline">
          The Digital Harm Project
        </a>
        .
      </p>
    </main>
  );
}

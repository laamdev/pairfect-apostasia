'use client';

import { PreferencesEditor } from '@/components/preferences/PreferencesEditor';

export default function PreferencesPage() {
  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Mis preferencias</h1>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Volver
        </a>
      </header>

      <p className="text-muted-foreground text-sm">
        Configura tus preferencias con el formulario o conversando con el asistente. Las usaremos para crear tus
        maridajes.
      </p>

      <PreferencesEditor mode="global" />
    </main>
  );
}

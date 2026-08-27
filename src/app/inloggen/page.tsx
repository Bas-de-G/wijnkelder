import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = { title: 'Inloggen · Wijnkelder' };

export default function LoginPage() {
  return (
    <main className="shell" style={{ maxWidth: 460 }}>
      <header style={{ padding: '80px 0 32px' }}>
        <h1 className="wordmark">
          Wijn<em>kelder</em>
        </h1>
        <p style={{ marginTop: 14, color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6 }}>
          Je kelder, je drinkvensters en je dagboek — op al je apparaten, alleen voor jou
          zichtbaar.
        </p>
      </header>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

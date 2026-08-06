'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TiendaPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/catalogo'); }, [router]);
  return null;
}

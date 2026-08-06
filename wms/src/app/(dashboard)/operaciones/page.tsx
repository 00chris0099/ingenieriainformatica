'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperacionesPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/pedidos'); }, [router]);
  return null;
}

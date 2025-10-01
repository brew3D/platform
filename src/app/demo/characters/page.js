"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import CharactersPage from '../../dashboard/projects/[id]/characters/page';

export default function DemoCharactersPage() {
  const router = useRouter();

  return (
    <div>
      <CharactersPage />
    </div>
  );
}

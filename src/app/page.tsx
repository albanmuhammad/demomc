'use client';

import LandingPageDemo from './components/LandingPageDemo';
import ConsentManager from './components/ConsentManager'; // ⬅️ tambahkan ini

export default function Home() {
  return (
    <>
      <LandingPageDemo />
      <ConsentManager /> {/* ⬅️ render di luar komponen utama */}
    </>
  );
}

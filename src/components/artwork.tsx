"use client";
import { type ReactNode, type PointerEvent } from 'react';
import { artworkFor, pageArtwork } from '@/lib/artwork';
export function tiltArt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || document.documentElement.dataset.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--ry', `${((event.clientX - box.left) / box.width - .5) * 9}deg`);
  event.currentTarget.style.setProperty('--rx', `${-((event.clientY - box.top) / box.height - .5) * 7}deg`);
}
export function resetArt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--ry', '0deg');
  event.currentTarget.style.setProperty('--rx', '0deg');
}
export function ArtImage({ asset, className = '' }: { asset: { id?: string; name: string; category: string }; className?: string }) {
  return <img className={`asset-art ${className}`} src={artworkFor(asset)} alt={`${asset.name} — ${asset.category} illustration`} width={560} height={420} loading="lazy" />;
}
export function ArtStage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`art-stage ${className}`} onPointerMove={tiltArt} onPointerLeave={resetArt}>{children}</div>;
}
export function PageArtwork({ page }: { page: string }) {
  const art = pageArtwork[page];
  if (!art) return null;
  return <ArtStage className="page-art-banner"><div><span className="art-overline">A LITTLE MORE POSSIBILITY</span><h2>{art.label}</h2><p>{art.caption}</p></div><img src={`/images/art/${art.image}.webp`} alt="" width={280} height={180} /><span className="banner-spark" aria-hidden="true">✳</span></ArtStage>;
}

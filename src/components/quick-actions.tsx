"use client";
import { ArrowRight, ArrowUpRight, Zap } from 'lucide-react';
import { quickPrompts } from '@/lib/quick-prompts';
import type { Asset } from '@/lib/catalog';
import { ArtImage, tiltArt, resetArt } from './artwork';
export function QuickActions({ onSelect, onViewAll, full = false }: { onSelect: (asset: Asset) => void; onViewAll: () => void; full?: boolean }) {
  return <section className="quick-section" aria-labelledby="quick-heading">
    <div className="section-heading"><div><h2 id="quick-heading"><Zap size={17} /> Small prompts. Big upgrades. <span className="new-pill">NEW</span></h2><p>A little care for your codebase. Pick a quick win and make it better.</p></div>{!full && <button className="text-button" onClick={onViewAll}>All quick prompts <ArrowRight size={15} /></button>}</div>
    <div className={`quick-grid ${full ? 'full' : ''}`}>{quickPrompts.slice(0, full ? 6 : 4).map((asset, index) => <button key={asset.id} className="quick-card" onClick={() => onSelect(asset)} onPointerMove={tiltArt} onPointerLeave={resetArt}>
      <div className="quick-art-wrap"><ArtImage asset={asset} /><span className="quick-number">0{index + 1}</span><span className="quick-arrow"><ArrowUpRight size={16} /></span></div>
      <span className="quick-card-copy"><strong>{asset.name}</strong><span>{asset.description}</span><small><Zap size={10} /> QUICK PROMPT <span>Review → improve</span></small></span>
    </button>)}</div>
    {full && <p className="quick-note">Start with a review, not a blind rewrite. Every prompt includes scope, safety guardrails, and verification.</p>}
  </section>;
}

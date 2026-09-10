import { ArtImage } from '@/components/artwork';
import { db } from '@/db';
import { stationAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ArrowUpRight, Layers3 } from 'lucide-react';
export const dynamic='force-dynamic';
export default async function SharedWorkflow({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!z.uuid().safeParse(token).success)notFound();
 const [asset]=await db.select({name:stationAssets.name,description:stationAssets.description,category:stationAssets.category,instructions:stationAssets.instructions,version:stationAssets.version,kind:stationAssets.kind}).from(stationAssets).where(eq(stationAssets.shareToken,token));
 if(!asset)notFound();
 return <main className="share-page"><a href="/" className="share-brand"><Layers3 size={27}/>shelley.</a><article className="panel"><ArtImage asset={asset} className="share-art" /><span className="pill">A SHARED POSSIBILITY</span><h1>{asset.name}</h1><p>{asset.description}</p><div className="detail-meta"><span className="category-tag">{asset.category}</span><span>Version {asset.version}</span><span>Read-only {asset.kind}</span></div><pre>{asset.instructions}</pre><p>This is a publicly shared workflow. No private conversations or workspace data are included.</p><a href="/" className="secondary-button">Find your next possibility<ArrowUpRight size={15}/></a></article></main>;
}

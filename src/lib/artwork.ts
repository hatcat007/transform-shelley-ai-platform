const categoryArt: Record<string, string> = {
  Sales: 'agent-0', Research: 'agent-1', Content: 'agent-2', Marketing: 'agent-3', Strategy: 'agent-4', Finance: 'agent-5',
  'People & HR': 'workspace-0', Operations: 'workspace-1', 'E-commerce': 'workspace-2', Partnerships: 'workspace-3', 'CRM & RevOps': 'workspace-4', 'Customer Success': 'workspace-5',
};
export function artworkFor(asset: { id?: string; category: string; name: string }) {
  const quick = ['security-hardening', 'design-polish', 'bug-finder', 'performance-tune-up', 'accessibility-check', 'test-coverage'];
  const names = ['Security hardening', 'Design polish', 'Bug finder', 'Performance tune-up', 'Accessibility check', 'Test coverage'];
  const index = asset.category === 'Repo optimization' ? Math.max(quick.indexOf((asset.id || '').replace('quick-', '')), names.indexOf(asset.name)) : -1;
  return `/images/art/${index >= 0 ? `quick-${index}` : categoryArt[asset.category] || 'workspace-5'}.webp`;
}
export const pageArtwork: Record<string, { image: string; label: string; caption: string }> = {
  'Agent & Prompt Station': { image: 'growth-studio', label: 'A little help. A whole new horizon.', caption: 'A handpicked team for the work that matters.' },
  'My agents': { image: 'workspace-0', label: 'Great work is a team sport.', caption: 'Your specialists. Your instructions. Your way.' },
  'Prompt library': { image: 'workspace-5', label: 'Start with a spark, not a blank page.', caption: 'Good questions open up great possibilities.' },
  Sessions: { image: 'agent-2', label: 'Ideas become real, one conversation at a time.', caption: 'A thoughtful space to pick up where you left off.' },
  Projects: { image: 'workspace-1', label: 'Room for your next big thing.', caption: 'Give your ambition a place to grow.' },
  'Usage & analytics': { image: 'agent-5', label: 'Small steps. Measurable progress.', caption: 'A clearer picture of the work you’re putting into motion.' },
  Settings: { image: 'workspace-4', label: 'Thoughtfully tuned to you.', caption: 'Make this little corner of the internet your own.' },
};

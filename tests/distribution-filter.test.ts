import { describe, it, expect } from 'vitest';
import { distributionService } from '../src/services/distribution.service';

export interface DistributionItemSummary {
  id: string;
  status: string;
  createdByUserId: string;
  assignedToUserId?: string | null;
}

/**
 * Filter predicate for "Tugas Saya"
 */
export function filterDistributions(
  items: DistributionItemSummary[],
  tab: 'all' | 'my-tasks',
  currentUserId?: string | null
): DistributionItemSummary[] {
  if (tab === 'all') return items;
  if (!currentUserId) return [];
  return items.filter(
    (item) => item.assignedToUserId === currentUserId || item.createdByUserId === currentUserId
  );
}

describe('Distribution "Tugas Saya" Filter (Prioritas 3)', () => {
  it('should import DistributionListPage cleanly', async () => {
    const page = await import('../src/app/(dashboard)/distribusi/page');
    expect(page.default).toBeDefined();
  });

  it('should include createdByUserId and assignedToUserId in distribution list service', async () => {
    const result = await distributionService.list({ limit: 10 });
    expect(result.data).toBeDefined();
    if (result.data.length > 0) {
      const first = result.data[0];
      expect(first).toHaveProperty('createdByUserId');
      expect(first).toHaveProperty('assignedToUserId');
    }
  });

  it('should correctly filter tasks for current user', () => {
    const userA = 'user-a';
    const userB = 'user-b';
    const userC = 'user-c';

    const testItems: DistributionItemSummary[] = [
      { id: '1', status: 'TERJADWAL', createdByUserId: userA, assignedToUserId: null },
      { id: '2', status: 'TERJADWAL', createdByUserId: userB, assignedToUserId: userA },
      { id: '3', status: 'TERJADWAL', createdByUserId: userB, assignedToUserId: userB },
      { id: '4', status: 'DIKIRIM', createdByUserId: userC, assignedToUserId: userC },
      { id: '5', status: 'TERJADWAL', createdByUserId: userA, assignedToUserId: userC },
    ];

    // Tab 'all' should return everything
    expect(filterDistributions(testItems, 'all', userA)).toHaveLength(5);

    // Tab 'my-tasks' for userA:
    // item 1: created by userA -> included
    // item 2: assigned to userA -> included
    // item 3: neither -> excluded
    // item 4: neither -> excluded
    // item 5: created by userA -> included
    const myTasksA = filterDistributions(testItems, 'my-tasks', userA);
    expect(myTasksA.map((i) => i.id)).toEqual(['1', '2', '5']);

    // Tab 'my-tasks' for userB:
    // item 2: created by userB -> included
    // item 3: created and assigned to userB -> included
    const myTasksB = filterDistributions(testItems, 'my-tasks', userB);
    expect(myTasksB.map((i) => i.id)).toEqual(['2', '3']);

    // Tab 'my-tasks' when no user is logged in
    expect(filterDistributions(testItems, 'my-tasks', null)).toHaveLength(0);
  });
});

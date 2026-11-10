// ──────────────────────────────────────────────────
// Automated Verification Script: Daily Collections
// ──────────────────────────────────────────────────

import {
  getMonitoredCollections,
  getBranchCollectionGroups,
  getBranchAgents,
  type MonitoredCollection,
} from '../monitoringDataService';

function runTests() {
  console.log('🧪 Starting Branch Manager Daily Collections Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── TEST 1: Branch Isolation ──
  console.log('--- 1. Branch Data Isolation ---');
  const br01All = getMonitoredCollections('BR-01', 'all');
  const br02All = getMonitoredCollections('BR-02', 'all');

  assert(br01All.length > 0, 'BR-01 has collection records');
  assert(br02All.length > 0, 'BR-02 has collection records');
  assert(
    br01All.every((c) => c.branchId === 'BR-01'),
    'All BR-01 records strictly belong to BR-01 (Zero Leakage)'
  );
  assert(
    br02All.every((c) => c.branchId === 'BR-02'),
    'All BR-02 records strictly belong to BR-02 (Zero Leakage)'
  );

  // ── TEST 2: PDF-Required Collection Statuses ──
  console.log('\n--- 2. PDF-Required Collection Statuses ---');
  const br01Today = getMonitoredCollections('BR-01', 'today');
  const statuses = new Set(br01Today.map((c) => c.status));

  assert(statuses.has('collected'), 'BR-01 has Collected records');
  assert(statuses.has('partial'), 'BR-01 has Partial records');
  assert(statuses.has('advance'), 'BR-01 has Advance records');
  assert(statuses.has('nc'), 'BR-01 has Pending Collection (NC) records');
  assert(statuses.has('delayed'), 'BR-01 has Delay Tracking records');

  // ── TEST 3: Exact KPI Calculations (Data-Driven) ──
  console.log('\n--- 3. Exact KPI Calculations ---');
  const totalCollected = br01Today.reduce((sum, r) => sum + (r.collectedAmount || 0), 0);
  const pendingCollection = br01Today.reduce((sum, r) => {
    if (r.status === 'collected') return sum;
    const due = r.dueAmount ?? r.expectedAmount ?? 0;
    const col = r.collectedAmount || 0;
    return sum + Math.max(0, due - col);
  }, 0);
  const advanceAmount = br01Today
    .filter((r) => r.status === 'advance')
    .reduce((sum, r) => sum + r.collectedAmount, 0);
  const delayedCount = br01Today.filter(
    (r) => r.status === 'delayed' || (r.delayedDays !== undefined && r.delayedDays > 0)
  ).length;

  console.log(`    Total Collected: ₹${totalCollected.toLocaleString('en-IN')}`);
  console.log(`    Pending Collection: ₹${pendingCollection.toLocaleString('en-IN')}`);
  console.log(`    Advance Collection: ₹${advanceAmount.toLocaleString('en-IN')}`);
  console.log(`    Delayed Records Count: ${delayedCount}`);

  // Let's verify each specific number from our BR-01 seed:
  // Collected: COL-9001 (2500) + COL-9002 (2000) + COL-9003 (2000) + COL-9010 (5000) = 11,500
  assert(totalCollected === 11500, `Total Collected is ₹11,500 exactly (got ${totalCollected})`);

  // Pending: COL-9003 partial (3750 - 2000 = 1750) + COL-9011 nc (2000 - 0 = 2000) + COL-9012 delayed (3000 - 0 = 3000) = 6,750
  assert(pendingCollection === 6750, `Pending Collection is ₹6,750 exactly (got ${pendingCollection})`);

  // Advance: COL-9010 (5000) = 5,000
  assert(advanceAmount === 5000, `Advance Collection is ₹5,000 exactly (got ${advanceAmount})`);

  // Delayed: COL-9012 = 1
  assert(delayedCount === 1, `Delay Tracking count is 1 record (got ${delayedCount})`);

  // ── TEST 4: Tomorrow Collection ──
  console.log('\n--- 4. Tomorrow Collection ---');
  const br01Tomorrow = getMonitoredCollections('BR-01', 'tomorrow');
  assert(br01Tomorrow.length >= 2, `BR-01 has Tomorrow collection records (found ${br01Tomorrow.length})`);
  assert(
    br01Tomorrow.every((c) => c.date === 'Tomorrow'),
    'Tomorrow collections are tagged as Tomorrow'
  );

  // ── TEST 5: Area-wise Collection & Routing ──
  console.log('\n--- 5. Area-wise Collection ---');
  const areas = new Set(br01All.map((c) => c.area).filter(Boolean));
  assert(areas.has('Anna Nagar East'), 'Area "Anna Nagar East" exists');
  assert(areas.has('Shenoy Nagar'), 'Area "Shenoy Nagar" exists');
  assert(areas.has('Aminjikarai'), 'Area "Aminjikarai" exists');

  // Filter by Anna Nagar East
  const annaNagarEastRecords = br01All.filter((c) => c.area === 'Anna Nagar East');
  assert(annaNagarEastRecords.length >= 3, `Anna Nagar East has ${annaNagarEastRecords.length} records`);

  // ── TEST 6: Group Assignment Filter ──
  console.log('\n--- 6. Customer Group Assignment Filter ---');
  const br01Groups = getBranchCollectionGroups('BR-01');
  assert(br01Groups.length >= 2, `BR-01 has ${br01Groups.length} configured groups`);
  const malarGroupRecords = br01All.filter((c) => c.groupId === 'GRP-001');
  assert(malarGroupRecords.length >= 3, `Group GRP-001 has ${malarGroupRecords.length} collection records`);

  // ── TEST 7: Customer Relationship Officer (CRO) Filter ──
  console.log('\n--- 7. Customer Relationship Officer (CRO) Filter ---');
  const subashRecords = br01All.filter((c) => c.agentName === 'Subash Murugan');
  const rajeshRecords = br01All.filter((c) => c.agentName === 'Rajesh Kumar');
  assert(subashRecords.length >= 4, `Subash Murugan has ${subashRecords.length} records`);
  assert(rajeshRecords.length >= 2, `Rajesh Kumar has ${rajeshRecords.length} records`);

  // ── TEST 8: Customer and Loan Lookup ──
  console.log('\n--- 8. Customer & Loan Search ---');
  const searchByCustName = br01All.filter((c) => c.customerName.toLowerCase().includes('ravi'));
  const searchByCustId = br01All.filter((c) => c.customerId.toLowerCase().includes('glf-c-1001'));
  const searchByLoanId = br01All.filter((c) => c.loanId.toLowerCase().includes('glf-l-2001'));

  assert(searchByCustName.length >= 2, `Search by customer name "ravi" found ${searchByCustName.length} records`);
  assert(searchByCustId.length >= 2, `Search by customer ID "GLF-C-1001" found ${searchByCustId.length} records`);
  assert(searchByLoanId.length >= 2, `Search by loan ID "GLF-L-2001" found ${searchByLoanId.length} records`);

  // ── TEST 9: Historical Collections ──
  console.log('\n--- 9. Collection History ---');
  const historyRecords = br01All.filter((c) => c.date === '2026-09-20');
  assert(historyRecords.length >= 2, `Historical date 2026-09-20 has ${historyRecords.length} records`);
  assert(historyRecords.every((c) => c.status === 'collected'), 'Historical records maintain stored status');

  // ── TEST 10: Multi-Branch Completeness & Isolation (BR-01 to BR-05) ──
  console.log('\n--- 10. Multi-Branch Isolation & Data Completeness (All 5 Branches) ---');
  const allBranches = ['BR-01', 'BR-02', 'BR-03', 'BR-04', 'BR-05'];

  for (const bId of allBranches) {
    const branchCollections = getMonitoredCollections(bId, 'all');
    const branchGroups = getBranchCollectionGroups(bId);

    assert(branchCollections.length > 0, `Branch ${bId} has collection records (found ${branchCollections.length})`);
    assert(
      branchCollections.every((c) => c.branchId.toUpperCase() === bId || (bId === 'BR-01' && c.branchId === 'b1')),
      `Branch ${bId} collections are 100% strictly isolated with 0 leakage`
    );

    const todayItems = branchCollections.filter((c) => c.date === 'Today');
    assert(todayItems.length > 0, `Branch ${bId} has Today collections (found ${todayItems.length})`);

    const tomorrowItems = branchCollections.filter((c) => c.date === 'Tomorrow');
    assert(tomorrowItems.length > 0, `Branch ${bId} has Tomorrow collections (found ${tomorrowItems.length})`);

    const distinctAgents = Array.from(new Set(branchCollections.map((c) => c.agentName).filter(Boolean)));
    assert(distinctAgents.length >= 1, `Branch ${bId} has assigned Customer Relationship Officers (CROs): ${distinctAgents.join(', ')}`);

    const distinctAreas = Array.from(new Set(branchCollections.map((c) => c.area).filter(Boolean)));
    assert(distinctAreas.length >= 1, `Branch ${bId} has area routes: ${distinctAreas.join(', ')}`);

    assert(branchGroups.length >= 1, `Branch ${bId} has configured groups: ${branchGroups.map((g) => g.name).join(', ')}`);
  }

  // ── TEST 11: Dynamic Branch Agent Resolution & Newly Added Agent Sync ──
  console.log('\n--- 11. Dynamic Branch Agent Resolution & Employee Addition ---');
  const br01Agents = getBranchAgents('BR-01');
  assert(br01Agents.includes('Subash Murugan'), 'BR-01 includes initial Customer Relationship Officer (CRO) Subash Murugan');
  assert(br01Agents.includes('Rajesh Kumar'), 'BR-01 includes Customer Relationship Officer (CRO) / manager Rajesh Kumar');
  assert(br01Agents.includes('Ramesh V.'), 'BR-01 includes Customer Relationship Officer (CRO) Ramesh V.');
  assert(br01Agents.includes('Arun P.'), 'BR-01 includes Customer Relationship Officer (CRO) Arun P.');

  // Test dynamic addition of a new agent
  const mockNewAgent = {
    id: 'EMP-999',
    name: 'Karthik Raja',
    role: 'collection_agent',
    branchId: 'BR-01',
    status: 'active',
  };

  // Mock localStorage for test environment if needed
  const originalGetItem = (globalThis as any).localStorage?.getItem;
  try {
    const testEmployeeStore = [mockNewAgent];
    (globalThis as any).localStorage = {
      getItem: (key: string) => {
        if (key === 'glf_pdf_strict_employees_master') {
          return JSON.stringify(testEmployeeStore);
        }
        return null;
      },
      setItem: () => {},
    };

    const updatedBr01Agents = getBranchAgents('BR-01');
    assert(
      updatedBr01Agents.includes('Karthik Raja'),
      'Dynamically added employee "Karthik Raja" appears in BR-01 agents list'
    );
  } finally {
    if (originalGetItem) {
      (globalThis as any).localStorage.getItem = originalGetItem;
    }
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    (globalThis as any).process?.exit?.(1);
  }
}

runTests();

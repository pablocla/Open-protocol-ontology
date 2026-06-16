import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HILManager } from './hil-manager';
import { SwarmMemory } from '../blackboard/blackboard';

// Force memory blackboard for tests (no Redis)
process.env.OPO_USE_MEMORY_BLACKBOARD = 'true';

describe('HILManager (Human-in-the-Loop)', () => {
  beforeEach(async () => {
    // Fresh slate
    await SwarmMemory.delete('hil:requests');
  });

  afterEach(async () => {
    await SwarmMemory.delete('hil:requests');
  });

  it('should resolve successfully when approve is called', async () => {
    // Start a request (it will hang waiting for resolution)
    const approvalPromise = HILManager.requestApproval('approval-agent-1', { foo: 'bar' }, 5000);

    // Give it a tick to register
    await new Promise(r => setTimeout(r, 10));

    // Simulate UI / external resolution
    const requests = await SwarmMemory.get('hil:requests') || [];
    expect(requests.length).toBeGreaterThan(0);
    const reqId = requests[0].id;

    await HILManager.resolveRequest(reqId, 'approved');

    const result = await approvalPromise;
    expect(result.approved).toBe(true);
    expect(result.requestId).toBe(reqId);
  });

  it('should resolve as rejected on explicit reject', async () => {
    const approvalPromise = HILManager.requestApproval('approval-agent-2', {}, 5000);

    await new Promise(r => setTimeout(r, 10));

    const requests = await SwarmMemory.get('hil:requests') || [];
    const reqId = requests[0].id;

    await HILManager.resolveRequest(reqId, 'rejected');

    const result = await approvalPromise;
    expect(result.approved).toBe(false);
  });

  it('should timeout and resolve as false after the specified timeout', async () => {
    // Very short timeout for the test
    const result = await HILManager.requestApproval('timeout-agent', { test: true }, 80);
    expect(result.approved).toBe(false);
  });
});

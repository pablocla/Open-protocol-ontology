import { SwarmMemory } from '../blackboard/blackboard';
import { randomBytes } from 'crypto';

export interface HILRequest {
  id: string;
  agentId: string;
  context: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export class HILManager {
  /**
   * Suspends the current execution thread waiting for human approval.
   * Uses Blackboard PubSub to wait for the resolution.
   */
  static async requestApproval(agentId: string, context: any, timeoutMs: number = 86400000): Promise<{ approved: boolean; requestId: string }> {
    const requestId = `hil_${randomBytes(8).toString('hex')}`;
    const request: HILRequest = {
      id: requestId,
      agentId,
      context,
      status: 'pending',
      createdAt: Date.now()
    };

    // Store the request in the blackboard state
    const currentRequests = await SwarmMemory.get('hil:requests') || [];
    currentRequests.push(request);
    await SwarmMemory.set('hil:requests', currentRequests);

    // Notify the UI that a new HIL request is pending
    await SwarmMemory.publish('hil:new_request', request);

    return new Promise((resolve) => {
      let timeoutId: any;
      const channel = `hil:resolve:${requestId}`;
      
      const handler = async (msg: any) => {
        clearTimeout(timeoutId);
        await SwarmMemory.unsubscribe(channel, handler);
        if (msg.status === 'approved') {
          resolve({ approved: true, requestId });
        } else {
          resolve({ approved: false, requestId });
        }
      };

      SwarmMemory.subscribe(channel, handler);

      timeoutId = setTimeout(async () => {
        await SwarmMemory.unsubscribe(channel, handler);
        // Timeout counts as rejection/failure
        resolve({ approved: false, requestId });
      }, timeoutMs);
    });
  }

  /**
   * Resolves a pending HIL request (called from external API or UI).
   */
  static async resolveRequest(requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const currentRequests = await SwarmMemory.get('hil:requests') || [];
    const requestIndex = currentRequests.findIndex((r: HILRequest) => r.id === requestId);
    
    if (requestIndex === -1) {
      throw new Error(`HIL Request ${requestId} not found.`);
    }

    currentRequests[requestIndex].status = status;
    await SwarmMemory.set('hil:requests', currentRequests);

    // Publish resolution to unblock the waiting agent
    await SwarmMemory.publish(`hil:resolve:${requestId}`, { status });
    return true;
  }
}

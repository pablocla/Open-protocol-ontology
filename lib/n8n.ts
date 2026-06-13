/**
 * Open Protocol ONTOLOGY (OPO) - n8n Feedback Integration Handler
 * Licensed under the Apache License, version 2.0
 * Copyright 2025 The OPO Contributors
 */

export interface OPOContribution {
  type: 'alias' | 'mapping' | 'rfc' | 'correction';
  entity: string;
  erp: string;
  alias: string;
  confidence: number;
  notes: string;
  contact: string | null;
  source_url: string;
  timestamp: string;
}

export async function submitContribution(
  data: OPOContribution,
  webhookUrl: string
): Promise<{ success: boolean; message: string; issueUrl?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));
    return {
      success: true,
      message: 'Contribution successfully processed by n8n community workflow.',
      issueUrl: result.issue_url || undefined,
    };
  } catch (error: any) {
    console.error('Error submitting contribution to n8n webhook:', error);
    return {
      success: false,
      message: error.message || 'Network error occurred while contacting n8n webhook.',
    };
  }
}

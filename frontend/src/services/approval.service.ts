import api from './api';
import type { Approval } from '../types';

export interface DecisionPayload {
  action: 'APPROVE' | 'REJECT';
  reason: string;
}

export const approvalService = {
  async getPendingApprovals(): Promise<Approval[]> {
    const res = await api.get('/approvals/pending');
    return res.data.data;
  },

  async processDecision(
    approvalId: string,
    payload: DecisionPayload
  ): Promise<{ success: boolean; message: string; status: string }> {
    const res = await api.post(`/approvals/${approvalId}/decision`, payload);
    return res.data;
  },
};

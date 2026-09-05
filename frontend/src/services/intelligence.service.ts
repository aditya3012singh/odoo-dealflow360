import api from './api';

export interface DealAlert {
  id: string;
  alertType: 'STALLED_DEAL' | 'DISCOUNT_ANOMALY' | 'DELIVERY_SLIPPAGE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  metadata?: any;
  quotationId?: string;
  orderId?: string;
  quotation?: {
    id: string;
    quotationNumber: string;
    customer?: {
      companyName: string;
    };
  };
  createdAt: string;
}

export const intelligenceService = {
  async listAlerts(): Promise<DealAlert[]> {
    const res = await api.get('/intelligence/alerts');
    return res.data.data;
  },

  async runHealthScan(): Promise<{ stalled: number; anomalies: number; slippage: number }> {
    const res = await api.post('/intelligence/scan');
    return res.data.data;
  },

  async acknowledgeAlert(id: string) {
    const res = await api.patch(`/intelligence/alerts/${id}/ack`);
    return res.data;
  },

  async resolveAlert(id: string) {
    const res = await api.patch(`/intelligence/alerts/${id}/resolve`);
    return res.data;
  },
};

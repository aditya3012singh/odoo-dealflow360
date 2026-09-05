import { Response, NextFunction } from 'express';
import { NegotiationService } from './negotiation.service.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';

export class NegotiationController {
  static async getRestrictedQuote(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const quote = await NegotiationService.getRestrictedQuote(id);
      return res.ok ? res.ok(quote, 'Customer quote view') : res.json({ success: true, data: quote });
    } catch (err) {
      next(err);
    }
  }

  static async submitCounterOffer(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { customerId, requestedDiscount, message } = req.body;

      if (requestedDiscount === undefined || isNaN(Number(requestedDiscount))) {
        return res.status(400).json({ success: false, message: 'requestedDiscount is required' });
      }

      const result = await NegotiationService.submitCounterOffer(
        id,
        customerId || 'customer',
        Number(requestedDiscount),
        message
      );

      return res.ok
        ? res.ok(result, 'Counter-offer processed')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async confirmAndConvert(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await NegotiationService.confirmAndConvert(id);
      return res.ok
        ? res.ok(result, 'Quotation converted to Order. Fulfillment & Billing initiated.')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

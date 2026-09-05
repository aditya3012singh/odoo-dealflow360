import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronDown, ChevronUp, CheckCircle, Send, ArrowLeft } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

const DUMMY_QUOTE = {
  quotationNumber: 'Q-2026-0019',
  status: 'APPROVED',
  totalAmount: '₹13,80,600',
  subtotal: '₹11,70,000',
  discountAmount: '₹2,10,600',
  taxAmount: '₹2,10,708',
  validUntil: 'Oct 3, 2026',
  salesRep: 'Sarah Jenkins',
  items: [
    { id: 'item-1', product: 'MacBook Pro M3 Max (36GB / 1TB)', sku: 'HW-MBP-16', quantity: 10, unitPrice: '₹1,50,000', discount: '18%', lineTotal: '₹12,30,000' },
  ],
};

export function PortalQuotationDetail() {
  useParams();
  const navigate = useNavigate();
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { author: 'Sarah Jenkins (Rep)', text: "Hi! Please review the pricing and let us know if you'd like to proceed.", time: '2 days ago', type: 'REP' },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const handleCounterOffer = () => {
    if (!counterDiscount) return;
    setSubmitted(true);
    setTimeout(() => { setShowCounterForm(false); setSubmitted(false); setCounterDiscount(''); setCounterMessage(''); }, 2000);
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [...prev, { author: 'You (Acme Global)', text: comment, time: 'Just now', type: 'CUSTOMER' }]);
    setComment('');
    setShowCommentForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/portal/dashboard')} className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-xs transition cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{DUMMY_QUOTE.quotationNumber}</h1>
              <Badge variant="success">Approved ✓</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Prepared by {DUMMY_QUOTE.salesRep} · Valid until {DUMMY_QUOTE.validUntil}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{DUMMY_QUOTE.totalAmount}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Subtotal</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{DUMMY_QUOTE.subtotal}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Discount Applied</p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">- {DUMMY_QUOTE.discountAmount}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Tax (18% GST)</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{DUMMY_QUOTE.taxAmount}</p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Quotation Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-900 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Product</th>
              <th className="px-6 py-3 text-right font-medium">Qty</th>
              <th className="px-6 py-3 text-right font-medium">Unit Price</th>
              <th className="px-6 py-3 text-right font-medium">Discount</th>
              <th className="px-6 py-3 text-right font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_QUOTE.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-50 dark:border-zinc-800">
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">{item.product}</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">SKU: {item.sku}</p>
                </td>
                <td className="px-6 py-4 text-right text-xs text-slate-700 dark:text-zinc-300">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-xs text-slate-700 dark:text-zinc-300">{item.unitPrice}</td>
                <td className="px-6 py-4 text-right text-xs text-amber-600 dark:text-amber-400 font-medium">{item.discount}</td>
                <td className="px-6 py-4 text-right text-xs font-semibold text-slate-900 dark:text-zinc-100">{item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Confirm */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 transition-colors">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Ready to Proceed?</h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-4">
            Confirm the quotation to place your order. Stock will be allocated and invoice generated automatically.
          </p>
          <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer">
            <CheckCircle className="w-4 h-4" /> Confirm & Place Order
          </button>
        </div>

        {/* Counter offer */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5 transition-colors">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Need a Better Price?</h3>
          <p className="text-xs text-amber-600 dark:text-amber-500 mb-4">
            Propose a counter-discount. The system will automatically re-evaluate and route for approval.
          </p>
          <button
            onClick={() => setShowCounterForm(!showCounterForm)}
            className="w-full border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            Propose Counter-Offer
            {showCounterForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showCounterForm && (
            <div className="mt-3 space-y-2">
              <input
                type="number"
                value={counterDiscount}
                onChange={(e) => setCounterDiscount(e.target.value)}
                placeholder="Requested discount % (e.g. 22)"
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                min="0" max="50"
              />
              <textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Reason for counter-offer (optional)..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 resize-none"
              />
              <button
                onClick={handleCounterOffer}
                disabled={submitted}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 disabled:opacity-50 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                {submitted ? '✓ Submitted!' : 'Submit Counter-Offer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Comments & Questions</h2>
          </div>
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="text-xs border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
          >
            + Add Comment
          </button>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
          {comments.map((c, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${c.type === 'REP' ? 'bg-black dark:bg-white dark:text-black' : 'bg-slate-500 dark:bg-zinc-500'}`}>
                  {c.author.charAt(0)}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">{c.author}</span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">{c.time}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 ml-7">{c.text}</p>
            </div>
          ))}
        </div>

        {showCommentForm && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your comment or question..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowCommentForm(false)} className="px-4 py-2 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleComment}
                className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                <Send className="w-3 h-3" /> Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

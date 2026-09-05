import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Building2,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Layers,
  RefreshCw,
  FileCheck,
  MessageSquare,
  Search,
  Printer,
  Copy,
  Check,
  Info,
  DollarSign,
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { quotationService } from '../../services/quotation.service';
import { approvalService } from '../../services/approval.service';
import type { Customer, Product, Quotation, Recommendation } from '../../types';
import { QuotationBuilderSkeleton } from '../../components/ui/Skeleton';
import { DealLifecycleStepper } from '../../components/common/DealLifecycleStepper';

const APPROVAL_PRESETS = [
  'Discount approved per strategic account volume commitment.',
  'Authorized based on long-term client retention & renewal expansion.',
  'Special executive commercial sign-off granted; healthy gross margin preserved.',
];

export function QuotationBuilderPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Core domain states
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const quotationRef = useRef<Quotation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Keep quotationRef in sync with quotation state
  useEffect(() => {
    quotationRef.current = quotation;
  }, [quotation]);

  // Interactive line item draft state map: itemId -> { quantity, discountPercentage }
  const [itemDrafts, setItemDrafts] = useState<
    Record<string, { quantity: number | string; discountPercentage: number | string }>
  >({});

  // Discussion & Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Manager Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalReason, setApprovalReason] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);

  // Blended Risk Score Explainability Modal
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync itemDrafts whenever quotation items change
  useEffect(() => {
    if (quotation?.items) {
      const drafts: Record<string, { quantity: number | string; discountPercentage: number | string }> = {};
      quotation.items.forEach((item) => {
        drafts[item.id] = {
          quantity: item.quantity,
          discountPercentage: item.discountPercentage,
        };
      });
      setItemDrafts(drafts);
    }
  }, [quotation?.items]);

  // Load initial catalog & quotation data
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        if (customers.length === 0) {
          setLoading(true);
        }
        setError(null);

        const [custData, prodData] = await Promise.all([
          customers.length > 0 ? Promise.resolve(customers) : quotationService.getCustomers(),
          products.length > 0 ? Promise.resolve(products) : quotationService.getProducts(),
        ]);

        if (!isMounted) return;
        setCustomers(custData || []);
        setProducts(prodData || []);

        if (id && id !== 'new') {
          // If we already hold this quotation with items in memory, skip re-fetching to prevent overwriting new additions
          if (quotationRef.current && quotationRef.current.id === id) {
            return;
          }
          setActionLoading(true);
          const q = await quotationService.getQuotation(id);
          if (!isMounted) return;
          setQuotation(q);
          quotationRef.current = q;
          setSelectedCustomerId(q.customerId);
          loadRecs(id);
          fetchComments(id);
        } else {
          setQuotation(null);
          quotationRef.current = null;
          setComments([]);
          if (custData && custData.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(custData[0].id);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load builder data:', err);
        setError(err.response?.data?.message || 'Failed to load quotation data');
      } finally {
        if (isMounted) {
          setLoading(false);
          setActionLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handler: Create new Draft quotation
  const handleCreateDraft = async () => {
    const effectiveCustomerId = selectedCustomerId || (customers.length > 0 ? customers[0].id : '');
    if (!effectiveCustomerId) {
      setError('Please select a customer account first.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const newQuote = await quotationService.createQuotation(effectiveCustomerId);
      setQuotation(newQuote);
      quotationRef.current = newQuote;
      setSuccessMsg(`Draft deal ${newQuote.quotationNumber} initialized.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      navigate(`/quotations/${newQuote.id}`, { replace: true });
    } catch (err: any) {
      console.error('Error creating quotation:', err);
      setError(err.response?.data?.message || 'Failed to create quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Add product to quote
  const handleAddProduct = async (product: Product) => {
    try {
      setAddingProductId(product.id);
      setActionLoading(true);
      setError(null);

      const effectiveCustomerId = selectedCustomerId || (customers.length > 0 ? customers[0].id : '');
      if (!effectiveCustomerId) {
        setError('Please select a customer account first.');
        return;
      }

      let targetQuote = quotationRef.current || quotation;
      const isNewDeal = !targetQuote;
      if (!targetQuote) {
        targetQuote = await quotationService.createQuotation(effectiveCustomerId);
        setQuotation(targetQuote);
        quotationRef.current = targetQuote;
      }

      const updated = await quotationService.addItem(targetQuote.id, {
        productId: product.id,
        quantity: 1,
        discountPercentage: 0,
      });

      setQuotation(updated);
      quotationRef.current = updated;
      setSuccessMsg(`Added "${product.name}" to quotation.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadRecs(updated.id);

      if (isNewDeal || id === 'new') {
        navigate(`/quotations/${targetQuote.id}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setActionLoading(false);
      setAddingProductId(null);
    }
  };

  // Handler: Add recommendation
  const handleAddRecommendation = async (rec: Recommendation) => {
    if (!quotation) return;
    try {
      setAddingRecId(rec.id);
      setActionLoading(true);
      setError(null);
      const updated = await quotationService.addItem(quotation.id, {
        productId: rec.productId,
        quantity: 1,
        discountPercentage: 0,
      });
      setQuotation(updated);
      setSuccessMsg(`Added upsell item: ${rec.name}`);
      setTimeout(() => setSuccessMsg(null), 3500);
      loadRecs(updated.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add recommendation');
    } finally {
      setActionLoading(false);
      setAddingRecId(null);
    }
  };

  // Handler: Update Item (quantity or discount)
  const handleUpdateItem = async (itemId: string, newQty: number, newDiscount: number) => {
    if (!quotation) return;
    const validatedQty = Math.max(1, isNaN(newQty) ? 1 : newQty);
    const validatedDiscount = Math.min(100, Math.max(0, isNaN(newDiscount) ? 0 : newDiscount));

    try {
      setActionLoading(true);
      setError(null);
      const updated = await quotationService.updateItem(quotation.id, itemId, {
        quantity: validatedQty,
        discountPercentage: validatedDiscount,
      });
      setQuotation(updated);
      loadRecs(updated.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Remove Item
  const handleRemoveItem = async (itemId: string) => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await quotationService.removeItem(quotation.id, itemId);
      setQuotation(updated);
      loadRecs(updated.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove item');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to refresh recommendations
  const loadRecs = async (quoteId: string) => {
    try {
      const recs = await quotationService.getRecommendations(quoteId);
      setRecommendations(recs || []);
    } catch (e) {
      console.warn('Could not reload recommendations:', e);
    }
  };

  // Helper to fetch comments
  const fetchComments = async (quoteId: string) => {
    try {
      const data = await quotationService.getComments(quoteId);
      setComments(data || []);
    } catch (e) {
      console.warn('Could not fetch comments:', e);
    }
  };

  // Handler: Post comment to quotation
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation || !commentText.trim()) return;
    try {
      setPostingComment(true);
      await quotationService.addComment(quotation.id, commentText.trim());
      setCommentText('');
      await fetchComments(quotation.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  // Handler: Manager process approval decision directly
  const handleProcessApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApproval || !approvalReason.trim()) return;
    try {
      setProcessingApproval(true);
      setError(null);
      const res = await approvalService.processDecision(activeApproval.id, {
        action: approvalAction,
        reason: approvalReason.trim(),
      });
      setShowApprovalModal(false);
      setSuccessMsg(res.message || `Quotation ${approvalAction.toLowerCase()}d successfully.`);
      const refreshed = await quotationService.getQuotation(quotation!.id);
      setQuotation(refreshed);
    } catch (err: any) {
      console.error('Decision failed:', err);
      setError(err?.response?.data?.message || 'Failed to process decision');
    } finally {
      setProcessingApproval(false);
    }
  };

  // Handler: Delete entire quotation
  const confirmDeleteQuotation = async () => {
    if (!quotation) return;
    try {
      setDeleting(true);
      setError(null);
      await quotationService.deleteQuotation(quotation.id);
      setShowDeleteModal(false);
      navigate('/quotations', { replace: true });
    } catch (err: any) {
      console.error('Failed to delete quotation:', err);
      setError(err.response?.data?.message || 'Failed to delete quotation');
    } finally {
      setDeleting(false);
    }
  };

  // Handler: Submit Quotation for Approval
  const handleSubmitQuotation = async () => {
    if (!quotation) return;
    if (quotation.items.length === 0) {
      setError('Please add at least one product line item before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await quotationService.submitQuotation(quotation.id);
      const refreshed = await quotationService.getQuotation(quotation.id);
      setQuotation(refreshed);
      setSuccessMsg(`Quotation submitted successfully! Status: ${res.status.replace(/_/g, ' ')}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Copy Customer Portal Negotiation Link
  const handleCopyPortalLink = () => {
    if (!quotation) return;
    const portalUrl = `${window.location.origin}/portal/quotations/${quotation.id}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortalLink(true);
    setSuccessMsg('Customer negotiation link copied to clipboard! Share with client for zero-trust review.');
    setTimeout(() => {
      setCopiedPortalLink(false);
      setSuccessMsg(null);
    }, 4000);
  };

  // Safe numerical calculations
  const hasItems = Boolean(quotation?.items && quotation.items.length > 0);
  const margin = hasItems ? Number(quotation?.marginPercentage || 0) : 0;
  const marginColor = !hasItems
    ? 'text-slate-400 dark:text-zinc-500'
    : margin >= 30
    ? 'text-emerald-600 dark:text-emerald-400'
    : margin >= 20
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';

  const marginProgressColor = !hasItems
    ? 'bg-slate-200 dark:bg-zinc-800'
    : margin >= 30
    ? 'bg-emerald-500'
    : margin >= 20
    ? 'bg-amber-500'
    : 'bg-rose-500';

  const riskScore = Number(quotation?.riskScore || 0);

  const getRiskDetails = () => {
    if (!hasItems) {
      return {
        label: 'Awaiting Products',
        levelBadge: 'Draft in Progress',
        description: 'Add products from the catalog to evaluate live margin, customer tier compliance, and governance risk.',
        badgeClass: 'bg-slate-50 text-slate-700 dark:bg-zinc-950/40 dark:text-zinc-300 border-slate-200 dark:border-zinc-800',
        icon: Info,
      };
    }
    if (riskScore <= 10) {
      return {
        label: 'Low Risk (Compliant)',
        levelBadge: 'Tier 0 • Auto-Approved',
        description: 'Within customer tier allowance. Automatically approves upon submission without manual delay.',
        badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        icon: CheckCircle2,
      };
    } else if (riskScore <= 25) {
      return {
        label: 'Medium Risk (Level 1)',
        levelBadge: 'Tier 1 • Sales Operations',
        description: 'Exceeds category discount ceiling. Requires Level 1 Sales Operations sign-off.',
        badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        icon: AlertTriangle,
      };
    } else {
      return {
        label: 'High Risk (Level 2 Escalation)',
        levelBadge: 'Tier 2 • Finance Sign-off',
        description: 'Significant margin dilution or discount breach. Requires Dual-Level sign-off: Sales Manager + Finance Controller.',
        badgeClass: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        icon: ShieldAlert,
      };
    }
  };

  const riskDetails = getRiskDetails();
  const RiskIcon = riskDetails.icon;

  const currentCustomer =
    quotation?.customer || customers.find((c) => c.id === selectedCustomerId);

  // Hybrid Split: Calculate One-Time (CapEx) vs Recurring Monthly (OpEx)
  const hybridSplit = useMemo(() => {
    if (!quotation?.items) return { oneTimeGross: 0, recurringMonthlyGross: 0 };
    let oneTime = 0;
    let recurring = 0;
    quotation.items.forEach((item) => {
      const isRec = item.product?.isRecurring || item.product?.category?.name === 'SUBSCRIPTIONS';
      const amount = Number(item.lineTotal || 0);
      if (isRec) {
        recurring += amount;
      } else {
        oneTime += amount;
      }
    });
    return { oneTimeGross: oneTime, recurringMonthlyGross: recurring };
  }, [quotation?.items]);

  // Filter products by category AND search query safely
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatches =
        selectedCategory === 'ALL' ||
        (p.category?.name || '').toUpperCase() === selectedCategory;

      const searchMatches =
        !catalogSearch.trim() ||
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(catalogSearch.toLowerCase());

      return catMatches && searchMatches;
    });
  }, [products, selectedCategory, catalogSearch]);

  const categories = ['ALL', 'HARDWARE', 'SERVICES', 'SUBSCRIPTIONS'];

  // Manager authorization rights
  const canAuthorize =
    currentUser?.role === 'SALES_MANAGER' || currentUser?.role === 'FINANCE' || currentUser?.role === 'ADMIN';

  // Check for active pending approval
  const activeApproval = quotation?.approvals?.find((a: any) => a.status === 'PENDING');

  // Quotation is editable if in DRAFT or UNDER_NEGOTIATION
  const isEditable = !quotation || quotation.status === 'DRAFT' || quotation.status === 'UNDER_NEGOTIATION';

  if (loading) {
    return <QuotationBuilderSkeleton />;
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            title="Return to Quotation List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {quotation ? quotation.quotationNumber : 'New Quotation'}
              </h1>
              {quotation && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {quotation.status ? quotation.status.replace(/_/g, ' ') : 'DRAFT'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Configure products, apply compliant discounts, and inspect live margin risk.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!quotation && (
            <button
              onClick={handleCreateDraft}
              disabled={actionLoading || (!selectedCustomerId && customers.length === 0)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Initialize Draft Deal</span>
            </button>
          )}

          {quotation && (
            <>
              {/* Print / PDF Quote */}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Print official quotation proposal"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Proposal</span>
              </button>

              {/* Copy Portal Link */}
              <button
                onClick={handleCopyPortalLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                title="Copy customer negotiation portal link"
              >
                {copiedPortalLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPortalLink ? 'Link Copied!' : 'Copy Portal Link'}</span>
              </button>

              {/* Delete Quotation */}
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading || submitting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          {canAuthorize && activeApproval && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setApprovalAction('REJECT');
                  setApprovalReason('Discount exceeds corporate margin tolerance.');
                  setShowApprovalModal(true);
                }}
                disabled={processingApproval || actionLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 transition cursor-pointer"
              >
                Reject Deal
              </button>
              <button
                onClick={() => {
                  setApprovalAction('APPROVE');
                  setApprovalReason(APPROVAL_PRESETS[0]);
                  setShowApprovalModal(true);
                }}
                disabled={processingApproval || actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize Sign-off</span>
              </button>
            </div>
          )}

          {quotation && isEditable && (
            <button
              onClick={handleSubmitQuotation}
              disabled={submitting || actionLoading || quotation.items.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {quotation.status === 'UNDER_NEGOTIATION'
                ? 'Submit for Manager Sign-off'
                : 'Submit for Approval'}
            </button>
          )}
        </div>
      </div>

      {/* Notification banners */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between gap-3 text-red-700 dark:text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* End-to-End Deal Journey Stepper */}
      <DealLifecycleStepper
        status={quotation ? quotation.status : 'DRAFT'}
        quotationNumber={quotation ? quotation.quotationNumber : 'NEW DEAL'}
        orderNumber={quotation?.orderId ? `SO-${quotation.quotationNumber.replace('QT-', '')}` : undefined}
        createdAt={quotation?.createdAt}
        updatedAt={quotation?.updatedAt}
      />

      {/* Customer Counter-Proposal Active Banner */}
      {quotation && quotation.status === 'UNDER_NEGOTIATION' && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Customer Counter-Proposal Active</p>
              <p className="text-amber-800 dark:text-amber-400 mt-0.5">
                The client requested custom terms on this deal. Review requested line item discounts, margin impacts, or submit for governance review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Pending Banner */}
      {quotation && (quotation.status === 'PENDING_MANAGER' || quotation.status === 'PENDING_FINANCE') && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-300 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                {quotation.status === 'PENDING_MANAGER' ? 'Awaiting Level 1 Sign-off (Sales Operations)' : 'Awaiting Level 2 Escalation (Finance Controller)'}
              </p>
              <p className="text-purple-800 dark:text-purple-400 mt-0.5">
                This deal has exceeded standard category discount limits and requires formal authorization before order confirmation.
              </p>
            </div>
          </div>
          {canAuthorize && activeApproval && (
            <button
              onClick={() => {
                setApprovalAction('APPROVE');
                setApprovalReason(APPROVAL_PRESETS[0]);
                setShowApprovalModal(true);
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-900 text-white hover:bg-purple-800 dark:bg-white dark:text-black transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              Sign-off Now
            </button>
          )}
        </div>
      )}

      {/* Customer & Governance Context Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Customer Account
            </label>
            {!quotation ? (
              <div className="space-y-1.5">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.customerTier?.name || 'Standard'} Tier)
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>Applies customer tier discount ceiling</span>
                  <button
                    type="button"
                    onClick={handleCreateDraft}
                    disabled={actionLoading || !selectedCustomerId}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Start Empty Draft →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-sm">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <span>{currentCustomer?.companyName}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Contact: {currentCustomer?.name} • {currentCustomer?.email}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Customer Tier Governance
            </label>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                {currentCustomer?.customerTier?.name || 'Gold'} Tier
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Baseline Ceiling: {currentCustomer?.customerTier?.defaultDiscount || 15}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Commercial Policy Governance Rule (Zero Spend Automation)
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Category Policy Ceilings
            </label>
            <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Hardware: Max 15% discount (Min 20% margin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Services: Max 10% discount (Min 35% margin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Subscriptions: Max 5% discount (Recurring MRR)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Quotation Cart & Product Catalog (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cart / Line items */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quotation Line Items ({quotation?.items?.length || 0})
                </h3>
              </div>
              {actionLoading && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </div>
              )}
            </div>

            {!quotation || quotation.items.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 space-y-2">
                <FileCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Your quotation cart is empty.</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
                  Click "+ Add to Quote" on any product from the catalog below to begin constructing this deal.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-950/40 text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product & Category</th>
                      <th className="py-2.5 px-2.5">Unit Price</th>
                      <th className="py-2.5 px-2.5">Quantity</th>
                      <th className="py-2.5 px-2.5">Discount %</th>
                      <th className="py-2.5 px-2.5">Line Total</th>
                      <th className="py-2.5 px-2.5">Margin</th>
                      {isEditable && <th className="py-2.5 px-2.5 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-800 dark:text-zinc-200">
                    {quotation.items.map((item) => {
                      const itemMargin = Number(item.marginPercentage || 0);
                      const hasExcess = Number(item.discountExcess || 0) > 0;
                      const draft = itemDrafts[item.id] || {
                        quantity: item.quantity,
                        discountPercentage: item.discountPercentage,
                      };

                      const categoryName = item.product?.category?.name || 'HARDWARE';
                      const isRecurring = item.product?.isRecurring || categoryName === 'SUBSCRIPTIONS';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              {item.product?.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                                  <Layers className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{item.product?.name}</span>
                                  {/* Category Badge */}
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      categoryName === 'HARDWARE'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                        : categoryName === 'SERVICES'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                    }`}
                                  >
                                    {categoryName}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                                  SKU: {item.product?.sku}
                                  {isRecurring ? (
                                    <span className="ml-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                                      • Monthly SaaS
                                    </span>
                                  ) : (
                                    <span className="ml-1.5 text-slate-400 font-normal">
                                      • One-Time
                                    </span>
                                  )}
                                </div>
                                {hasExcess && (
                                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>
                                      {Number(item.discountExcess || 0).toFixed(1)}% above limit ({item.discountLimit || 0}%)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2.5 whitespace-nowrap font-mono text-[11px]">
                            ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-2.5 whitespace-nowrap">
                            {isEditable ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const next = Math.max(1, Number(draft.quantity) - 1);
                                    setItemDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: next },
                                    }));
                                    handleUpdateItem(item.id, next, Number(draft.discountPercentage));
                                  }}
                                  disabled={Number(draft.quantity) <= 1 || actionLoading}
                                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={draft.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setItemDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: val },
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const next = Math.max(1, Number(e.target.value) || 1);
                                    handleUpdateItem(item.id, next, Number(draft.discountPercentage));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                  }}
                                  className="w-10 text-center py-0.5 text-xs font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded text-slate-900 dark:text-zinc-100"
                                />
                                <button
                                  onClick={() => {
                                    const next = Number(draft.quantity) + 1;
                                    setItemDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: next },
                                    }));
                                    handleUpdateItem(item.id, next, Number(draft.discountPercentage));
                                  }}
                                  disabled={actionLoading}
                                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="font-mono">{item.quantity}</span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 whitespace-nowrap">
                            {isEditable ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={draft.discountPercentage}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setItemDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], discountPercentage: val },
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const next = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    handleUpdateItem(item.id, Number(draft.quantity), next);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                  }}
                                  className={`w-14 px-1.5 py-0.5 text-xs font-mono bg-slate-50 dark:bg-zinc-950 border rounded text-slate-900 dark:text-zinc-100 ${
                                    hasExcess
                                      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                                      : 'border-slate-200 dark:border-zinc-700'
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px]">%</span>
                              </div>
                            ) : (
                              <span>{item.discountPercentage}%</span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap font-mono text-[11px]">
                            ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-2.5 whitespace-nowrap font-mono text-[11px]">
                            <span
                              className={`font-semibold ${
                                itemMargin >= 30
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : itemMargin >= 20
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {itemMargin.toFixed(1)}%
                            </span>
                          </td>
                          {isEditable && (
                            <td className="py-3 px-2.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={actionLoading}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Product Catalog Picker */}
          {isEditable && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add Products from Catalog
                  </h3>
                  <span className="text-xs text-slate-400 font-normal">
                    ({filteredProducts.length} available)
                  </span>
                </div>

                {/* Category filter pills - flex-wrap to avoid truncation */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Search in Catalog */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter catalog products by name or SKU (e.g. MacBook, Setup, Cloud)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
                    No products found matching "{catalogSearch}".
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const cat = prod.category?.name || 'HARDWARE';
                    return (
                      <div
                        key={prod.id}
                        className="border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-lg p-3.5 flex items-center justify-between gap-3 transition-all group bg-slate-50/40 dark:bg-zinc-950/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                              <Layers className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">
                              SKU: {prod.sku} • ₹{Number(prod.basePrice).toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  cat === 'HARDWARE'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                    : cat === 'SERVICES'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                }`}
                              >
                                {cat}
                              </span>
                              {prod.isRecurring && (
                                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded">
                                  Monthly SaaS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddProduct(prod)}
                          disabled={actionLoading}
                          className="p-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                          title="Add to quotation"
                        >
                          {addingProductId === prod.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Discussion & Client Messages Panel */}
          {quotation && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Commercial Discussion & Client Messages
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {comments.length} message{comments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Messages list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 py-3 text-center">
                    No negotiation notes yet. Messages posted here synchronize with the Customer Portal.
                  </p>
                ) : (
                  comments.map((c: any) => {
                    const isClient = c.authorType === 'CUSTOMER' || c.authorRole === 'CUSTOMER';
                    const isManager = c.authorType === 'MANAGER' || c.authorRole === 'SALES_MANAGER';
                    const roleBadgeLabel = isClient ? 'Client' : isManager ? 'Manager' : 'Sales Rep';
                    const authorLabel =
                      c.authorName ||
                      (isClient ? (currentCustomer?.companyName || 'Client Customer') : (currentUser?.username || 'Sales Rep'));

                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          isClient
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-slate-800 dark:text-zinc-200 mr-8'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-slate-800 dark:text-zinc-200 ml-8'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isClient
                                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                  : 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200'
                              }`}
                            >
                              {roleBadgeLabel}
                            </span>
                            <span className="text-slate-900 dark:text-white font-medium">{authorLabel}</span>
                          </span>
                          <span className="text-slate-400 dark:text-zinc-500">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{c.comment || c.message || c.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post negotiation note or respond to client..."
                  disabled={postingComment}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
                >
                  {postingComment ? 'Posting...' : 'Reply'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Financial Summary, Live Margin Gauge, Risk & Upsell Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Totals & Live Margin Gauge */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Deal Financials & Margin
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>Gross Subtotal</span>
                <span className="font-mono">
                  ₹{Number(quotation?.subtotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>Total Discount Applied</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  -₹{Number(quotation?.discountAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>GST / Tax (18%)</span>
                <span className="font-mono">
                  ₹{Number(quotation?.taxAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-zinc-800 pt-2.5 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Deal Value</span>
                <span className="font-mono">
                  ₹{Number(quotation?.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Hybrid Ledger Split (Hardware CapEx vs Recurring OpEx) */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 space-y-1.5 text-[11px]">
              <div className="font-semibold text-slate-700 dark:text-zinc-300">
                Hybrid Deal Structure:
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>• One-Time CapEx (Hardware & Services):</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  ₹{hybridSplit.oneTimeGross.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                <span>• Recurring OpEx (Monthly SaaS):</span>
                <span className="font-mono font-semibold">
                  ₹{hybridSplit.recurringMonthlyGross.toLocaleString('en-IN')} / mo
                </span>
              </div>
            </div>

            {/* Live Gross Margin Gauge */}
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  Deal Gross Margin
                </span>
                <span className={`text-sm font-bold font-mono ${marginColor}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>

              {/* Progress meter */}
              <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${marginProgressColor} transition-all duration-300`}
                  style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                <span>Floor: 20%</span>
                <span>Target: 30%+</span>
              </div>
            </div>

            {/* Blended Discount Risk Score (BRS) Badge */}
            <div className={`p-4 rounded-xl border ${riskDetails.badgeClass} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <RiskIcon className="w-4 h-4" />
                  <span>{riskDetails.label}</span>
                </div>
                <span className="font-mono font-bold text-xs">
                  BRS: {Number(riskScore).toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {riskDetails.description}
              </p>

              {/* Explain Risk Formulation Button */}
              {quotation && quotation.items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRiskBreakdown(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold underline hover:opacity-80 transition cursor-pointer pt-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Inspect Risk Formulation Breakdown</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Upsell & Cross-Sell Panel (Section B5) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  AI Margin Recommendations
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400">
                AI Engine
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Co-purchase algorithms identified high-margin companion products tailored for this deal.
            </p>

            {recommendations.length === 0 ? (
              <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs">
                Add products to your cart to trigger co-purchase intelligence.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {rec.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">
                          ₹{Number(rec.price).toLocaleString('en-IN')} • {rec.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 whitespace-nowrap font-mono">
                        +₹{Number(rec.marginDelta).toLocaleString('en-IN')} Margin
                      </span>
                    </div>

                    {isEditable && (
                      <button
                        onClick={() => handleAddRecommendation(rec)}
                        disabled={actionLoading}
                        className="w-full mt-2 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {addingRecId === rec.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Add to Quote</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Quotation
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  {quotation?.quotationNumber}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete this quotation? This action will cascade delete all associated line items, approvals, comments, and negotiation records.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuotation}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blended Risk Score Formulation Breakdown Modal */}
      {showRiskBreakdown && quotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  <span>Blended Risk Score (BRS) Governance Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                  Deal: {quotation.quotationNumber} • Account: {currentCustomer?.companyName}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskDetails.badgeClass}`}>
                BRS: {Number(riskScore).toFixed(1)}%
              </span>
            </div>

            {/* Governance Formula Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 dark:text-zinc-200">
                BRS Governance Formulation:
              </div>
              <div className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2 rounded border border-slate-200 dark:border-zinc-800">
                Risk Score = ∑ [ Discount Excess × Financial Weight × Margin Sensitivity × 2.5 ]
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Excess is measured against category ceilings. Sensitive margins (&lt;20%) incur an additional 1.5x penalty to prevent margin leakage.
              </p>
            </div>

            {/* Line items contribution table */}
            <div className="overflow-x-auto max-h-60 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Applied vs Limit</th>
                    <th className="py-2.5 px-3">Excess</th>
                    <th className="py-2.5 px-3">Margin</th>
                    <th className="py-2.5 px-3 text-right">Risk Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200">
                  {quotation.items.map((it) => {
                    const excess = Number(it.discountExcess || 0);
                    const risk = Number(it.riskContribution || 0);
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {it.product?.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">
                            {it.product?.category?.name || 'HARDWARE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {it.discountPercentage}% (Limit {it.discountLimit || 0}%)
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold">
                          {excess > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">+{excess.toFixed(1)}%</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0.0%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {Number(it.marginPercentage || 0).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {risk > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">+{risk.toFixed(2)} pts</span>
                          ) : (
                            <span className="text-slate-400">0.00 pts</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Approval Level Triggered: <strong>{quotation.approvalLevel === 0 ? 'Tier 0 (Auto-Approved)' : quotation.approvalLevel === 1 ? 'Tier 1 (Sales Manager)' : 'Tier 2 (Finance Controller)'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowRiskBreakdown(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Decision Modal */}
      {showApprovalModal && activeApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {approvalAction === 'APPROVE' ? 'Authorize Quotation Sign-off' : 'Reject Quotation'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {quotation?.quotationNumber} • Account: {currentCustomer?.companyName}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  approvalAction === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {approvalAction}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {approvalAction === 'APPROVE'
                ? 'Approving will immediately update the quotation to APPROVED and notify the customer in their portal so they can confirm fulfillment.'
                : 'Rejecting will flag the deal as rejected and halt order conversion.'}
            </p>

            {/* Quick Compliance Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Quick Compliance Presets
              </label>
              <div className="space-y-1.5">
                {APPROVAL_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setApprovalReason(p)}
                    className={`w-full text-left p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                      approvalReason === p
                        ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleProcessApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Audit Rationale Note (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  placeholder="Explain commercial sign-off reason..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={processingApproval}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingApproval || !approvalReason.trim()}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition-colors cursor-pointer disabled:opacity-50 ${
                    approvalAction === 'APPROVE'
                      ? 'bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingApproval ? 'Signing off...' : `Confirm ${approvalAction === 'APPROVE' ? 'Authorization' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

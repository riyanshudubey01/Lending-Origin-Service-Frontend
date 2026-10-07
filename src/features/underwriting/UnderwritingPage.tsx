import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { authService } from '../auth/authService';
import { applicationService } from '../../services/applicationService';
import { creditService } from '../../services/creditService';
import { customerService } from '../../services/customerService';
import { underwritingService } from '../../services/underwritingService';
import type { CreditCheckResult, Customer, LoanApplication, UnderwritingResult } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function UnderwritingPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [creditCheck, setCreditCheck] = useState<CreditCheckResult | null>(null);
  const [underwritingResult, setUnderwritingResult] = useState<UnderwritingResult | null>(null);
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const id = Number(applicationId);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('Application not found.');
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [nextApplication, nextCreditCheck, nextUnderwritingResult] = await Promise.all([
          applicationService.getApplicationById(id),
          creditService.getCreditCheckResult(id),
          underwritingService.getUnderwritingResult(id),
        ]);

        if (!nextApplication) {
          setError('Application not found.');
          return;
        }

        const nextCustomer = await customerService.getCustomerById(nextApplication.customerId);

        setApplication(nextApplication);
        setCreditCheck(nextCreditCheck);
        setCustomer(nextCustomer);
        setUnderwritingResult(nextUnderwritingResult);
      } catch {
        setError('Unable to load underwriting details.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id]);

  const handleDecision = async (selectedDecision: 'APPROVED' | 'REJECTED') => {
    if (!application) {
      return;
    }

    const trimmed = remarks.trim();
    if (!trimmed) {
      setError(selectedDecision === 'APPROVED' ? 'Approval remarks are required.' : 'Rejection remarks are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reviewedBy = authService.getCurrentUser()?.username ?? 'Credit Officer';
      const result = selectedDecision === 'APPROVED'
        ? await underwritingService.approveApplication(application.id, trimmed, reviewedBy)
        : await underwritingService.rejectApplication(application.id, trimmed, reviewedBy);

      setUnderwritingResult(result);
      setDecision(null);
      setRemarks('');
      navigate(`/applications/${application.id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit underwriting decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-block"><p>Loading underwriting summary...</p></div>;
  }

  if (error || !application || !customer) {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>{error || 'Application not found.'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Underwriting review</p>
          <h1>Application #{application.id}</h1>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <h3>Customer information</h3>
        </div>

        <div className="info-grid">
          <div>
            <span className="label">Customer Name</span>
            <strong>{customer.fullName}</strong>
          </div>
          <div>
            <span className="label">Customer ID</span>
            <strong>{customer.id}</strong>
          </div>
          <div>
            <span className="label">Employment Type</span>
            <strong>{customer.employmentType}</strong>
          </div>
          <div>
            <span className="label">Monthly Income</span>
            <strong>{formatCurrency(customer.monthlyIncome)}</strong>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Loan information</h3>
        </div>

        <div className="info-grid">
          <div>
            <span className="label">Application ID</span>
            <strong>{application.id}</strong>
          </div>
          <div>
            <span className="label">Loan Type</span>
            <strong>{application.loanType}</strong>
          </div>
          <div>
            <span className="label">Requested Amount</span>
            <strong>{formatCurrency(application.requestedAmount)}</strong>
          </div>
          <div>
            <span className="label">Tenure</span>
            <strong>{application.tenureMonths} months</strong>
          </div>
          <div>
            <span className="label">Purpose</span>
            <strong>{application.purpose}</strong>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Eligibility and credit</h3>
        </div>

        <div className="info-grid">
          <div>
            <span className="label">Eligibility Status</span>
            <strong>{application.status === 'ELIGIBILITY_FAILED' ? 'Failed' : 'Passed'}</strong>
          </div>
          <div>
            <span className="label">Credit Score</span>
            <strong>{creditCheck?.creditScore ?? 'Not available'}</strong>
          </div>
          <div>
            <span className="label">Credit Check Status</span>
            <strong>{creditCheck ? (creditCheck.passed ? 'PASSED' : 'FAILED') : 'Not available'}</strong>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Underwriting decision</h3>
        </div>

        {underwritingResult ? (
          <div className="result-card">
            <h4>{underwritingResult.decision}</h4>
            <p><strong>Remarks:</strong> {underwritingResult.remarks}</p>
            <p><strong>Reviewer:</strong> {underwritingResult.reviewedBy}</p>
            <p><strong>Review Date:</strong> {formatDate(underwritingResult.reviewedAt)}</p>
          </div>
        ) : (
          <div className="form-card">
            <div className="form-grid">
              {decision === 'APPROVE' || decision === 'REJECT' ? (
                <>
                  <div className="field field--full">
                    <label className="field__label">
                      {decision === 'APPROVE' ? 'Approval remarks' : 'Rejection reason'}
                    </label>
                    <textarea
                      className="input textarea"
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={() => { setDecision(null); setRemarks(''); }}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleDecision(decision === 'APPROVE' ? 'APPROVED' : 'REJECTED')}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : (decision === 'APPROVE' ? 'Approve Application' : 'Reject Application')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={() => navigate(`/applications/${application.id}`)}>
                    Back to application
                  </Button>
                  <Button type="button" onClick={() => setDecision('APPROVE')}>
                    Approve
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setDecision('REJECT')}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error ? <div className="inline-error">{error}</div> : null}
    </div>
  );
}

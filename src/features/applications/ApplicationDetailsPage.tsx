import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '../../components/common/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { creditService } from '../../services/creditService';
import { customerService } from '../../services/customerService';
import { eligibilityService } from '../../services/eligibilityService';
import { sanctionService } from '../../services/sanctionService';
import { timelineService } from '../../services/timelineService';
import { underwritingService } from '../../services/underwritingService';
import type { ApplicationTimelineEvent, CreditCheckResult, Customer, LoanApplication } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getNextAction, getWorkflowStepIndex, workflowSteps } from '../../utils/applicationWorkflow';
import { authService } from '../auth/authService';

export function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [creditCheck, setCreditCheck] = useState<CreditCheckResult | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; reasons: string[] } | null>(null);
  const [timeline, setTimeline] = useState<ApplicationTimelineEvent[]>([]);
  const [showSanctionDialog, setShowSanctionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const applicationId = Number(id);
  const user = authService.getCurrentUser();
  const currentStepIndex = application ? getWorkflowStepIndex(application.status) : -1;
  const nextActionLabel = application ? getNextAction(application.status) : 'No Action';

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const nextApplication = await applicationService.getApplicationById(applicationId);

      if (!nextApplication) {
        setError('Application not found.');
        return;
      }

      const nextCustomer = await customerService.getCustomerById(nextApplication.customerId);
      const nextCreditCheck = await creditService.getCreditCheckResult(applicationId);
      const nextTimeline = timelineService.getTimeline(applicationId);

      setApplication(nextApplication);
      setCustomer(nextCustomer);
      setCreditCheck(nextCreditCheck);
      setTimeline(nextTimeline);

      if (nextApplication.status === 'ELIGIBILITY_FAILED' || nextApplication.status === 'ELIGIBILITY_PASSED') {
        setEligibilityResult({
          eligible: nextApplication.status === 'ELIGIBILITY_PASSED',
          reasons: nextApplication.status === 'ELIGIBILITY_PASSED' ? [] : ['Monthly income must be at least ₹30,000 or requested amount exceeds the maximum allowed amount.'],
        });
      } else {
        setEligibilityResult(null);
      }
    } catch {
      setError('Unable to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      setError('Application not found.');
      setLoading(false);
      return;
    }

    void loadData();
  }, [applicationId]);

  const handleSubmitApplication = async () => {
    if (!application) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const updatedApplication = await applicationService.updateApplication(application.id, {
        status: 'SUBMITTED',
      });
      setApplication(updatedApplication);
    } catch {
      setError('Unable to submit application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEligibilityCheck = async () => {
    if (!application) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const result = await eligibilityService.checkEligibility(application.id);
      setEligibilityResult({ eligible: result.eligible, reasons: result.reasons });
      const nextApplication = await applicationService.getApplicationById(application.id);
      setApplication(nextApplication);
    } catch {
      setError('Eligibility check failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreditCheck = async () => {
    if (!application) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const result = await creditService.runCreditCheck(application.id);
      setCreditCheck(result);
      const nextApplication = await applicationService.getApplicationById(application.id);
      setApplication(nextApplication);
    } catch {
      setError('Credit check failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartUnderwriting = async () => {
    if (!application) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await underwritingService.startUnderwriting(application.id);
      const nextApplication = await applicationService.getApplicationById(application.id);
      setApplication(nextApplication);
      navigate(`/underwriting/${application.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to start underwriting.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSanction = async () => {
    if (!application) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const sanction = await sanctionService.createSanction(application.id);
      if (sanction) {
        navigate(`/sanction/${application.id}`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to generate sanction.');
    } finally {
      setActionLoading(false);
      setShowSanctionDialog(false);
    }
  };

  if (loading) {
    return <div className="page-block"><p>Loading application details...</p></div>;
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
          <p className="eyebrow">Application details</p>
          <h1>Application #{application.id}</h1>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <h3>Application journey</h3>
        </div>
        <div className="workflow-stepper">
          {workflowSteps.map((step, index) => {
            const isComplete = index < currentStepIndex || application.status === step.status;
            const isActive = index === currentStepIndex;

            return (
              <div
                key={step.status}
                className={`workflow-step ${isActive ? 'workflow-step--active' : ''} ${isComplete ? 'workflow-step--complete' : ''}`.trim()}
              >
                {step.label}
              </div>
            );
          })}
        </div>
        <div className="result-card" style={{ marginTop: '16px' }}>
          <strong>Next action:</strong> {nextActionLabel}
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Customer</h3>
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
            <span className="label">Monthly Income</span>
            <strong>{formatCurrency(customer.monthlyIncome)}</strong>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Loan Details</h3>
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
          <div>
            <span className="label">Created</span>
            <strong>{formatDate(application.createdAt)}</strong>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--spaced">
        <div className="panel-card__header">
          <h3>Actions</h3>
        </div>

        {application.status === 'DRAFT' && user?.role === 'SALES' ? (
          <Button onClick={() => void handleSubmitApplication()} disabled={actionLoading}>
            {actionLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        ) : null}

        {application.status === 'SUBMITTED' ? (
          <Button onClick={() => void handleEligibilityCheck()} disabled={actionLoading}>
            {actionLoading ? 'Checking eligibility...' : 'Check Eligibility'}
          </Button>
        ) : null}

        {application.status === 'ELIGIBILITY_PASSED' ? (
          <Button onClick={() => void handleCreditCheck()} disabled={actionLoading}>
            {actionLoading ? 'Running credit check...' : 'Run Credit Check'}
          </Button>
        ) : null}

        {application.status === 'CREDIT_PASSED' ? (
          <Button onClick={() => void handleStartUnderwriting()} disabled={actionLoading}>
            {actionLoading ? 'Opening underwriting...' : 'Start Underwriting'}
          </Button>
        ) : null}

        {application.status === 'UNDERWRITING' ? (
          <Button onClick={() => navigate(`/underwriting/${application.id}`)} disabled={actionLoading}>
            Open Underwriting
          </Button>
        ) : null}

        {application.status === 'APPROVED' ? (
          <Button onClick={() => setShowSanctionDialog(true)} disabled={actionLoading}>
            {actionLoading ? 'Generating sanction...' : 'Generate Sanction'}
          </Button>
        ) : null}

        {application.status === 'SANCTIONED' || application.status === 'READY_FOR_DISBURSEMENT' ? (
          <Button onClick={() => navigate(`/sanction/${application.id}`)} disabled={actionLoading}>
            View Sanction
          </Button>
        ) : null}

        {application.status === 'READY_FOR_DISBURSEMENT' ? (
          <Button onClick={() => navigate(`/disbursement/${application.id}`)} disabled={actionLoading}>
            Disburse Loan
          </Button>
        ) : null}

        {application.status === 'DISBURSED' ? (
          <Button onClick={() => navigate(`/disbursement/${application.id}`)} disabled={actionLoading}>
            View Disbursement
          </Button>
        ) : null}

        {eligibilityResult ? (
          <div className="result-card">
            <h4>{eligibilityResult.eligible ? 'Eligibility Passed' : 'Eligibility Failed'}</h4>
            {!eligibilityResult.eligible && eligibilityResult.reasons.length > 0 ? (
              <ul>
                {eligibilityResult.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {creditCheck ? (
          <div className="result-card">
            <h4>Credit Score: {creditCheck.creditScore}</h4>
            <p>
              <strong>Credit Check:</strong> {creditCheck.passed ? 'PASSED' : 'FAILED'}
            </p>
          </div>
        ) : null}
      </div>

      {timeline.length > 0 ? (
        <div className="panel-card panel-card--spaced">
          <div className="panel-card__header">
            <h3>Timeline</h3>
          </div>
          <ul className="timeline-list">
            {timeline.map((event) => (
              <li key={event.id} className="timeline-item">
                <span className="timeline-item__dot" aria-hidden="true" />
                <div>
                  <strong>{event.label}</strong>
                  <div>{formatDate(event.timestamp)}</div>
                  {event.performedBy ? <div>Performed by: {event.performedBy}</div> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <div className="inline-error">{error}</div> : null}

      <ConfirmDialog
        open={showSanctionDialog}
        title="Generate sanction"
        message="This will create the sanction letter and move the application to the sanction stage."
        confirmLabel="Generate sanction"
        onConfirm={() => void handleGenerateSanction()}
        onCancel={() => setShowSanctionDialog(false)}
      />
    </div>
  );
}

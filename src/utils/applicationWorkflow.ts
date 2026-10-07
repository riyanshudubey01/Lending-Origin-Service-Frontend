import type { LoanApplicationStatus } from '../types';

export const workflowSteps: Array<{ status: LoanApplicationStatus; label: string }> = [
  { status: 'DRAFT', label: 'Application' },
  { status: 'SUBMITTED', label: 'Submitted' },
  { status: 'ELIGIBILITY_PASSED', label: 'Eligibility' },
  { status: 'CREDIT_PASSED', label: 'Credit' },
  { status: 'UNDERWRITING', label: 'Underwriting' },
  { status: 'APPROVED', label: 'Approval' },
  { status: 'SANCTIONED', label: 'Sanction' },
  { status: 'READY_FOR_DISBURSEMENT', label: 'Disbursement' },
  { status: 'DISBURSED', label: 'Completed' },
];

export function getNextAction(status: LoanApplicationStatus): string {
  const actionMap: Record<LoanApplicationStatus, string> = {
    DRAFT: 'Submit Application',
    SUBMITTED: 'Check Eligibility',
    ELIGIBILITY_FAILED: 'No Action',
    ELIGIBILITY_PASSED: 'Run Credit Check',
    CREDIT_CHECK: 'Run Credit Check',
    CREDIT_FAILED: 'No Action',
    CREDIT_PASSED: 'Start Underwriting',
    UNDERWRITING: 'Review Application',
    APPROVED: 'Generate Sanction',
    REJECTED: 'No Action',
    SANCTIONED: 'Ready for Disbursement',
    READY_FOR_DISBURSEMENT: 'Disburse Loan',
    DISBURSED: 'Completed',
  };

  return actionMap[status] ?? 'No Action';
}

export function getWorkflowStepIndex(status: LoanApplicationStatus): number {
  const index = workflowSteps.findIndex((step) => step.status === status);
  return index >= 0 ? index : workflowSteps.length - 1;
}

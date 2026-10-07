interface StatusBadgeProps {
  status: string;
}

const statusClassMap: Record<string, string> = {
  DRAFT: 'status-badge status-badge--neutral',
  SUBMITTED: 'status-badge status-badge--info',
  ELIGIBILITY_FAILED: 'status-badge status-badge--danger',
  ELIGIBILITY_PASSED: 'status-badge status-badge--success',
  CREDIT_CHECK: 'status-badge status-badge--info',
  CREDIT_FAILED: 'status-badge status-badge--danger',
  CREDIT_PASSED: 'status-badge status-badge--success',
  UNDERWRITING: 'status-badge status-badge--info',
  APPROVED: 'status-badge status-badge--success',
  REJECTED: 'status-badge status-badge--danger',
  SANCTIONED: 'status-badge status-badge--warning',
  READY_FOR_DISBURSEMENT: 'status-badge status-badge--warning',
  DISBURSED: 'status-badge status-badge--success',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={statusClassMap[status] ?? 'status-badge'}>{status}</span>;
}

export type UserRole =
  | 'SALES'
  | 'CREDIT_OFFICER'
  | 'DISBURSEMENT_OFFICER';

export type EmploymentType = 'SALARIED' | 'SELF_EMPLOYED';

export type LoanType = 'PERSONAL' | 'HOME' | 'AUTO';

export type LoanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ELIGIBILITY_FAILED'
  | 'ELIGIBILITY_PASSED'
  | 'CREDIT_CHECK'
  | 'CREDIT_FAILED'
  | 'CREDIT_PASSED'
  | 'UNDERWRITING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SANCTIONED'
  | 'READY_FOR_DISBURSEMENT'
  | 'DISBURSED';

export type LoanApplicationStatus = LoanStatus;

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Customer {
  id: number;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  monthlyIncome: number;
  createdAt: string;
}

export type CustomerFormValues = {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  monthlyIncome: string;
};

export interface LoanApplication {
  id: number;
  applicationNumber?: string;
  customerId: number;
  loanType: LoanType;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  checkedAt: string;
}

export interface CreditCheckResult {
  applicationId: number;
  creditScore: number;
  passed: boolean;
  checkedAt: string;
}

export interface UnderwritingResult {
  applicationId: number;
  decision?: 'APPROVED' | 'REJECTED';
  remarks: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface Sanction {
  id: number;
  applicationId: number;
  sanctionedAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  sanctionedAt: string;
  sanctionedBy: string;
}

export interface Disbursement {
  id: number;
  applicationId: number;
  amount: number;
  accountNumber: string;
  transactionReference: string;
  disbursedAt: string;
  disbursedBy: string;
  status: 'SUCCESS';
}

export interface DashboardSummary {
  totalCustomers: number;
  totalApplications: number;
  pendingApplications: number;
  underwritingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  readyForDisbursement: number;
  disbursedApplications: number;
}

export interface ApplicationTimelineEvent {
  id: number;
  applicationId: number;
  status: LoanStatus;
  label: string;
  timestamp: string;
  performedBy?: string;
}

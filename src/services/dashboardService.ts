import type { DashboardSummary } from '../types';
import { applicationService } from './applicationService';
import { customerService } from './customerService';

const PENDING_STATUSES = new Set([
  'SUBMITTED',
  'CREDIT_PASSED',
  'APPROVED',
  'READY_FOR_DISBURSEMENT',
]);

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const [customers, applications] = await Promise.all([
      customerService.getCustomers(),
      applicationService.getApplications(),
    ]);

    return {
      totalCustomers: customers.length,
      totalApplications: applications.length,
      pendingApplications: applications.filter((application) => PENDING_STATUSES.has(application.status)).length,
      underwritingApplications: applications.filter((application) => application.status === 'UNDERWRITING').length,
      approvedApplications: applications.filter((application) => application.status === 'APPROVED').length,
      rejectedApplications: applications.filter((application) => application.status === 'REJECTED').length,
      readyForDisbursement: applications.filter((application) => application.status === 'READY_FOR_DISBURSEMENT').length,
      disbursedApplications: applications.filter((application) => application.status === 'DISBURSED').length,
    };
  },
};

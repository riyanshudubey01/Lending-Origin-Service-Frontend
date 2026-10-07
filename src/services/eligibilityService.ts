import type { EligibilityResult } from '../types';
import { customerService } from './customerService';
import { applicationService } from './applicationService';

export const eligibilityService = {
  async checkEligibility(applicationId: number): Promise<EligibilityResult> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    const customer = await customerService.getCustomerById(application.customerId);

    if (!customer) {
      throw new Error('Customer not found.');
    }

    const reasons: string[] = [];

    if (customer.monthlyIncome < 30000) {
      reasons.push('Monthly income must be at least ₹30,000');
    }

    const highestAllowedAmount = customer.monthlyIncome * 10;

    if (application.requestedAmount > highestAllowedAmount) {
      reasons.push('Requested amount exceeds the maximum allowed amount');
    }

    const eligible = reasons.length === 0;

    await applicationService.updateApplication(applicationId, {
      status: eligible ? 'ELIGIBILITY_PASSED' : 'ELIGIBILITY_FAILED',
    });

    return {
      eligible,
      reasons,
      checkedAt: new Date().toISOString(),
    };
  },
};

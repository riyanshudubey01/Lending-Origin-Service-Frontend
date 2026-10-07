import type { CreditCheckResult } from '../types';
import { applicationService } from './applicationService';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'los_credit_checks';

const getStoredChecks = (): CreditCheckResult[] => storage.get<CreditCheckResult[]>(STORAGE_KEY) ?? [];

export const creditService = {
  async runCreditCheck(applicationId: number): Promise<CreditCheckResult> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.status !== 'ELIGIBILITY_PASSED') {
      throw new Error('Credit check can only run after eligibility passes.');
    }

    const creditScore = applicationId % 2 === 0 ? 780 : 650;
    const result: CreditCheckResult = {
      applicationId,
      creditScore,
      passed: creditScore >= 700,
      checkedAt: new Date().toISOString(),
    };

    const storedChecks = getStoredChecks();
    const nextChecks = storedChecks.filter((check) => check.applicationId !== applicationId);
    nextChecks.push(result);
    storage.set(STORAGE_KEY, nextChecks);

    await applicationService.updateApplication(applicationId, {
      status: result.passed ? 'CREDIT_PASSED' : 'CREDIT_FAILED',
    });

    return result;
  },

  async getCreditCheckResult(applicationId: number): Promise<CreditCheckResult | null> {
    const checks = getStoredChecks();
    return checks.find((check) => check.applicationId === applicationId) ?? null;
  },
};

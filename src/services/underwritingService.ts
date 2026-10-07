import type { UnderwritingResult } from '../types';
import { applicationService } from './applicationService';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'los_underwriting';

const readResults = (): UnderwritingResult[] => storage.get<UnderwritingResult[]>(STORAGE_KEY) ?? [];

export const underwritingService = {
  async startUnderwriting(applicationId: number): Promise<void> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.status !== 'CREDIT_PASSED') {
      throw new Error('Only applications with CREDIT_PASSED can enter underwriting.');
    }

    await applicationService.updateApplication(applicationId, { status: 'UNDERWRITING' });
  },

  async approveApplication(applicationId: number, remarks: string, reviewedBy: string): Promise<UnderwritingResult> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.status !== 'UNDERWRITING') {
      throw new Error('Application must be in UNDERWRITING before approval.');
    }

    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      throw new Error('Approval remarks are required.');
    }

    const result: UnderwritingResult = {
      applicationId,
      decision: 'APPROVED',
      remarks: trimmedRemarks,
      reviewedBy: reviewedBy.trim() || 'Credit Officer',
      reviewedAt: new Date().toISOString(),
    };

    const results = readResults().filter((item) => item.applicationId !== applicationId);
    results.push(result);
    storage.set(STORAGE_KEY, results);

    await applicationService.updateApplication(applicationId, { status: 'APPROVED' });

    return result;
  },

  async rejectApplication(applicationId: number, remarks: string, reviewedBy: string): Promise<UnderwritingResult> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.status !== 'UNDERWRITING') {
      throw new Error('Application must be in UNDERWRITING before rejection.');
    }

    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      throw new Error('Rejection remarks are required.');
    }

    const result: UnderwritingResult = {
      applicationId,
      decision: 'REJECTED',
      remarks: trimmedRemarks,
      reviewedBy: reviewedBy.trim() || 'Credit Officer',
      reviewedAt: new Date().toISOString(),
    };

    const results = readResults().filter((item) => item.applicationId !== applicationId);
    results.push(result);
    storage.set(STORAGE_KEY, results);

    await applicationService.updateApplication(applicationId, { status: 'REJECTED' });

    return result;
  },

  async getUnderwritingResult(applicationId: number): Promise<UnderwritingResult | null> {
    return readResults().find((result) => result.applicationId === applicationId) ?? null;
  },
};

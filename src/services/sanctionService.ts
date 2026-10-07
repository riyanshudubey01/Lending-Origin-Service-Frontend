import type { Sanction } from '../types';
import { applicationService } from './applicationService';
import { storage } from '../utils/storage';
import { calculateEmi } from '../utils/loanCalculations';

const STORAGE_KEY = 'los_sanctions';

const getStoredSanctions = (): Sanction[] => storage.get<Sanction[]>(STORAGE_KEY) ?? [];

export const sanctionService = {
  async createSanction(applicationId: number): Promise<Sanction> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.status !== 'APPROVED') {
      throw new Error('Only approved applications can be sanctioned.');
    }

    const existing = getStoredSanctions().find((entry) => entry.applicationId === applicationId);
    if (existing) {
      await applicationService.updateApplication(applicationId, { status: 'READY_FOR_DISBURSEMENT' });
      return existing;
    }

    const sanction: Sanction = {
      id: Date.now(),
      applicationId,
      sanctionedAmount: application.requestedAmount,
      interestRate: 10.5,
      tenureMonths: application.tenureMonths,
      monthlyEmi: calculateEmi(application.requestedAmount, 10.5, application.tenureMonths),
      sanctionedAt: new Date().toISOString(),
      sanctionedBy: 'Credit Officer',
    };

    const sanctions = getStoredSanctions();
    sanctions.push(sanction);
    storage.set(STORAGE_KEY, sanctions);

    await applicationService.updateApplication(applicationId, { status: 'SANCTIONED' });
    await applicationService.updateApplication(applicationId, { status: 'READY_FOR_DISBURSEMENT' });

    return sanction;
  },

  async getSanctionByApplicationId(applicationId: number): Promise<Sanction | null> {
    return getStoredSanctions().find((entry) => entry.applicationId === applicationId) ?? null;
  },
};

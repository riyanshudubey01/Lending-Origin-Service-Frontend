import type { Disbursement } from '../types';
import { applicationService } from './applicationService';
import { storage } from '../utils/storage';
import { sanctionService } from './sanctionService';

const STORAGE_KEY = 'los_disbursements';

const getStoredDisbursements = (): Disbursement[] => storage.get<Disbursement[]>(STORAGE_KEY) ?? [];

const formatReference = (applicationId: number): string => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `DISB-${datePart}-${String(applicationId).padStart(5, '0')}`;
};

export const disbursementService = {
  async disburseLoan(applicationId: number, accountNumber: string, disbursedBy: string): Promise<Disbursement> {
    const application = await applicationService.getApplicationById(applicationId);

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.status !== 'READY_FOR_DISBURSEMENT') {
      throw new Error('Only READY_FOR_DISBURSEMENT applications can be disbursed.');
    }

    const cleanedAccountNumber = accountNumber.replace(/\D/g, '');
    if (cleanedAccountNumber.length < 9 || cleanedAccountNumber.length > 18) {
      throw new Error('Bank account number must contain 9 to 18 digits.');
    }

    const existing = getStoredDisbursements().find((entry) => entry.applicationId === applicationId);
    if (existing) {
      await applicationService.updateApplication(applicationId, { status: 'DISBURSED' });
      return existing;
    }

    const sanction = await sanctionService.getSanctionByApplicationId(applicationId);
    const result: Disbursement = {
      id: Date.now(),
      applicationId,
      amount: sanction?.sanctionedAmount ?? application.requestedAmount,
      accountNumber: cleanedAccountNumber,
      transactionReference: formatReference(applicationId),
      disbursedAt: new Date().toISOString(),
      disbursedBy: disbursedBy.trim() || 'Disbursement Officer',
      status: 'SUCCESS',
    };

    const disbursements = getStoredDisbursements();
    disbursements.push(result);
    storage.set(STORAGE_KEY, disbursements);

    await applicationService.updateApplication(applicationId, { status: 'DISBURSED' });

    return result;
  },

  async getDisbursements(): Promise<Disbursement[]> {
    return getStoredDisbursements();
  },

  async getDisbursementByApplicationId(applicationId: number): Promise<Disbursement | null> {
    return getStoredDisbursements().find((entry) => entry.applicationId === applicationId) ?? null;
  },
};

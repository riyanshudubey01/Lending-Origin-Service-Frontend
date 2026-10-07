import type { LoanApplication, LoanStatus, LoanType } from '../types';
import { storage } from '../utils/storage';
import { timelineService } from './timelineService';

const STORAGE_KEY = 'los_applications';

const now = () => new Date().toISOString();

const VALID_STATUS_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['ELIGIBILITY_FAILED', 'ELIGIBILITY_PASSED'],
  ELIGIBILITY_FAILED: [],
  ELIGIBILITY_PASSED: ['CREDIT_CHECK', 'CREDIT_FAILED', 'CREDIT_PASSED'],
  CREDIT_CHECK: ['CREDIT_PASSED', 'CREDIT_FAILED'],
  CREDIT_FAILED: [],
  CREDIT_PASSED: ['UNDERWRITING'],
  UNDERWRITING: ['APPROVED', 'REJECTED'],
  APPROVED: ['SANCTIONED', 'READY_FOR_DISBURSEMENT'],
  REJECTED: [],
  SANCTIONED: ['READY_FOR_DISBURSEMENT'],
  READY_FOR_DISBURSEMENT: ['DISBURSED'],
  DISBURSED: [],
};

const seedApplications: LoanApplication[] = [
  {
    id: 1,
    applicationNumber: 'APP-1001',
    customerId: 1,
    loanType: 'PERSONAL',
    requestedAmount: 400000,
    tenureMonths: 36,
    purpose: 'Home renovation',
    status: 'SUBMITTED',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 2,
    applicationNumber: 'APP-1002',
    customerId: 2,
    loanType: 'PERSONAL',
    requestedAmount: 900000,
    tenureMonths: 48,
    purpose: 'Business expansion',
    status: 'ELIGIBILITY_FAILED',
    createdAt: '2026-09-12T11:15:00.000Z',
    updatedAt: '2026-09-12T11:15:00.000Z',
  },
  {
    id: 3,
    applicationNumber: 'APP-1003',
    customerId: 3,
    loanType: 'PERSONAL',
    requestedAmount: 350000,
    tenureMonths: 24,
    purpose: 'Education loan',
    status: 'ELIGIBILITY_PASSED',
    createdAt: '2026-09-15T09:30:00.000Z',
    updatedAt: '2026-09-15T09:30:00.000Z',
  },
];

export type CreateApplicationInput = {
  customerId: number;
  loanType: LoanType;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  status?: LoanStatus;
};

const isValidStatusTransition = (currentStatus: LoanStatus, nextStatus: LoanStatus): boolean => {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
};

export const applicationService = {
  async getApplications(): Promise<LoanApplication[]> {
    const stored = storage.get<LoanApplication[]>(STORAGE_KEY);

    if (stored && stored.length > 0) {
      return stored;
    }

    storage.set(STORAGE_KEY, seedApplications);
    return [...seedApplications];
  },

  async getApplicationById(id: number): Promise<LoanApplication | null> {
    const applications = await this.getApplications();
    return applications.find((application) => application.id === id) ?? null;
  },

  async getApplicationsByCustomerId(customerId: number): Promise<LoanApplication[]> {
    const applications = await this.getApplications();
    return applications.filter((application) => application.customerId === customerId);
  },

  async createApplication(data: CreateApplicationInput): Promise<LoanApplication> {
    const applications = await this.getApplications();
    const nextId = applications.reduce((maxId, app) => Math.max(maxId, app.id), 0) + 1;

    const application: LoanApplication = {
      id: nextId,
      applicationNumber: `APP-${String(nextId).padStart(4, '0')}`,
      customerId: data.customerId,
      loanType: data.loanType,
      requestedAmount: data.requestedAmount,
      tenureMonths: data.tenureMonths,
      purpose: data.purpose.trim(),
      status: data.status ?? 'DRAFT',
      createdAt: now(),
      updatedAt: now(),
    };

    const nextApplications = [...applications, application];
    storage.set(STORAGE_KEY, nextApplications);

    timelineService.recordStatusTransition(application.id, application.status, 'Sales');

    return application;
  },

  async updateApplication(
    id: number,
    updates: Partial<LoanApplication>,
  ): Promise<LoanApplication> {
    const applications = await this.getApplications();
    const targetIndex = applications.findIndex((application) => application.id === id);

    if (targetIndex < 0) {
      throw new Error('Application not found.');
    }

    const currentApplication = applications[targetIndex];
    const nextStatus = updates.status ?? currentApplication.status;

    if (nextStatus !== currentApplication.status && !isValidStatusTransition(currentApplication.status, nextStatus)) {
      throw new Error(`Invalid status transition from ${currentApplication.status} to ${nextStatus}.`);
    }

    const updatedApplication: LoanApplication = {
      ...currentApplication,
      ...updates,
      status: nextStatus,
      updatedAt: now(),
    };

    applications[targetIndex] = updatedApplication;
    storage.set(STORAGE_KEY, applications);

    if (nextStatus !== currentApplication.status) {
      timelineService.recordStatusTransition(updatedApplication.id, nextStatus, 'System');
    }

    return updatedApplication;
  },
};

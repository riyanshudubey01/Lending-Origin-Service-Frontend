import type { Customer, CustomerFormValues } from '../types';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'los_customers';

const seedCustomers: Customer[] = [
  {
    id: 1,
    fullName: 'Rahul Sharma',
    dateOfBirth: '1995-05-10',
    email: 'rahul@example.com',
    phone: '9876543210',
    employmentType: 'SALARIED',
    monthlyIncome: 60000,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 2,
    fullName: 'Priya Singh',
    dateOfBirth: '1992-08-15',
    email: 'priya@example.com',
    phone: '9876501234',
    employmentType: 'SELF_EMPLOYED',
    monthlyIncome: 80000,
    createdAt: '2026-09-02T00:00:00.000Z',
  },
  {
    id: 3,
    fullName: 'Amit Verma',
    dateOfBirth: '1988-08-21',
    email: 'amit@example.com',
    phone: '9876543211',
    employmentType: 'SALARIED',
    monthlyIncome: 70000,
    createdAt: '2026-09-03T00:00:00.000Z',
  },
];

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const storedCustomers = storage.get<Customer[]>(STORAGE_KEY);

    if (storedCustomers && storedCustomers.length > 0) {
      return storedCustomers;
    }

    storage.set(STORAGE_KEY, seedCustomers);
    return [...seedCustomers];
  },

  async getCustomerById(id: number): Promise<Customer | null> {
    const customers = await this.getCustomers();
    return customers.find((customer) => customer.id === id) ?? null;
  },

  async createCustomer(data: CustomerFormValues): Promise<Customer> {
    const customers = await this.getCustomers();
    const nextId = customers.reduce((maxId, customer) => Math.max(maxId, customer.id), 0) + 1;

    const customer: Customer = {
      id: nextId,
      fullName: data.fullName.trim(),
      dateOfBirth: data.dateOfBirth,
      email: data.email.trim(),
      phone: data.phone.trim(),
      employmentType: data.employmentType,
      monthlyIncome: Number(data.monthlyIncome),
      createdAt: new Date().toISOString(),
    };

    const nextCustomers = [...customers, customer];
    storage.set(STORAGE_KEY, nextCustomers);
    return customer;
  },
};

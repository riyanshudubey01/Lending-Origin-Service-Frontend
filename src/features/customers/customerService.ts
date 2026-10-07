import { storage } from '../../utils/storage';
import type { Customer, CustomerFormValues } from './customerTypes';

const STORAGE_KEY = 'los_customers';

const seedCustomers: Customer[] = [
  {
    id: 1,
    firstName: 'Rahul',
    lastName: 'Sharma',
    mobile: '9876543210',
    email: 'rahul.sharma@example.com',
    dateOfBirth: '1990-04-15',
    monthlyIncome: 75000,
    employmentType: 'SALARIED',
  },
  {
    id: 2,
    firstName: 'Amit',
    lastName: 'Verma',
    mobile: '9876543211',
    email: 'amit.verma@example.com',
    dateOfBirth: '1988-08-21',
    monthlyIncome: 60000,
    employmentType: 'SALARIED',
  },
  {
    id: 3,
    firstName: 'Priya',
    lastName: 'Singh',
    mobile: '9876543212',
    email: 'priya.singh@example.com',
    dateOfBirth: '1994-11-30',
    monthlyIncome: 90000,
    employmentType: 'SELF_EMPLOYED',
  },
];

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const storedCustomers = storage.get<Customer[]>(STORAGE_KEY);

    if (storedCustomers && storedCustomers.length > 0) {
      return storedCustomers;
    }

    storage.set(STORAGE_KEY, seedCustomers);
    return seedCustomers;
  },

  async getCustomer(id: number): Promise<Customer | null> {
    const customers = await this.getCustomers();
    return customers.find((customer) => customer.id === id) ?? null;
  },

  async createCustomer(data: CustomerFormValues): Promise<Customer> {
    const customers = await this.getCustomers();
    const nextId = customers.reduce((maxId, customer) => Math.max(maxId, customer.id), 0) + 1;

    const customer: Customer = {
      id: nextId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      mobile: data.mobile.trim(),
      email: data.email.trim(),
      dateOfBirth: data.dateOfBirth,
      monthlyIncome: Number(data.monthlyIncome),
      employmentType: data.employmentType,
    };

    const nextCustomers = [...customers, customer];
    storage.set(STORAGE_KEY, nextCustomers);
    return customer;
  },
};

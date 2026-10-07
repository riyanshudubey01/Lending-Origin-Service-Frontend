export type EmploymentType = 'SALARIED' | 'SELF_EMPLOYED';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  monthlyIncome: number;
  employmentType: EmploymentType;
}

export type CustomerFormValues = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  monthlyIncome: string;
  employmentType: EmploymentType;
};

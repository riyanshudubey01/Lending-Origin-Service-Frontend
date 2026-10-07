export const API_ENDPOINTS = {
  customers: '/customers',
  applications: '/applications',
  eligibility: (id: number) => `/applications/${id}/eligibility`,
  creditCheck: (id: number) => `/applications/${id}/credit-check`,
  underwriting: (id: number) => `/applications/${id}/underwriting`,
  sanction: (id: number) => `/applications/${id}/sanction`,
  disbursement: (id: number) => `/applications/${id}/disbursement`,
};

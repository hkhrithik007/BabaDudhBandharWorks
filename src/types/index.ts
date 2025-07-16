export interface User {
  username: string;
  password: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  lastMonthDue: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  rate: number;
  unit: string;
  category: string;
}

export interface DailyEntry {
  id: string;
  customerId: string;
  productId: string;
  date: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
}

export interface MonthlyBill {
  id: string;
  customerId: string;
  month: string;
  year: number;
  entries: DailyEntry[];
  previousDue: number;
  totalAmount: number;
  grandTotal: number;
  generatedAt: string;
}

export interface AppData {
  user: User;
  customers: Customer[];
  products: Product[];
  dailyEntries: DailyEntry[];
  monthlyBills: MonthlyBill[];
}
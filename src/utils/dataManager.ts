import { AppData, Customer, Product, DailyEntry, MonthlyBill } from '../types';

const DEFAULT_DATA: AppData = {
  user: {
    username: 'admin',
    password: 'admin123' // In production, this should be hashed
  },
  customers: [
    {
      id: 'customer_1',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      address: 'Shop No. 15, Main Market',
      lastMonthDue: 500,
      createdAt: '2025-01-01'
    },
    {
      id: 'customer_2',
      name: 'Priya Sharma',
      phone: '9876543211',
      address: 'House No. 23, Gandhi Road',
      lastMonthDue: 0,
      createdAt: '2025-01-02'
    }
  ],
  products: [
    {
      id: 'milk_type_1',
      name: 'Buffalo Milk',
      rate: 60,
      unit: 'liter',
      category: 'Milk'
    },
    {
      id: 'milk_type_2',
      name: 'Cow Milk',
      rate: 50,
      unit: 'liter',
      category: 'Milk'
    },
    {
      id: 'paneer',
      name: 'Paneer',
      rate: 350,
      unit: 'kg',
      category: 'Dairy'
    },
    {
      id: 'dahi',
      name: 'Dahi (Curd)',
      rate: 40,
      unit: 'kg',
      category: 'Dairy'
    },
    {
      id: 'chach',
      name: 'Chach (Buttermilk)',
      rate: 25,
      unit: 'liter',
      category: 'Dairy'
    },
    {
      id: 'ghee',
      name: 'Ghee',
      rate: 500,
      unit: 'kg',
      category: 'Dairy'
    }
  ],
  dailyEntries: [
    {
      id: 'entry_1',
      customerId: 'customer_1',
      productId: 'milk_type_1',
      date: '2025-01-15',
      quantity: 2,
      rate: 60,
      amount: 120
    },
    {
      id: 'entry_2',
      customerId: 'customer_1',
      productId: 'dahi',
      date: '2025-01-15',
      quantity: 1,
      rate: 40,
      amount: 40
    }
  ],
  monthlyBills: []
};

class DataManager {
  private data: AppData;
  private storageKey = 'babadhudh_data';

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): AppData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    return DEFAULT_DATA;
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Authentication
  authenticateUser(username: string, password: string): boolean {
    return this.data.user.username === username && this.data.user.password === password;
  }

  // Customers
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: `customer_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.customers.push(newCustomer);
    this.saveData();
    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.customers[index] = { ...this.data.customers[index], ...updates };
      this.saveData();
      return this.data.customers[index];
    }
    return null;
  }

  deleteCustomer(id: string): boolean {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.customers.splice(index, 1);
      // Remove related entries
      this.data.dailyEntries = this.data.dailyEntries.filter(e => e.customerId !== id);
      this.saveData();
      return true;
    }
    return false;
  }

  // Products
  getProducts(): Product[] {
    return this.data.products;
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: `product_${Date.now()}`
    };
    this.data.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.products[index] = { ...this.data.products[index], ...updates };
      this.saveData();
      return this.data.products[index];
    }
    return null;
  }

  deleteProduct(id: string): boolean {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.products.splice(index, 1);
      // Remove related entries
      this.data.dailyEntries = this.data.dailyEntries.filter(e => e.productId !== id);
      this.saveData();
      return true;
    }
    return false;
  }

  // Daily Entries
  getDailyEntries(): DailyEntry[] {
    return this.data.dailyEntries;
  }

  getDailyEntriesForDate(date: string): DailyEntry[] {
    return this.data.dailyEntries.filter(e => e.date === date);
  }

  getDailyEntriesForCustomer(customerId: string): DailyEntry[] {
    return this.data.dailyEntries.filter(e => e.customerId === customerId);
  }

  addDailyEntry(entry: Omit<DailyEntry, 'id'>): DailyEntry {
    const newEntry: DailyEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.dailyEntries.push(newEntry);
    this.saveData();
    return newEntry;
  }

  updateDailyEntry(id: string, updates: Partial<DailyEntry>): DailyEntry | null {
    const index = this.data.dailyEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.dailyEntries[index] = { ...this.data.dailyEntries[index], ...updates };
      this.saveData();
      return this.data.dailyEntries[index];
    }
    return null;
  }

  deleteDailyEntry(id: string): boolean {
    const index = this.data.dailyEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.dailyEntries.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  copyYesterdayData(targetDate: string): DailyEntry[] {
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayEntries = this.getDailyEntriesForDate(yesterdayStr);
    const copiedEntries: DailyEntry[] = [];
    
    yesterdayEntries.forEach(entry => {
      const newEntry = this.addDailyEntry({
        customerId: entry.customerId,
        productId: entry.productId,
        date: targetDate,
        quantity: entry.quantity,
        rate: entry.rate,
        amount: entry.amount,
        notes: entry.notes
      });
      copiedEntries.push(newEntry);
    });
    
    return copiedEntries;
  }

  // Monthly Bills
  getMonthlyBills(): MonthlyBill[] {
    return this.data.monthlyBills;
  }

  generateMonthlyBill(customerId: string, month: string, year: number): MonthlyBill {
    const customer = this.data.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const monthEntries = this.data.dailyEntries.filter(e => 
      e.customerId === customerId && 
      e.date.startsWith(`${year}-${month.padStart(2, '0')}`)
    );

    if (monthEntries.length === 0) {
      throw new Error('No entries found for this customer in the selected month');
    }

    const totalAmount = monthEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const grandTotal = totalAmount + customer.lastMonthDue;

    const bill: MonthlyBill = {
      id: `bill_${Date.now()}`,
      customerId,
      month,
      year,
      entries: monthEntries,
      previousDue: customer.lastMonthDue,
      totalAmount,
      grandTotal,
      generatedAt: new Date().toISOString()
    };

    this.data.monthlyBills.push(bill);
    this.saveData();
    return bill;
  }

  // Data Export/Import
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.data = data;
      this.saveData();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Backup
  createBackup(): void {
    const backup = {
      timestamp: new Date().toISOString(),
      data: this.data
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baba_dhudh_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear all bills
  clearAllBills(): void {
    this.data.monthlyBills = [];
    this.saveData();
  }
}

export const dataManager = new DataManager();
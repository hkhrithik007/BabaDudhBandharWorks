import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Package, 
  Calendar, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  Eye,
  TrendingUp,
  Milk,
  IndianRupee,
  ShoppingCart,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { dataManager } from '../utils/dataManager';
import CustomerManagement from './CustomerManagement';
import CustomerSheet from './CustomerSheet';
import ProductManagement from './ProductManagement';
import DailyEntry from './DailyEntry';
import Overview from './Overview';
import MonthlyBills from './MonthlyBills';
import Settings from './Settings';
import { Customer } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const customers = dataManager.getCustomers();
  const products = dataManager.getProducts();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = dataManager.getDailyEntriesForDate(today);

  // Calculate today's sales
  const todaySales = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
  
  // Calculate product-wise sales for today
  const productSales = products.map(product => {
    const productEntries = todayEntries.filter(entry => entry.productId === product.id);
    const totalQuantity = productEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    const totalAmount = productEntries.reduce((sum, entry) => sum + entry.amount, 0);
    return {
      name: product.name,
      unit: product.unit,
      quantity: totalQuantity,
      amount: totalAmount
    };
  }).filter(item => item.quantity > 0);

  // Get customer entries for today (grouped by customer)
  const customerEntries = customers.map(customer => {
    const entries = todayEntries.filter(entry => entry.customerId === customer.id);
    if (entries.length === 0) return null;
    
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const productDetails = entries.map(entry => {
      const product = products.find(p => p.id === entry.productId);
      return {
        productName: product?.name || 'Unknown',
        quantity: entry.quantity,
        unit: product?.unit || 'units',
        rate: entry.rate,
        amount: entry.amount
      };
    });
    
    return {
      customer,
      entries: productDetails,
      totalAmount
    };
  }).filter(Boolean);

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'daily-entry', label: 'Daily Entry', icon: Calendar },
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'bills', label: 'Monthly Bills', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('customer-sheet');
  };

  const handleBackFromCustomerSheet = () => {
    setSelectedCustomer(null);
    setActiveTab('customers');
  };

  const renderContent = () => {
    if (activeTab === 'customer-sheet' && selectedCustomer) {
      return <CustomerSheet customer={selectedCustomer} onBack={handleBackFromCustomerSheet} />;
    }

    switch (activeTab) {
      case 'customers':
        return <CustomerManagement />;
      case 'products':
        return <ProductManagement />;
      case 'daily-entry':
        return <DailyEntry />;
      case 'overview':
        return <Overview />;
      case 'bills':
        return <MonthlyBills />;
      case 'settings':
        return <Settings />;
      case 'home':
      default:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏠 Dashboard</h1>
              <p className="text-gray-600">Welcome to Baba Dhudh Bhandar Management System</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{customerEntries.length}</p>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-md p-6 relative cursor-pointer hover:shadow-lg transition-shadow"
                onMouseEnter={() => setShowSalesDetails(true)}
                onMouseLeave={() => setShowSalesDetails(false)}
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <IndianRupee className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                    <p className="text-2xl font-bold text-gray-900">₹{todaySales.toFixed(2)}</p>
                  </div>
                </div>

                {/* Hover Details */}
                {showSalesDetails && productSales.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                    <h4 className="font-semibold text-gray-800 mb-3">Today's Sales Breakdown</h4>
                    <div className="space-y-2">
                      {productSales.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {item.name}: {item.quantity} {item.unit}
                          </span>
                          <span className="font-medium text-gray-800">₹{item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => setActiveTab('daily-entry')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 mr-4" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Daily Entry</h3>
                    <p className="text-blue-100">Record today's sales</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
              >
                <div className="flex items-center">
                  <FileSpreadsheet className="h-8 w-8 mr-4" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Customer Sheets</h3>
                    <p className="text-green-100">View customer records</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('bills')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <div className="flex items-center">
                  <FileText className="h-8 w-8 mr-4" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Monthly Bills</h3>
                    <p className="text-purple-100">Generate customer bills</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Today's Customer Entries */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    📅 Today's Customer Entries ({new Date().toLocaleDateString()})
                  </h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {customerEntries.length} customers served
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {customerEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Milk className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No entries for today yet</p>
                    <p className="text-gray-400">Start adding daily entries to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerEntries.map((customerEntry, index) => (
                      <div 
                        key={index} 
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleCustomerClick(customerEntry.customer)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{customerEntry.customer.name}</h3>
                            {customerEntry.customer.phone && (
                              <p className="text-sm text-gray-500">{customerEntry.customer.phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">₹{customerEntry.totalAmount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Click to view sheet</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {customerEntry.entries.map((entry, entryIndex) => (
                            <div key={entryIndex} className="bg-blue-50 rounded-md p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-blue-900">{entry.productName}</p>
                                  <p className="text-sm text-blue-700">
                                    {entry.quantity} {entry.unit} × ₹{entry.rate}
                                  </p>
                                </div>
                                <p className="font-semibold text-blue-900">₹{entry.amount.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Milk className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Baba Dhudh</h1>
              <p className="text-sm text-gray-600">Bhandar</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}
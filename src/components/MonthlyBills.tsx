import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Download, 
  Eye,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Trash2,
  Users
} from 'lucide-react';
import { dataManager } from '../utils/dataManager';
import { generateBillPDF, generateAllCustomersBillPDF } from '../utils/pdfGenerator';
import { MonthlyBill, Customer } from '../types';

export default function MonthlyBills() {
  const [bills, setBills] = useState(dataManager.getMonthlyBills());
  const [customers] = useState(dataManager.getCustomers());
  const [products] = useState(dataManager.getProducts());
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCustomersModal, setShowAllCustomersModal] = useState(false);
  const [allCustomersMonth, setAllCustomersMonth] = useState('');
  const [allCustomersYear, setAllCustomersYear] = useState(new Date().getFullYear());

  const filteredBills = bills.filter(bill => {
    const customer = customers.find(c => c.id === bill.customerId);
    return customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bill.month.toString().includes(searchTerm) ||
           bill.year.toString().includes(searchTerm);
  });

  const handleGenerateBill = () => {
    if (!selectedCustomer || !selectedMonth) return;

    try {
      const bill = dataManager.generateMonthlyBill(selectedCustomer, selectedMonth, selectedYear);
      setBills(dataManager.getMonthlyBills());
      setShowGenerateForm(false);
      
      // Reset form
      setSelectedCustomer('');
      setSelectedMonth('');
      setSelectedYear(new Date().getFullYear());
    } catch (error) {
      alert('Error generating bill: ' + error);
    }
  };

  const handleViewBill = (bill: MonthlyBill) => {
    const customer = customers.find(c => c.id === bill.customerId);
    if (customer) {
      generateBillPDF(bill, customer, products);
    }
  };

  const handleGenerateAllCustomersBill = () => {
    if (!allCustomersMonth) {
      alert('Please select a month first');
      return;
    }

    try {
      // Generate bills for all customers for the selected month/year
      const allBills: MonthlyBill[] = [];
      
      customers.forEach(customer => {
        try {
          const bill = dataManager.generateMonthlyBill(customer.id, allCustomersMonth, allCustomersYear);
          allBills.push(bill);
        } catch (error) {
          console.warn(`No entries found for customer ${customer.name} in ${selectedMonth}/${selectedYear}`);
        }
      });

      if (allBills.length === 0) {
        alert('No bills generated. No entries found for the selected month.');
        return;
      }

      // Generate combined PDF
      generateAllCustomersBillPDF(allBills, customers, products, allCustomersMonth, allCustomersYear);
      setBills(dataManager.getMonthlyBills());
      setShowAllCustomersModal(false);
      
    } catch (error) {
      alert('Error generating bills for all customers: ' + error);
    }
  };

  const handleClearAllBills = () => {
    if (confirm('Are you sure you want to clear all bills? This action cannot be undone.')) {
      dataManager.clearAllBills();
      setBills([]);
      alert('All bills have been cleared successfully.');
    }
  };

  const getMonthName = (monthNumber: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Monthly Bills</h1>
        <p className="text-gray-600">Generate and manage customer monthly bills</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowGenerateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Bill
          </button>
          
          <button
            onClick={() => setShowAllCustomersModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            All Customers PDF
          </button>
          
          <button
            onClick={handleClearAllBills}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Bills
          </button>
        </div>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBills.map((bill) => {
          const customer = customers.find(c => c.id === bill.customerId);
          
          return (
            <div key={bill.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer?.name || 'Unknown Customer'}
                    </h3>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {getMonthName(parseInt(bill.month))} {bill.year}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {bill.entries.length} entries
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2 text-sm">
                  {bill.previousDue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Previous Due:</span>
                      <span className="text-red-600">₹{bill.previousDue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Month:</span>
                    <span className="text-gray-900">₹{bill.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span className="text-gray-900">Grand Total:</span>
                    <span className="text-green-600">₹{bill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleViewBill(bill)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleViewBill(bill)}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No bills found</p>
          <p className="text-gray-400">Generate your first monthly bill to get started</p>
        </div>
      )}

      {/* Generate Bill Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Monthly Bill</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer *
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Month</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Array.from({length: 5}, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Bulk Actions</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Use "All Customers PDF" button above to generate bills for all customers at once for the selected month/year.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGenerateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateBill}
                disabled={!selectedCustomer || !selectedMonth}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Customers PDF Modal */}
      {showAllCustomersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Bills for All Customers</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <select
                  value={allCustomersMonth}
                  onChange={(e) => setAllCustomersMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Month</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={allCustomersYear}
                  onChange={(e) => setAllCustomersYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Array.from({length: 5}, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">📄 Bulk Bill Generation</h4>
                <p className="text-sm text-green-800">
                  This will generate bills for all customers who have entries in the selected month/year and create a combined PDF with 2 bills per page.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAllCustomersModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAllCustomersBill}
                disabled={!allCustomersMonth}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate All Bills PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
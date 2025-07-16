import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Save, 
  Copy,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { dataManager } from '../utils/dataManager';
import { Customer, Product } from '../types';

export default function DailyEntry() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerEntries, setCustomerEntries] = useState<{[customerId: string]: {[productId: string]: {quantity: number, rate: number}}}>({});
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const customers = dataManager.getCustomers();
  const products = dataManager.getProducts();

  // Initialize empty state for all customers and products
  const initializeEmptyState = () => {
    const emptyState: {[customerId: string]: {[productId: string]: {quantity: number, rate: number}}} = {};
    customers.forEach(customer => {
      emptyState[customer.id] = {};
      products.forEach(product => {
        emptyState[customer.id][product.id] = { quantity: 0, rate: product.rate };
      });
    });
    return emptyState;
  };

  // Load existing entries when date changes
  useEffect(() => {
    const existingEntries = dataManager.getDailyEntriesForDate(selectedDate);
    const newState = initializeEmptyState();
    
    // Only update entries that exist in the database
    existingEntries.forEach(entry => {
      if (newState[entry.customerId] && newState[entry.customerId][entry.productId]) {
        newState[entry.customerId][entry.productId] = {
          quantity: entry.quantity,
          rate: entry.rate
        };
      }
    });
    
    setCustomerEntries(newState);
  }, [selectedDate, customers.length, products.length]);

  const updateEntry = (customerId: string, productId: string, field: 'quantity' | 'rate', value: number) => {
    setCustomerEntries(prevState => {
      // Create a deep copy of the previous state
      const newState = {};
      
      // Copy all existing customer data
      Object.keys(prevState).forEach(cId => {
        newState[cId] = {};
        Object.keys(prevState[cId]).forEach(pId => {
          newState[cId][pId] = { ...prevState[cId][pId] };
        });
      });
      
      // Ensure the specific customer exists
      if (!newState[customerId]) {
        newState[customerId] = {};
      }
      
      // Ensure the specific product exists for this customer
      if (!newState[customerId][productId]) {
        const product = products.find(p => p.id === productId);
        newState[customerId][productId] = { quantity: 0, rate: product?.rate || 0 };
      }
      
      // Update ONLY the specific field for this specific customer-product combination
      newState[customerId][productId] = {
        ...newState[customerId][productId],
        [field]: value
      };
      
      // Auto-fill rate from product if quantity is entered and rate is 0
      if (field === 'quantity' && value > 0 && newState[customerId][productId].rate === 0) {
        const product = products.find(p => p.id === productId);
        if (product) {
          newState[customerId][productId].rate = product.rate;
        }
      }
      
      return newState;
    });
  };

  const getEntryValue = (customerId: string, productId: string, field: 'quantity' | 'rate'): number => {
    return customerEntries[customerId]?.[productId]?.[field] || 0;
  };

  const getCustomerTotal = (customerId: string): number => {
    if (!customerEntries[customerId]) return 0;
    
    return Object.entries(customerEntries[customerId]).reduce((total, [productId, entry]) => {
      return total + (entry.quantity * entry.rate);
    }, 0);
  };

  const getProductTotal = (productId: string): number => {
    return Object.entries(customerEntries).reduce((total, [customerId, customerProducts]) => {
      const entry = customerProducts[productId];
      if (entry) {
        return total + (entry.quantity * entry.rate);
      }
      return total;
    }, 0);
  };

  const getGrandTotal = (): number => {
    return Object.keys(customerEntries).reduce((total, customerId) => {
      return total + getCustomerTotal(customerId);
    }, 0);
  };

  const saveEntries = () => {
    try {
      // Clear existing entries for this date
      const existingEntries = dataManager.getDailyEntriesForDate(selectedDate);
      existingEntries.forEach(entry => {
        dataManager.deleteDailyEntry(entry.id);
      });

      // Add new entries
      let savedCount = 0;
      Object.entries(customerEntries).forEach(([customerId, customerProducts]) => {
        Object.entries(customerProducts).forEach(([productId, entry]) => {
          if (entry.quantity > 0 && entry.rate > 0) {
            dataManager.addDailyEntry({
              customerId,
              productId,
              date: selectedDate,
              quantity: entry.quantity,
              rate: entry.rate,
              amount: entry.quantity * entry.rate
            });
            savedCount++;
          }
        });
      });

      setSaveStatus({
        type: 'success',
        message: `Successfully saved ${savedCount} entries for ${new Date(selectedDate).toLocaleDateString()}`
      });

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: 'Error saving entries. Please try again.'
      });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const copyFromYesterday = () => {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayEntries = dataManager.getDailyEntriesForDate(yesterdayStr);
    
    if (yesterdayEntries.length === 0) {
      setSaveStatus({
        type: 'error',
        message: 'No entries found for yesterday to copy'
      });
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const newState = initializeEmptyState();
    
    yesterdayEntries.forEach(entry => {
      if (newState[entry.customerId] && newState[entry.customerId][entry.productId]) {
        newState[entry.customerId][entry.productId] = {
          quantity: entry.quantity,
          rate: entry.rate
        };
      }
    });
    
    setCustomerEntries(newState);
    
    setSaveStatus({
      type: 'success',
      message: `Copied ${yesterdayEntries.length} entries from ${yesterday.toLocaleDateString()}`
    });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Daily Entry</h1>
        <p className="text-gray-600">Record daily sales for any date</p>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className={`mb-4 p-4 rounded-lg flex items-center ${
          saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveStatus.type === 'success' ? 
            <CheckCircle className="h-5 w-5 mr-2" /> : 
            <AlertCircle className="h-5 w-5 mr-2" />
          }
          {saveStatus.message}
        </div>
      )}

      {/* Date Selection and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <label className="text-sm font-medium text-gray-700 mr-3">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 
               selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'Yesterday' :
               new Date(selectedDate).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={copyFromYesterday}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Yesterday
            </button>
            
            <button
              onClick={saveEntries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Entries
            </button>
          </div>
        </div>
      </div>

      {/* Entry Sheet */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Customer
                </th>
                {products.map(product => (
                  <th key={product.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div>{product.name}</div>
                    <div className="text-xs text-gray-400">₹{product.rate}/{product.unit}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {products.map(product => {
                    const quantity = getEntryValue(customer.id, product.id, 'quantity');
                    const rate = getEntryValue(customer.id, product.id, 'rate');
                    
                    return (
                      <td key={`${customer.id}-${product.id}`} className="px-3 py-3 text-center">
                        <div className="space-y-2">
                          {/* Quantity Input */}
                          <input
                            key={`qty-${customer.id}-${product.id}-${selectedDate}`}
                            type="number"
                            step="0.1"
                            placeholder="Qty"
                            value={quantity || ''}
                            onChange={(e) => updateEntry(customer.id, product.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          
                          {/* Rate Input */}
                          <input
                            key={`rate-${customer.id}-${product.id}-${selectedDate}`}
                            type="number"
                            step="0.01"
                            placeholder="Rate"
                            value={rate || ''}
                            onChange={(e) => updateEntry(customer.id, product.id, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          
                          {/* Amount Display */}
                          {quantity > 0 && rate > 0 && (
                            <div className="text-xs font-medium text-green-600">
                              ₹{(quantity * rate).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{getCustomerTotal(customer.id).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-50 font-medium">
                <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-gray-50 z-10">
                  Product Totals
                </td>
                {products.map(product => (
                  <td key={product.id} className="px-3 py-3 text-center text-sm text-gray-900">
                    ₹{getProductTotal(product.id).toFixed(2)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-lg font-bold text-blue-600">
                  ₹{getGrandTotal().toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Date</p>
            <p className="text-xl font-bold text-blue-600">{new Date(selectedDate).toLocaleDateString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total Customers</p>
            <p className="text-xl font-bold text-blue-600">
              {customers.filter(customer => getCustomerTotal(customer.id) > 0).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total Sales</p>
            <p className="text-xl font-bold text-green-600">₹{getGrandTotal().toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
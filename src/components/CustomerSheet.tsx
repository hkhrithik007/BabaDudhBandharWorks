import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, User, Edit2, Save, X } from 'lucide-react';
import { dataManager } from '../utils/dataManager';
import { Customer, Product, DailyEntry } from '../types';

interface CustomerSheetProps {
  customer: Customer;
  onBack: () => void;
}

export default function CustomerSheet({ customer, onBack }: CustomerSheetProps) {
  const [editingCell, setEditingCell] = useState<{date: string, productId: string, field: 'quantity' | 'rate'} | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const products = dataManager.getProducts();
  const allEntries = dataManager.getDailyEntries();
  
  // Get customer entries
  const customerEntries = allEntries.filter(entry => entry.customerId === customer.id);
  
  // Get unique dates (last 30 days)
  const dates = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Create a map for quick entry lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    customerEntries.forEach(entry => {
      const key = `${entry.date}-${entry.productId}`;
      map.set(key, entry);
    });
    return map;
  }, [customerEntries]);

  const handleCellClick = (date: string, productId: string, field: 'quantity' | 'rate') => {
    const key = `${date}-${productId}`;
    const entry = entryMap.get(key);
    const value = entry ? entry[field].toString() : '0';
    
    setEditingCell({ date, productId, field });
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    const { date, productId, field } = editingCell;
    const key = `${date}-${productId}`;
    const existingEntry = entryMap.get(key);
    const newValue = parseFloat(editValue) || 0;
    
    if (existingEntry) {
      // Update existing entry
      const updates: Partial<DailyEntry> = {};
      updates[field] = newValue;
      
      if (field === 'quantity') {
        updates.amount = newValue * existingEntry.rate;
      } else if (field === 'rate') {
        updates.amount = existingEntry.quantity * newValue;
      }
      
      dataManager.updateDailyEntry(existingEntry.id, updates);
    } else if (newValue > 0) {
      // Create new entry
      const product = products.find(p => p.id === productId);
      const quantity = field === 'quantity' ? newValue : 1;
      const rate = field === 'rate' ? newValue : product?.rate || 0;
      
      dataManager.addDailyEntry({
        customerId: customer.id,
        productId,
        date,
        quantity,
        rate,
        amount: quantity * rate
      });
    }
    
    setEditingCell(null);
    window.location.reload(); // Refresh to show updated data
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getEntryValue = (date: string, productId: string, field: 'quantity' | 'rate'): number => {
    const key = `${date}-${productId}`;
    const entry = entryMap.get(key);
    return entry ? entry[field] : 0;
  };

  const getDayTotal = (date: string): number => {
    return customerEntries
      .filter(entry => entry.date === date)
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getProductTotal = (productId: string): number => {
    return customerEntries
      .filter(entry => entry.productId === productId)
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getGrandTotal = (): number => {
    return customerEntries.reduce((sum, entry) => sum + entry.amount, 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center">
          <User className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Customer Sheet - Last 30 Days</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-blue-800">Phone:</span>
            <p className="text-blue-900">{customer.phone || 'Not provided'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-blue-800">Address:</span>
            <p className="text-blue-900">{customer.address || 'Not provided'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-blue-800">Previous Due:</span>
            <p className="text-blue-900">₹{customer.lastMonthDue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Sheet Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Date
                </th>
                {products.map(product => (
                  <th key={product.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div>{product.name}</div>
                    <div className="text-xs text-gray-400">Qty | Rate</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dates.map(date => (
                <tr key={date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(date).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </div>
                  </td>
                  {products.map(product => {
                    const quantity = getEntryValue(date, product.id, 'quantity');
                    const rate = getEntryValue(date, product.id, 'rate');
                    const amount = quantity * rate;
                    
                    return (
                      <td key={product.id} className="px-3 py-3 text-center">
                        <div className="space-y-1">
                          {/* Quantity */}
                          <div
                            onClick={() => handleCellClick(date, product.id, 'quantity')}
                            className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 border border-transparent hover:border-blue-200"
                          >
                            {editingCell?.date === date && editingCell?.productId === product.id && editingCell?.field === 'quantity' ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button onClick={handleSave} className="text-green-600 hover:text-green-800">
                                  <Save className="h-3 w-3" />
                                </button>
                                <button onClick={handleCancel} className="text-red-600 hover:text-red-800">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-600 flex items-center justify-center">
                                {quantity > 0 ? `${quantity} ${product.unit}` : '-'}
                                {quantity > 0 && <Edit2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                              </div>
                            )}
                          </div>
                          
                          {/* Rate */}
                          <div
                            onClick={() => handleCellClick(date, product.id, 'rate')}
                            className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 border border-transparent hover:border-blue-200"
                          >
                            {editingCell?.date === date && editingCell?.productId === product.id && editingCell?.field === 'rate' ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button onClick={handleSave} className="text-green-600 hover:text-green-800">
                                  <Save className="h-3 w-3" />
                                </button>
                                <button onClick={handleCancel} className="text-red-600 hover:text-red-800">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 flex items-center justify-center">
                                {rate > 0 ? `₹${rate}` : '-'}
                                {rate > 0 && <Edit2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                              </div>
                            )}
                          </div>
                          
                          {/* Amount */}
                          {amount > 0 && (
                            <div className="text-xs font-medium text-green-600">
                              ₹{amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{getDayTotal(date).toFixed(2)}
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
            <p className="text-sm font-medium text-gray-600">Previous Due</p>
            <p className="text-2xl font-bold text-red-600">₹{customer.lastMonthDue.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Current Month</p>
            <p className="text-2xl font-bold text-blue-600">₹{getGrandTotal().toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Grand Total</p>
            <p className="text-2xl font-bold text-green-600">₹{(customer.lastMonthDue + getGrandTotal()).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
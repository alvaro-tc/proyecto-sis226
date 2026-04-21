'use client';

import { useState, useEffect } from 'react';
import { customersApi } from '@/lib/api';
import { Customer } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // ESTADO ACTUALIZADO: Vincula los campos con el formulario
  const [formData, setFormData] = useState({
    Name: '',
    Surname: '',
    CI: '',          // Identificación
    Gender: 'Other', // Género
    Age: 0,          // Edad
    Email: '',
    PhoneNumber: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersApi.getAll();
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        Name: customer.Name,
        Surname: customer.Surname,
        CI: customer.CI || '',
        Gender: (customer.Gender as any) || 'Other',
        Age: customer.Age || 0,
        Email: customer.Email,
        PhoneNumber: customer.PhoneNumber,
      });
    } else {
      setSelectedCustomer(null);
      setFormData({ Name: '', Surname: '', CI: '', Gender: 'Other', Age: 0, Email: '', PhoneNumber: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        await customersApi.update(selectedCustomer._id, formData);
        toast.success('Customer updated');
      } else {
        await customersApi.create(formData);
        toast.success('Customer created');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Error saving customer');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await customersApi.delete(customerToDelete._id);
      toast.success('Deleted');
      fetchCustomers();
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Customers</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
        >
          + ADD CUSTOMER
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">CI</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Age</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{c.Name} {c.Surname}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{c.Gender}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{c.CI}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.Age} yrs</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(c)} className="text-indigo-600 font-bold mr-4">Edit</button>
                    <button onClick={() => { setCustomerToDelete(c); setIsConfirmOpen(true); }} className="text-red-600 font-bold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? 'Edit' : 'Add'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name" value={formData.Name} onChange={(e) => setFormData({...formData, Name: e.target.value})} className="border-2 p-2 rounded-lg outline-none focus:border-orange-500" required />
            <input placeholder="Surname" value={formData.Surname} onChange={(e) => setFormData({...formData, Surname: e.target.value})} className="border-2 p-2 rounded-lg outline-none focus:border-orange-500" required />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="CI" value={formData.CI} onChange={(e) => setFormData({...formData, CI: e.target.value})} className="border-2 p-2 rounded-lg outline-none focus:border-orange-500" required />
            <select value={formData.Gender} onChange={(e) => setFormData({...formData, Gender: e.target.value as any})} className="border-2 p-2 rounded-lg outline-none focus:border-orange-500">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="number" placeholder="Age" value={formData.Age} onChange={(e) => setFormData({...formData, Age: parseInt(e.target.value) || 0})} className="border-2 p-2 rounded-lg outline-none focus:border-orange-500" />
          </div>

          <input placeholder="Email" type="email" value={formData.Email} onChange={(e) => setFormData({...formData, Email: e.target.value})} className="w-full border-2 p-2 rounded-lg outline-none focus:border-orange-500" required />
          <input placeholder="Phone" value={formData.PhoneNumber} onChange={(e) => setFormData({...formData, PhoneNumber: e.target.value})} className="w-full border-2 p-2 rounded-lg outline-none focus:border-orange-500" required />

          <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg uppercase tracking-widest">Save Customer</button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDeleteConfirm} title="Delete Client" message="Are you sure?" confirmText="Delete" type="danger" />
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Shield, Phone, MapPin, Calendar, CreditCard, 
  Search, X, Activity, ChevronRight, AlertCircle 
} from 'lucide-react';

// --- Types ---
interface Policy {
  type: string;
  providerName: string;
  planName: string;
  policyNumber: string;
  groupNumber?: string;
  subscriber: string;
  status: 'Active' | 'Expired' | 'Pending';
  copay: number;
  deductible: number;
  effectiveDate: { start: string; end: string };
}

interface PolicyHolder {
  _id: string;
  mrn: string;
  personalInfo: {
    fullName: { first: string; last: string; middle?: string };
    dob: string;
    gender: string;
    contact: {
      address: string;
      city: string;
      state: string;
      zip: string;
      phone: string;
      email: string;
    };
  };
  policies: Policy[];
}

export default function Dashboard() {
  const [users, setUsers] = useState<PolicyHolder[]>([]);
  const [selectedUser, setSelectedUser] = useState<PolicyHolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // 1. Fetch ALL Users on Load
  useEffect(() => {
    fetch('https://policy-demo-backend.onrender.com/api/policy-holders')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to fetch users", err));
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.personalInfo.fullName.last.toLowerCase().includes(search.toLowerCase()) ||
    u.mrn.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* --- Header & Search --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Directory</h1>
            <p className="text-gray-500 text-sm">Manage insurance policies and member details</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Last Name or MRN..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center md:ml-4">
            <button
              onClick={() => router.push('/')}
              className="ml-3 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Calendar size={16} />
              Calendar
            </button>
          </div>
        </header>

        {/* --- Data Table --- */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">MRN</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Policies</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.mrn} 
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {user.personalInfo.fullName.first[0]}{user.personalInfo.fullName.last[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.personalInfo.fullName.last}, {user.personalInfo.fullName.first}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(user.personalInfo.dob).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {user.mrn}
                    </td>
                    <td className="px-6 py-4">
                      {/* Simple status logic based on first policy */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.policies[0]?.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        user.policies[0]?.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.policies[0]?.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.policies.length} Active Plan(s)
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="inline-block text-gray-300 group-hover:text-blue-500 transition" size={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-gray-500">No patients found matching your search.</div>
            )}
          </div>
        )}
      </div>

      {/* --- POPUP MODAL (Detailed View) --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-slate-700">
                  {selectedUser.personalInfo.fullName.first[0]}
                  {selectedUser.personalInfo.fullName.last[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedUser.personalInfo.fullName.first} {selectedUser.personalInfo.fullName.last}
                  </h2>
                  <div className="flex items-center gap-4 text-slate-400 text-sm mt-1">
                    <span className="flex items-center gap-1"><User size={14}/> {selectedUser.personalInfo.gender}</span>
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(selectedUser.personalInfo.dob).toLocaleDateString()}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-300">MRN: {selectedUser.mrn}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto p-8 bg-gray-50">
              
              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Left Col: Contact Info */}
                <div className="space-y-6">
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Phone size={14} /> Contact
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Email</label>
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedUser.personalInfo.contact.email}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Phone</label>
                        <p className="text-sm font-medium text-gray-900">{selectedUser.personalInfo.contact.phone}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Address</label>
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {selectedUser.personalInfo.contact.address}<br/>
                          {selectedUser.personalInfo.contact.city}, {selectedUser.personalInfo.contact.state} {selectedUser.personalInfo.contact.zip}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity size={14} /> Alerts
                    </h3>
                    {selectedUser.policies.some(p => p.status === 'Pending' || p.status === 'Expired') ? (
                       <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200 flex items-start gap-2">
                         <AlertCircle size={16} className="mt-0.5" />
                         <p>One or more policies require attention.</p>
                       </div>
                    ) : (
                      <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 flex items-start gap-2">
                         <Shield size={16} className="mt-0.5" />
                         <p>All policies are active and verified.</p>
                       </div>
                    )}
                  </section>
                </div>

                {/* Right Col: Policies (Spans 2 cols) */}
                <div className="md:col-span-2 space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield size={14} /> Insurance Coverage
                  </h3>
                  
                  <div className="space-y-4">
                    {selectedUser.policies.map((policy, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition group">
                        
                        {/* Policy Header */}
                        <div className="p-5 flex justify-between items-start border-b border-gray-50">
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                              policy.type === 'Medical' ? 'bg-blue-100 text-blue-600' : 
                              policy.type === 'Dental' ? 'bg-teal-100 text-teal-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              <Shield size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-gray-900">{policy.providerName}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                                  policy.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                                  'bg-yellow-50 text-yellow-700 border-yellow-100'
                                }`}>
                                  {policy.status}
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm font-medium">{policy.planName} • <span className="text-gray-400">{policy.type}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs text-gray-400 uppercase tracking-wide">Policy Number</p>
                             <p className="font-mono font-medium text-gray-700">{policy.policyNumber}</p>
                          </div>
                        </div>

                        {/* Policy Details Grid */}
                        <div className="bg-gray-50/50 p-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Copay</p>
                            <p className="font-semibold text-gray-900">${policy.copay}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Deductible</p>
                            <p className="font-semibold text-gray-900">${policy.deductible}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Subscriber</p>
                            <p className="font-medium text-gray-900">{policy.subscriber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Expires</p>
                            <p className="font-medium text-gray-900">{new Date(policy.effectiveDate.end).toLocaleDateString()}</p>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition text-sm"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition text-sm flex items-center gap-2">
                <CreditCard size={16} /> Edit Policy
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
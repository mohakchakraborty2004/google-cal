"use client";

import { useState, useEffect } from 'react';
import { 
  Users, ShieldAlert, FileWarning, Clock, 
  CheckCircle, AlertTriangle, Calendar, Activity,
  Stethoscope, CreditCard, X, User, Phone, Shield, ChevronRight
} from 'lucide-react';

// --- Types based on backend aggregation ---
interface Provider {
  npi: string;
  name: { first: string; last: string; title: string };
  specialty: string;
  department: string;
}

interface PopulatedAppointment {
  _id: string;
  patientMrn: string;
  providerNpi: string;
  scheduledTime: string;
  status: string;
  chiefComplaint: string;
  knownIssues: string[];
  financialClearance: {
    eligibilityVerified: boolean;
    priorAuthRequired: boolean;
    priorAuthStatus: string;
  };
  patientDetails: {
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
    policies: Array<{
      type: string;
      providerName: string;
      planName: string;
      policyNumber: string;
      status: string;
      copay: number;
      deductible: number;
      subscriber: string;
      effectiveDate: { end: string };
    }>;
  };
  providerDetails?: Provider;
}

const API_BASE = 'https://policy-demo-backend.onrender.com/api';

export default function CommandCenterDashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedNpi, setSelectedNpi] = useState<string>('');
  const [schedule, setSchedule] = useState<PopulatedAppointment[]>([]);
  const [alerts, setAlerts] = useState<PopulatedAppointment[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // State for the Detailed Modal
  const [selectedAppointment, setSelectedAppointment] = useState<PopulatedAppointment | null>(null);
  
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/providers`)
      .then(res => res.json())
      .then(data => {
        setProviders(data);
        if (data.length > 0) setSelectedNpi(data[0].npi);
      })
      .catch(err => console.error("Error fetching providers:", err));

    fetch(`${API_BASE}/dashboard/clearance-alerts`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setLoadingAlerts(false);
      })
      .catch(err => console.error("Error fetching alerts:", err));
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedNpi) return;
    setLoadingSchedule(true);
    fetch(`${API_BASE}/dashboard/schedule/${selectedNpi}`)
      .then(res => res.json())
      .then(data => {
        setSchedule(data);
        setLoadingSchedule(false);
      })
      .catch(err => console.error("Error fetching schedule:", err));
  }, [selectedNpi]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2f6] via-[#f4f7fb] to-[#e6eff8] font-sans text-slate-800 selection:bg-blue-200">
      
      {/* --- PREMIUM TOP NAVIGATION --- */}
      <nav className="bg-[#0a192f]/90 backdrop-blur-lg text-white px-8 py-5 flex justify-between items-center sticky top-0 z-40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] border-b border-blue-900/50">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/20 rounded-xl backdrop-blur-sm border border-blue-400/30 shadow-inner">
            <Activity className="text-blue-300" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-sm">Nexus Health</h1>
            <p className="text-[11px] uppercase tracking-widest text-blue-400 font-semibold mt-0.5">RCM Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm font-medium">
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-inner backdrop-blur-sm">
            <Calendar size={16} className="text-blue-400"/>
            <span className="text-blue-50">{isMounted ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-[#0a192f] shadow-[0_0_0_2px_rgba(59,130,246,0.4)] flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105 transition-transform">
            AD
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-8 mt-4">

        {/* --- KPI METRICS (Glass Cards) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Pending Prior Auths', value: alerts.filter(a => a.financialClearance.priorAuthStatus === 'Pending').length, icon: FileWarning, color: 'from-orange-400 to-red-500', bg: 'bg-red-50', text: 'text-red-500' },
            { label: 'Unverified Eligibility', value: alerts.filter(a => !a.financialClearance.eligibilityVerified).length, icon: ShieldAlert, color: 'from-amber-400 to-orange-500', bg: 'bg-orange-50', text: 'text-orange-500' },
            { label: 'Total Daily Patients', value: schedule.length, icon: Users, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-500' }
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(59,130,246,0.1)] transition-all duration-300 cursor-default">
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${kpi.color}`}></div>
              <div className="flex justify-between items-center pl-2">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                  <h3 className="text-4xl font-extrabold text-[#0a192f] group-hover:text-blue-600 transition-colors">{kpi.value}</h3>
                </div>
                <div className={`p-3.5 rounded-2xl ${kpi.bg} border border-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon size={26} className={kpi.text} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- SPLIT VIEW --- */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: Clinical View */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-end mb-2 px-1">
              <h2 className="text-xl font-bold text-[#0a192f] flex items-center gap-2 drop-shadow-sm">
                <Stethoscope className="text-blue-500" size={24}/> Provider Schedule
              </h2>
              <div className="relative group">
                <select 
                  className="appearance-none bg-white/80 backdrop-blur-md border border-slate-200 text-[#0a192f] text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 outline-none block pl-4 pr-10 py-2.5 shadow-sm group-hover:border-blue-300 transition-colors cursor-pointer"
                  value={selectedNpi}
                  onChange={(e) => setSelectedNpi(e.target.value)}
                >
                  {providers.map(p => (
                    <option key={p.npi} value={p.npi}>Dr. {p.name.last} ({p.specialty})</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500 group-hover:text-blue-600">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="bg-blue-900 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white min-h-[500px] overflow-hidden p-3">
              {loadingSchedule ? (
                <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
              ) : schedule.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 m-2">No appointments scheduled for today.</div>
              ) : (
                <div className="space-y-3">
                  {schedule.map((apt) => (
                    <div 
                      key={apt._id} 
                      onClick={() => setSelectedAppointment(apt)} // Trigger Modal
                      className="bg-white/80 hover:bg-white rounded-2xl p-4 transition-all duration-300 flex gap-5 cursor-pointer group border border-transparent hover:border-blue-100 hover:shadow-lg shadow-sm"
                    >
                      <div className="w-24 shrink-0 text-right pt-1 border-r border-slate-100 pr-5">
                        <p className="font-extrabold text-[#0a192f] text-lg leading-tight group-hover:text-blue-600 transition-colors">{formatTime(apt.scheduledTime)}</p>
                        <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-1 rounded-md mt-2 inline-block shadow-sm ${
                          apt.status === 'Arrived' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          apt.status === 'Completed' ? 'bg-slate-200 text-slate-600 border border-slate-300' :
                          apt.status === 'Cancelled' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-[#0a192f] group-hover:text-blue-700 transition-colors">
                              {apt.patientDetails.personalInfo.fullName.first} {apt.patientDetails.personalInfo.fullName.last}
                            </h4>
                            <p className="text-sm text-slate-500 font-medium mt-1 pr-4">"{apt.chiefComplaint}"</p>
                          </div>
                          <div className="p-2 rounded-full bg-slate-50 shadow-inner border border-slate-100 group-hover:bg-blue-50 transition-colors">
                            {apt.financialClearance.priorAuthStatus === 'Denied' ? (
                              <AlertTriangle className="text-red-500" size={20} />
                            ) : apt.financialClearance.priorAuthStatus === 'Pending' ? (
                              <Clock className="text-amber-500" size={20} />
                            ) : (
                              <CheckCircle className="text-emerald-500" size={20} />
                            )}
                          </div>
                        </div>
                        {apt.knownIssues.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {apt.knownIssues.map((issue, idx) => (
                              <span key={idx} className="bg-rose-50/80 text-rose-700 border border-rose-100 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                                {issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: Action Queue */}
          <div className="space-y-4">
             <h2 className="text-xl font-bold text-[#0a192f] flex items-center gap-2 mb-2 px-1 drop-shadow-sm">
                <CreditCard className="text-blue-500" size={22}/> Action Queue
              </h2>
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden flex flex-col h-[500px]">
                <div className="p-5 bg-gradient-to-r from-blue-50/50 to-white border-b border-blue-100">
                  <p className="text-xs text-blue-800/80 font-bold uppercase tracking-wider">Administrative Review Required</p>
                </div>
                <div className="overflow-y-auto flex-1 p-3">
                  {loadingAlerts ? (
                    <div className="flex justify-center items-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
                  ) : alerts.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 m-2 font-medium">All clear! No pending actions.</div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div 
                          key={alert._id} 
                          onClick={() => setSelectedAppointment(alert)}
                          className="p-4 rounded-2xl bg-white shadow-sm hover:shadow-lg border border-transparent hover:border-blue-200 cursor-pointer transition-all duration-300 relative overflow-hidden group"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-red-400"></div>
                          <div className="flex justify-between items-start mb-2 pl-2">
                            <h4 className="font-bold text-sm text-[#0a192f] group-hover:text-blue-600 transition-colors">
                              {alert.patientDetails.personalInfo.fullName.first} {alert.patientDetails.personalInfo.fullName.last}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">{formatTime(alert.scheduledTime)}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mb-4 pl-2">Dr. {alert.providerDetails?.name.last}</p>
                          <div className="space-y-2 pl-2">
                            {alert.financialClearance.priorAuthStatus === 'Pending' && (
                              <div className="flex items-center gap-2 text-xs font-bold bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-100 shadow-sm">
                                <Clock size={14} /> Prior Auth Pending
                              </div>
                            )}
                            {alert.financialClearance.priorAuthStatus === 'Denied' && (
                              <div className="flex items-center gap-2 text-xs font-bold bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 shadow-sm">
                                <X size={14} /> Prior Auth Denied
                              </div>
                            )}
                            {!alert.financialClearance.eligibilityVerified && (
                              <div className="flex items-center gap-2 text-xs font-bold bg-orange-50 text-orange-700 p-2.5 rounded-xl border border-orange-100 shadow-sm">
                                <ShieldAlert size={14} /> Eligibility Unverified
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* --- DETAILED PATIENT MODAL (Glassmorphic) --- */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0a192f] to-[#112240] p-8 flex justify-between items-start shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-900/50 border border-blue-400/50">
                  {selectedAppointment.patientDetails.personalInfo.fullName.first[0]}
                  {selectedAppointment.patientDetails.personalInfo.fullName.last[0]}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-wide">
                    {selectedAppointment.patientDetails.personalInfo.fullName.first} {selectedAppointment.patientDetails.personalInfo.fullName.last}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-blue-200 text-sm mt-3 font-medium">
                    <span className="flex items-center gap-1.5"><User size={16}/> {selectedAppointment.patientDetails.personalInfo.gender}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={16}/> {new Date(selectedAppointment.patientDetails.personalInfo.dob).toLocaleDateString()}</span>
                    <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg text-xs font-mono font-bold shadow-inner">MRN: {selectedAppointment.patientDetails.mrn}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="text-blue-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2.5 rounded-xl backdrop-blur-md relative z-10"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto p-8 flex-1">
              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Left Col: Contact Info */}
                <div className="space-y-6">
                  <section>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Phone size={14} className="text-blue-500" /> Contact Information
                    </h3>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                        <p className="text-sm font-bold text-[#0a192f] truncate mt-0.5">{selectedAppointment.patientDetails.personalInfo.contact.email}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                        <p className="text-sm font-bold text-[#0a192f] mt-0.5">{selectedAppointment.patientDetails.personalInfo.contact.phone}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</label>
                        <p className="text-sm font-bold text-[#0a192f] leading-relaxed mt-0.5">
                          {selectedAppointment.patientDetails.personalInfo.contact.address}<br/>
                          {selectedAppointment.patientDetails.personalInfo.contact.city}, {selectedAppointment.patientDetails.personalInfo.contact.state} {selectedAppointment.patientDetails.personalInfo.contact.zip}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Col: Policies */}
                <div className="md:col-span-2 space-y-6">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-blue-500" /> Active Insurance Policies
                  </h3>
                  
                  <div className="space-y-5">
                    {selectedAppointment.patientDetails.policies.map((policy, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6 flex justify-between items-start border-b border-slate-50">
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border ${
                              policy.type === 'Medical' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              policy.type === 'Dental' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                            }`}>
                              <Shield size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-extrabold text-lg text-[#0a192f]">{policy.providerName}</h4>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border shadow-sm ${
                                  policy.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {policy.status}
                                </span>
                              </div>
                              <p className="text-slate-500 text-sm font-semibold">{policy.planName} • <span className="text-slate-400">{policy.type}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Policy Number</p>
                             <p className="font-mono font-bold text-[#0a192f] bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{policy.policyNumber}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Copay</p>
                            <p className="font-extrabold text-[#0a192f] text-base">${policy.copay}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deductible</p>
                            <p className="font-extrabold text-[#0a192f] text-base">${policy.deductible}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subscriber</p>
                            <p className="font-bold text-[#0a192f] text-base">{policy.subscriber}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expires</p>
                            <p className="font-bold text-[#0a192f] text-base">{new Date(policy.effectiveDate.end).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-white border-t border-slate-200 p-5 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="px-6 py-2.5 text-slate-600 hover:text-[#0a192f] bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors text-sm shadow-sm"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Patient, AppView, MedicalRecord } from './types';
import { Icons, SAMPLE_PATIENTS, HOSPITAL_TESTS } from './constants';
import * as backend from './services/backendService';
import PatientCard from './components/PatientCard';
import PatientDetail from './components/PatientDetail';
import TrendChart from './components/TrendChart.tsx';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [patients, setPatients] = useState<Patient[]>(SAMPLE_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId), 
  [patients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients.filter(p => !p.archived);
    return patients.filter(p => {
      if (p.name.toLowerCase().includes(q) || p.id.includes(q)) return true;
      // include if any record (including archived) matches
      return p.records.some(r => (
        r.diagnosis.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q) ||
        r.medications.join(' ').toLowerCase().includes(q) ||
        r.date.includes(q)
      ));
    });
  }, [patients, searchQuery]);

  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.status === 'Active').length,
    criticalCases: patients.filter(p => p.status === 'Critical').length,
    stablePatients: patients.filter(p => p.status === 'Stable').length,
  };

  const recordsTrend = React.useMemo(() => {
    const days = 14;
    const getKey = (d: Date) => d.toISOString().split('T')[0];
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(getKey(d), 0);
    }

    patients.forEach(p => {
      p.records.forEach(r => {
        const key = r.date;
        if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
      });
    });

    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [patients]);

  const recentRecords = React.useMemo(() => {
    const all: { patient: Patient; record: MedicalRecord }[] = [];
    patients.forEach(p => {
      p.records.forEach(r => all.push({ patient: p, record: r }));
    });
    return all
      .sort((a, b) => (b.record.date.localeCompare(a.record.date)))
      .slice(0, 8);
  }, [patients]);

  const shareRecord = (patient: Patient, record: MedicalRecord, via: 'whatsapp' | 'email' | 'sms') => {
    const text = `Patient: ${patient.name} (ID: ${patient.id})\nDate: ${record.date}\nDiagnosis: ${record.diagnosis}\nDoctor: ${record.doctor}\nNotes: ${record.notes}`;
    const encoded = encodeURIComponent(text);
    if (via === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank');
    if (via === 'email') window.location.href = `mailto:?subject=Report%20${patient.name}&body=${encoded}`;
    if (via === 'sms') window.location.href = `sms:?body=${encoded}`;
  };

  const printRecord = (patient: Patient, record: MedicalRecord) => {
    const text = `Patient: ${patient.name} (ID: ${patient.id})\nDate: ${record.date}\nDiagnosis: ${record.diagnosis}\nDoctor: ${record.doctor}\n\n${record.notes}`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre>${text.replace(/</g,'&lt;')}</pre>`);
    w.document.close();
    w.print();
  };

  const downloadRecord = (patient: Patient, record: MedicalRecord) => {
    const text = `Patient: ${patient.name} (ID: ${patient.id})\nDate: ${record.date}\nDiagnosis: ${record.diagnosis}\nDoctor: ${record.doctor}\n\n${record.notes}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${patient.id}_${record.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePatientClick = (id: string) => {
    setSelectedPatientId(id);
    setCurrentView(AppView.PATIENT_DETAIL);
  };

  React.useEffect(() => {
    // load patients from backend if available
    (async () => {
      try {
        const remote = await backend.fetchPatients();
        if (Array.isArray(remote) && remote.length) {
          // map attachments placeholder
          setPatients(remote.map(p => ({ ...p, attachments: [], records: p.records || [] })));
          return;
        }
      } catch (e) {
        // ignore - fallback to in-memory sample data
      }
    })();
  }, []);

  const handleAddPatient = async (newPatient: Omit<Patient, 'id' | 'lastVisit' | 'records'>) => {
    const patient: Patient = {
      ...newPatient as any,
      id: `P${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      lastVisit: new Date().toISOString().split('T')[0],
      records: [],
    };
    setPatients(prev => [...prev, patient]);
    setCurrentView(AppView.PATIENTS);
    try {
      await backend.createPatient(patient);
    } catch (e) {
      console.warn('Failed to persist patient to backend', e);
    }
  };

  const handleArchivePatient = (id: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, archived: true } : p));
    backend.archivePatient(id).catch(()=>{});
  };

  const handleDeleteRecord = (patientId: string, recordId: string) => {
    // soft-delete (archive) the record so it's removed from visible history
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, records: p.records.map(r => r.id === recordId ? { ...r, archived: true } : r) } : p
    ));
    backend.archiveRecord(patientId, recordId).catch(()=>{});
  };

  const handleDeletePatientPermanent = async (id: string) => {
    // remove locally first
    setPatients(prev => prev.filter(p => p.id !== id));
    setCurrentView(AppView.PATIENTS);
    try {
      await backend.deletePatient(id);
    } catch (e) {
      console.warn('Failed to permanently delete patient on backend', e);
    }
  };

  const handlePatientUpdate = async (updatedPatient: Patient) => {
    // update locally first
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    // backend is already called in PatientDetail component
  };

  const exportCSV = async () => {
    try {
      // fetch all records (including deleted patients) from backend
      const res = await fetch('http://localhost:4001/api/export/records');
      const data = await res.json();
      
      const rows: string[][] = [[
        'patientId','patientName','recordId','date','doctor','diagnosis','notes','comment','medications','archived','patientDeleted'
      ]];
      
      data.forEach((item: any) => {
        rows.push([
          item.patientId,
          item.patientName,
          item.recordId,
          item.date,
          item.doctor,
          item.diagnosis,
          (item.notes || '').replace(/\n/g, ' '),
          item.comment || '',
          item.medications || '',
          item.archived ? 'true' : 'false',
          item.patientDeleted ? 'deleted' : 'active'
        ]);
      });
      
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicloud-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to export CSV', e);
      alert('Export failed. Backend may not be running.');
    }
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        currentView === view 
        ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' 
        : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Navigation Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 space-y-8 sticky top-0 h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Icons.Stethoscope />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">MediCloud</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem view={AppView.DASHBOARD} icon={Icons.Dashboard} label="Overview" />
          <SidebarItem view={AppView.PATIENTS} icon={Icons.Patients} label="Patient Directory" />
          <SidebarItem view={AppView.REPORTS} icon={Icons.Stethoscope} label="Reports" />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Logged in as</p>
            <p className="text-sm font-semibold text-slate-800">GABRIEL MCCARTHY</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {currentView === AppView.DASHBOARD && "Welcome Back, GABRIEL MCCARTHY"}
              {currentView === AppView.PATIENTS && "Patient Directory"}
              {currentView === AppView.PATIENT_DETAIL && "Patient Profile"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {currentView === AppView.DASHBOARD && "Here's your clinic overview"}
              {currentView !== AppView.DASHBOARD && "Manage your clinic and records with ease."}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {currentView !== AppView.NEW_PATIENT && currentView !== AppView.DASHBOARD && currentView !== AppView.REPORTS && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icons.Search />
                </span>
                <input 
                  type="text" 
                  placeholder="Search patient, ID..." 
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all w-64 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            {currentView !== AppView.NEW_PATIENT && currentView !== AppView.DASHBOARD && currentView !== AppView.REPORTS && (
              <button 
                onClick={() => setCurrentView(AppView.NEW_PATIENT)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-md"
              >
                <Icons.Plus />
                <span>New Patient</span>
              </button>
            )}
          </div>
        </header>

        {currentView === AppView.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Patients', value: stats.totalPatients, icon: '👥', color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-200' },
                { label: 'Active Treatments', value: stats.activePatients, icon: '💚', color: 'text-indigo-600', bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', border: 'border-indigo-200' },
                { label: 'Critical Cases', value: stats.criticalCases, icon: '⚠️', color: 'text-red-600', bg: 'bg-gradient-to-br from-red-50 to-red-100', border: 'border-red-200' },
                { label: 'Stable Condition', value: stats.stablePatients, icon: '✅', color: 'text-green-600', bg: 'bg-gradient-to-br from-green-50 to-green-100', border: 'border-green-200' },
              ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-2xl border-2 ${stat.border} ${stat.bg} shadow-sm hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-slate-600 text-sm font-semibold">{stat.label}</p>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                  <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Access List */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Patient Directory</h2>
                <p className="text-slate-500 text-sm">Showing {filteredPatients.slice(0, 6).length} active patients</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.slice(0, 6).map(patient => (
                  <PatientCard 
                    key={patient.id} 
                    patient={patient} 
                    onClick={() => handlePatientClick(patient.id)}
                    onArchive={handleArchivePatient}
                  />
                ))}
              </div>
            </section>

            {/* Recent Reports Table */}
            <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">Recent Medical Reports</h3>
                  <p className="text-slate-500 text-sm">Latest test results and patient activities</p>
                </div>
                <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">Latest {recentRecords.length} reports</div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 font-semibold border-b-2 border-slate-200">
                      <th className="py-4 pr-4">Patient</th>
                      <th className="py-4 pr-4">Contact</th>
                      <th className="py-4 pr-4">Age</th>
                      <th className="py-4 pr-4">Status</th>
                      <th className="py-4 pr-4">Diagnosis</th>
                      <th className="py-4 pr-4">Date</th>
                      <th className="py-4 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRecords.map(({ patient, record }) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-slate-800">{patient.name}</td>
                        <td className="py-4 pr-4 text-slate-600">{patient.phone}</td>
                        <td className="py-4 pr-4 text-slate-600">{patient.age}</td>
                        <td className="py-4 pr-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            patient.status === 'Critical' ? 'bg-red-100 text-red-700' :
                            patient.status === 'Active' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 max-w-xs truncate text-slate-600">{record.diagnosis}</td>
                        <td className="py-4 pr-4 text-slate-500">{record.date}</td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => shareRecord(patient, record, 'whatsapp')} className="text-green-600 hover:text-green-700 font-semibold px-2 py-1 rounded hover:bg-green-50">WA</button>
                            <button onClick={() => shareRecord(patient, record, 'email')} className="text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded hover:bg-indigo-50">📧</button>
                            <button onClick={() => printRecord(patient, record)} className="text-slate-600 hover:text-slate-700 font-semibold px-2 py-1 rounded hover:bg-slate-100">🖨️</button>
                            <button onClick={() => downloadRecord(patient, record)} className="text-slate-600 hover:text-slate-700 font-semibold px-2 py-1 rounded hover:bg-slate-100">📥</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {currentView === AppView.PATIENTS && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Patient Directory</h2>
                <p className="text-slate-500 text-sm mt-1">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-4xl mb-4">📋</p>
                <p className="text-slate-600 font-medium mb-2">No patients found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search or create a new patient</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Patient Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Age</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Last Visit</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.map(patient => (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {patient.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800">{patient.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{patient.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{patient.age}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{patient.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 truncate">{patient.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              patient.status === 'Critical' ? 'bg-red-100 text-red-700' :
                              patient.status === 'Active' ? 'bg-green-100 text-green-700' :
                              patient.status === 'Stable' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{patient.lastVisit}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => handlePatientClick(patient.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleArchivePatient(patient.id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === AppView.PATIENT_DETAIL && selectedPatient && (
          <PatientDetail 
            patient={selectedPatient} 
            onBack={() => setCurrentView(AppView.PATIENTS)}
            onDeletePatientPermanent={handleDeletePatientPermanent}
            onPatientUpdate={handlePatientUpdate}
          />
        )}

        {currentView === AppView.NEW_PATIENT && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
            <button 
              onClick={() => setCurrentView(AppView.PATIENTS)}
              className="text-blue-600 hover:text-blue-700 font-medium mb-6 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Patients</span>
            </button>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Patient</h2>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const formData = new FormData(form);
                  const filesInput = (form.elements.namedItem('attachments') as HTMLInputElement | null);
                  const files = filesInput?.files && Array.from(filesInput.files) || [];

                  // Extract selected tests
                  const testCheckboxes = Array.from(form.querySelectorAll('input[name="tests"]:checked')) as HTMLInputElement[];
                  const selectedTests = testCheckboxes.map(cb => cb.value);

                  const attachments = await Promise.all(files.map(f => new Promise<{id:string,name:string,dataUrl:string}>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ id: `A${Math.random().toString(36).substr(2,9)}`, name: f.name, dataUrl: String(reader.result) });
                    reader.readAsDataURL(f);
                  })));

                  const commentsValue = (formData.get('comments') as string || '').trim();
                  handleAddPatient({
                    name: formData.get('name') as string,
                    age: parseInt(formData.get('age') as string),
                    gender: formData.get('gender') as string,
                    bloodType: formData.get('bloodType') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    address: formData.get('address') as string,
                    status: (formData.get('status') as any) || 'Stable',
                    comments: commentsValue || null,
                    attachments,
                    tests: selectedTests.length > 0 ? selectedTests : undefined
                  } as any);
                  form.reset();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Age *</label>
                    <input 
                      type="number" 
                      name="age"
                      required
                      min="0"
                      max="150"
                      placeholder="45"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                    <select 
                      name="gender"
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Type *</label>
                    <select 
                      name="bloodType"
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Select blood type</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address *</label>
                  <input 
                    type="text" 
                    name="address"
                    required
                    placeholder="123 Main St, City, State"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Comments</label>
                  <textarea name="comments" rows={4} placeholder="Notes about patient (allergies, important info)" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Attachments</label>
                  <input name="attachments" type="file" multiple className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4">Hospital Tests Conducted</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {HOSPITAL_TESTS.map(test => (
                      <label key={test.id} className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-blue-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          name="tests"
                          value={test.name}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">
                          <span className="mr-1">{test.icon}</span>
                          {test.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select 
                    name="status"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="Stable">Stable</option>
                    <option value="Active">Active</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Add Patient
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCurrentView(AppView.PATIENTS)}
                    className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === AppView.REPORTS && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Reports Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-1">Clinical Reports</h2>
                <p className="text-slate-500 text-sm">Analytics, trends, and patient data exports</p>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={exportCSV} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"><span>📊</span><span>Export CSV</span></button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-600 font-semibold">Total Patients</p>
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-4xl font-bold text-blue-600">{stats.totalPatients}</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border-2 border-indigo-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-600 font-semibold">Active Treatments</p>
                  <span className="text-3xl">💚</span>
                </div>
                <p className="text-4xl font-bold text-indigo-600">{stats.activePatients}</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-600 font-semibold">Critical Cases</p>
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-4xl font-bold text-red-600">{stats.criticalCases}</p>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Patient Activity Trend</h3>
                <p className="text-slate-500 text-sm">Records created over the last 14 days</p>
              </div>
              <div className="w-full overflow-auto bg-slate-50 rounded-xl p-6">
                <TrendChart data={recordsTrend} />
              </div>
            </div>

            {/* Recent Records List */}
            <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Recent Medical Records</h3>
                <p className="text-slate-500 text-sm">Latest 20 patient records and diagnoses</p>
              </div>
              <div className="space-y-0 divide-y divide-slate-100">
                {patients.flatMap(p => p.records.map(r => ({ patient: p, record: r }))).slice(0, 20).map(({ patient, record }) => (
                  <div key={record.id} className="flex justify-between items-center py-4 hover:bg-slate-50 px-4 -mx-4 transition-colors">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">{record.diagnosis}</div>
                      <div className="text-xs text-slate-500 mt-1">{patient.name} — {record.date}</div>
                    </div>
                    <div className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{record.medications.slice(0, 2).join(', ')}{record.medications.length > 2 ? '...' : ''}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentView === AppView.SETTINGS && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
               <Icons.Dashboard />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Settings</h3>
            <p className="text-slate-500">Configure application options and integrations.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

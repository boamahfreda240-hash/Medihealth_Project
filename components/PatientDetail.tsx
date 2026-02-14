
import React, { useState } from 'react';
import { Patient, MedicalRecord } from '../types';
import { Icons, HOSPITAL_TESTS } from '../constants';

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
  onDeletePatientPermanent: (patientId: string) => void;
  onPatientUpdate?: (updatedPatient: Patient) => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack, onDeletePatientPermanent, onPatientUpdate }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showShareMsg, setShowShareMsg] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    bloodType: patient.bloodType,
    email: patient.email,
    phone: patient.phone,
    address: patient.address,
    status: patient.status,
    comments: patient.comments || '',
    tests: patient.tests || []
  });

  const generatePatientSummary = () => {
    return `Patient: ${patient.name} (ID: ${patient.id})
Age: ${patient.age} | Gender: ${patient.gender} | Blood Type: ${patient.bloodType}
Contact: ${patient.email} | ${patient.phone}
Status: ${patient.status}

Medical History:
${patient.records.map(r => `- ${r.date}: ${r.diagnosis} (Dr. ${r.doctor})`).join('\n')}`;
  };

  const handleShareVia = (platform: 'whatsapp' | 'email' | 'sms') => {
    const summary = generatePatientSummary();
    const encodedText = encodeURIComponent(summary);
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=Patient Report - ${patient.name}&body=${encodedText}`;
        break;
      case 'sms':
        window.location.href = `sms:?body=${encodedText}`;
        break;
    }
    setShowShareMenu(false);
    setShowShareMsg(true);
    setTimeout(() => setShowShareMsg(false), 3000);
  };

  const handlePermanentDeletePatient = async () => {
    if (!confirm('Permanently delete this patient and all records? This action cannot be undone.')) return;
    try {
      // call backend then let parent remove from local state
      import('../services/backendService').then(mod => mod.deletePatient(patient.id)).catch(()=>{});
    } finally {
      onDeletePatientPermanent(patient.id);
    }
  };

  const handleTestToggle = (test: string) => {
    setEditForm(prev => ({
      ...prev,
      tests: prev.tests.includes(test)
        ? prev.tests.filter(t => t !== test)
        : [...prev.tests, test]
    }));
  };

  const handleSaveChanges = async () => {
  setIsSaving(true);
  try {
    const updates = {
      name: editForm.name,
      age: editForm.age,
      gender: editForm.gender,
      bloodType: editForm.bloodType,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
      status: editForm.status,
      comments: editForm.comments,
      tests: editForm.tests
    };
    
    console.log('Attempting to update patient:', patient.id);
    console.log('Update data:', updates);
    
    // Dynamic import
    const { updatePatient } = await import('../services/backendService');
    
    // Try-catch specifically for the API call
    try {
      const result = await updatePatient(patient.id, updates);
      console.log('Update successful:', result);
      
      // Update local state with new patient
      const updatedPatient = { ...patient, ...updates };
      onPatientUpdate?.(updatedPatient);
      
      setIsEditing(false);
      alert('Changes saved successfully!'); // Success feedback
    } catch (apiError) {
      console.error('API Error details:', apiError);
      
      // Check if it's a network error
      if (apiError instanceof TypeError && apiError.message === 'Failed to fetch') {
        alert('Cannot connect to server. Please check if backend is running on http://localhost:4001');
      } else {
        alert(`Server error: ${apiError.message || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Import or other error:', error);
    alert('Failed to load update function. Please refresh the page.');
  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Patients
        </button>
        <div className="flex space-x-3">
          {!isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                <span className="text-sm">Edit</span>
              </button>
              <button 
                onClick={handlePermanentDeletePatient}
                className="flex items-center space-x-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                <span className="text-sm">Delete</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Icons.Share />
                  <span className="text-sm">{showShareMsg ? 'Shared!' : 'Share'}</span>
                </button>
                
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleShareVia('whatsapp')}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-2 border-b border-slate-100 transition-colors text-sm"
                    >
                      <span>💬</span>
                      <span className="text-slate-700">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShareVia('email')}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-2 border-b border-slate-100 transition-colors text-sm"
                    >
                      <span>📧</span>
                      <span className="text-slate-700">Email</span>
                    </button>
                    <button
                      onClick={() => handleShareVia('sms')}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-2 transition-colors text-sm"
                    >
                      <span>📱</span>
                      <span className="text-slate-700">SMS</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {isEditing && (
            <>
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span className="text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: patient.name,
                    age: patient.age,
                    gender: patient.gender,
                    bloodType: patient.bloodType,
                    email: patient.email,
                    phone: patient.phone,
                    address: patient.address,
                    status: patient.status,
                    comments: patient.comments || '',
                    tests: patient.tests || []
                  });
                }}
                className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                <span className="text-sm">Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Mode */}
      {!isEditing && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-5 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
              {patient.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center">{patient.name}</h2>
            <p className="text-xs text-slate-500 mt-1">ID: {patient.id}</p>
            <div className="mt-4 w-full">
              <div className={`px-3 py-1 rounded-full text-xs font-bold text-center ${
                patient.status === 'Critical' ? 'bg-red-200 text-red-700' :
                patient.status === 'Active' ? 'bg-green-200 text-green-700' :
                patient.status === 'Stable' ? 'bg-blue-200 text-blue-700' :
                'bg-slate-200 text-slate-700'
              }`}>
                {patient.status}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="bg-white bg-opacity-60 rounded-lg p-3">
              <p className="text-xs text-slate-500 font-bold uppercase">Age</p>
              <p className="text-slate-800 font-semibold">{patient.age} years</p>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-3">
              <p className="text-xs text-slate-500 font-bold uppercase">Blood Type</p>
              <p className="text-slate-800 font-semibold">{patient.bloodType}</p>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-3">
              <p className="text-xs text-slate-500 font-bold uppercase">Gender</p>
              <p className="text-slate-800 font-semibold">{patient.gender}</p>
            </div>
          </div>
        </div>

        {/* Right Columns - Contact & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Email</p>
                <p className="text-sm text-slate-700 break-all">{patient.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Phone</p>
                <p className="text-sm text-slate-700">{patient.phone}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-500 font-bold mb-1">Address</p>
              <p className="text-sm text-slate-700">{patient.address}</p>
            </div>
          </div>

          {/* Tests & Comments */}
          <div className="grid grid-cols-2 gap-6">
            {patient.tests && patient.tests.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Tests Done</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.tests.map((test, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {patient.comments && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Comments</h3>
                <p className="text-sm text-slate-700 line-clamp-3">{patient.comments}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Edit Patient Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Age</label>
              <input 
                type="number" 
                value={editForm.age}
                onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
              <select 
                value={editForm.gender}
                onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Type</label>
              <select 
                value={editForm.bloodType}
                onChange={(e) => setEditForm({...editForm, bloodType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input 
                type="tel" 
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select 
                value={editForm.status}
                onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option>Active</option>
                <option>Stable</option>
                <option>Critical</option>
                <option>Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
          <input 
            type="text" 
            value={editForm.address}
            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Comments */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Comments</label>
          <textarea 
            value={editForm.comments}
            onChange={(e) => setEditForm({...editForm, comments: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Hospital Tests */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-slate-800 mb-3">Hospital Tests</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {HOSPITAL_TESTS.map((test) => (
              <label key={test.id} className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={editForm.tests.includes(test.name)}
                  onChange={() => handleTestToggle(test.name)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{test.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default PatientDetail;

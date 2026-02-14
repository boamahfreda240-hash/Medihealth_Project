
import React from 'react';
import { Patient } from '../types';
import { Icons } from '../constants';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
  onArchive?: (id: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick, onArchive }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-700';
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'Stable': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <span className="text-xl font-bold">{patient.name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">{patient.name}</h3>
            <p className="text-sm text-slate-500">ID: {patient.id} • {patient.gender}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
          {patient.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="bg-slate-50 p-2 rounded">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider font-semibold">Age</p>
          <p className="text-slate-700 font-medium">{patient.age} yrs</p>
        </div>
        <div className="bg-slate-50 p-2 rounded">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider font-semibold">Blood Type</p>
          <p className="text-slate-700 font-medium">{patient.bloodType}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center">
          <span className="mr-2">Last Visit:</span>
          <span className="font-medium text-slate-700">{patient.lastVisit}</span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
            View Records <Icons.Plus />
          </button>
          {onArchive && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(patient.id); }}
              className="text-red-600 hover:text-red-800 font-medium"
              title="Archive patient"
            >
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCard;

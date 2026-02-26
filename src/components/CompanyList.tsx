import { Company } from '../types';
import { Building2, Mail, FileText, ChevronRight, Plus } from 'lucide-react';

interface Props {
  companies: Company[];
  onSelect: (id: string) => void;
  onAddClick: () => void;
}

export default function CompanyList({ companies, onSelect, onAddClick }: Props) {
  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
        <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
          <Building2 size={32} />
        </div>
        <p className="text-gray-500 font-medium">No hay empresas registradas.</p>
        <p className="text-gray-400 text-sm mt-1 mb-6">Comienza agregando tu primer cliente para gestionar sus indicadores.</p>
        <button
          onClick={onAddClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus size={18} />
          Nueva Empresa
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((company) => (
        <div 
          key={company.id}
          onClick={() => onSelect(company.id)}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <div className="p-2 text-gray-300 group-hover:text-emerald-500 transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
          
          <h3 className="text-lg font-extrabold text-gray-900 mb-1 line-clamp-1">{company.name}</h3>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText size={14} className="text-gray-400" />
              <span className="font-medium">NIT: {company.nit}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail size={14} className="text-gray-400" />
              <span className="truncate">{company.email}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

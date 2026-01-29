import { InformationCircleIcon, LightBulbIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ReportDescriptionProps {
  title: string;
  description: string;
  metrics: string[];
  interpretation: string;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'teal' | 'emerald' | 'rose' | 'cyan' | 'indigo';
}

const colorClasses = {
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  green: 'from-green-50 to-green-100 border-green-200',
  purple: 'from-purple-50 to-purple-100 border-purple-200',
  amber: 'from-amber-50 to-amber-100 border-amber-200',
  teal: 'from-teal-50 to-teal-100 border-teal-200',
  emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
  rose: 'from-rose-50 to-rose-100 border-rose-200',
  cyan: 'from-cyan-50 to-cyan-100 border-cyan-200',
  indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
};

const iconColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  amber: 'text-amber-600',
  teal: 'text-teal-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  cyan: 'text-cyan-600',
  indigo: 'text-indigo-600',
};

const titleColorClasses = {
  blue: 'text-blue-800',
  green: 'text-green-800',
  purple: 'text-purple-800',
  amber: 'text-amber-800',
  teal: 'text-teal-800',
  emerald: 'text-emerald-800',
  rose: 'text-rose-800',
  cyan: 'text-cyan-800',
  indigo: 'text-indigo-800',
};

function ReportDescription({ title, description, metrics, interpretation, color = 'blue' }: ReportDescriptionProps) {
  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} rounded-xl border p-5 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 p-2 rounded-lg bg-white shadow-sm ${iconColorClasses[color]}`}>
          <InformationCircleIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-3">
          <h3 className={`text-lg font-semibold ${titleColorClasses[color]}`}>{title}</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className={`h-4 w-4 ${iconColorClasses[color]}`} />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Métricas clave</span>
              </div>
              <ul className="space-y-1">
                {metrics.map((metric, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${iconColorClasses[color]} bg-current flex-shrink-0`}></span>
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <LightBulbIcon className={`h-4 w-4 ${iconColorClasses[color]}`} />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cómo interpretar</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{interpretation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDescription;

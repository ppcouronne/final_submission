import clsx from 'clsx';

const configs: Record<string, { label: string; className: string }> = {
  researching: { label: 'Researching', className: 'bg-slate-100 text-slate-600' },
  shortlisted: { label: 'Shortlisted', className: 'bg-blue-100 text-blue-700' },
  booked: { label: 'Booked', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-600' },
  suggested: { label: 'Suggested', className: 'bg-purple-100 text-purple-700' },
  interested: { label: 'Interested', className: 'bg-amber-100 text-amber-700' },
  planned: { label: 'Planned', className: 'bg-teal-100 text-teal-700' },
  done: { label: 'Done', className: 'bg-green-100 text-green-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = configs[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}

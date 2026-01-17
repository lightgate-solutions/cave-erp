interface AssetStatusBadgeProps {
  status: string;
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "In Maintenance":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "Retired":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "Disposed":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Lost/Stolen":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
}

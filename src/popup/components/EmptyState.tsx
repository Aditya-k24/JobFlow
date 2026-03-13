export function EmptyState() {
  const openOptions = () => chrome.runtime.openOptionsPage();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg
          className="h-7 w-7 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="mb-1 text-sm font-semibold text-gray-900">
        Connect your Gmail
      </h2>
      <p className="mb-4 text-xs text-gray-500">
        Glance AI reads your job-related emails to build a timeline of your
        applications.
      </p>
      <button
        onClick={openOptions}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Connect Gmail
      </button>
    </div>
  );
}

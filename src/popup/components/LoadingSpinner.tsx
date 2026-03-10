export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  return (
    <div
      className={`${sizeClass} animate-spin rounded-full border-2 border-blue-200 border-t-blue-500`}
      role="status"
      aria-label="Loading"
    />
  );
}

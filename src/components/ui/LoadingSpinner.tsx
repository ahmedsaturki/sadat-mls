export default function LoadingSpinner({
  size = "md",
  text,
}: {
  size?: "sm" | "md" | "lg";
  text?: string;
}) {
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const loadingText = text || "";

  return (
    <div className="flex items-center justify-center" role="status" aria-label={loadingText}>
      <div
        className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
      <span className="sr-only">{loadingText}</span>
    </div>
  );
}

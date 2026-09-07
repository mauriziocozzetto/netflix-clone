export default function SkeletonRow() {
  return (
    <div className="px-4 md:px-12 mb-8">
      <div className="h-6 w-32 bg-netflix-gray rounded mb-3 animate-pulse" />
      <div className="flex gap-2 overflow-hidden py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-none w-32 md:w-40 lg:w-48 aspect-[2/3] bg-netflix-gray rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function SkeletonBanner() {
  return (
    <div className="h-[70vh] md:h-[80vh] w-full bg-netflix-dark animate-pulse">
      <div className="h-full w-full bg-gradient-to-r from-netflix-black/80 to-transparent" />
    </div>
  );
}

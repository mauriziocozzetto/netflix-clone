import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import MovieCard from "./MovieCard";

export default function MovieRow({ title, items, type, favorites, onToggleFavorite, onSelect }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.8;

      if (direction === "left" && scrollLeft <= 1) {
        rowRef.current.scrollTo({
          left: scrollWidth - clientWidth,
          behavior: "smooth",
        });
      } else if (direction === "right" && scrollLeft + clientWidth >= scrollWidth - 1) {
        rowRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        rowRef.current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group px-4 md:px-12 mb-8">
      <h2 className="text-lg md:text-xl font-bold mb-2 text-white">{title}</h2>

      <button
        onClick={() => scroll("left")}
        className="absolute left-0 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-2 rounded opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <div
        ref={rowRef}
        className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-4"
      >
        {items.map((item) => (
          <MovieCard
            key={`${item.media_type || type}-${item.id}`}
            item={item}
            type={type}
            onClick={() => onSelect(item, type || item.media_type)}
            isFavorite={favorites?.has(`${item.id}`)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-2 rounded opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}

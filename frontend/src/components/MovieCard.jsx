import { useRef } from "react";
import { Play, Info, Plus, Check } from "lucide-react";
import { getImageUrl, apiFetch } from "../services/api";

export default function MovieCard({ item, type, onClick, isFavorite, onToggleFavorite }) {
  const mediaType = type || (item.media_type === "tv" ? "tv" : "movie");
  const title = item.title || item.name || "Titolo sconosciuto";
  const poster = getImageUrl(item.poster_path, "w342");
  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      onClick();
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!onToggleFavorite) return;
    if (isFavorite) {
      await apiFetch(`/api/v1/favorites/${item.id}`, { method: "DELETE" });
    } else {
      await apiFetch("/api/v1/favorites", {
        method: "POST",
        body: JSON.stringify({
          media_id: item.id,
          media_type: mediaType,
          title,
          poster_path: item.poster_path || "",
        }),
      });
    }
    onToggleFavorite();
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex-none w-32 md:w-40 lg:w-48 aspect-[2/3] rounded overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 group"
    >
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-netflix-gray flex items-center justify-center text-xs text-center p-2">
          {title}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
        <p className="text-sm font-bold line-clamp-2 drop-shadow">{title}</p>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/watch/${mediaType}/${item.id}`;
            }}
            className="p-2 bg-white text-black rounded-full hover:bg-gray-200 shadow-lg"
          >
            <Play className="w-4 h-4 fill-black" />
          </button>
          <button
            onClick={handleFavorite}
            className="p-2 bg-black/40 border border-white/80 rounded-full hover:bg-white/20 shadow-lg"
          >
            {isFavorite ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-2 bg-black/40 border border-white/80 rounded-full hover:bg-white/20 shadow-lg"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

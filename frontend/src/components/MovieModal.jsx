import { useEffect, useState } from "react";
import { X, Play, Plus, Check } from "lucide-react";
import { apiFetch, getImageUrl } from "../services/api";

export default function MovieModal({ item, type, onClose, favorites, onToggleFavorite }) {
  const [details, setDetails] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const mediaType = type || "movie";
  const title = item.title || item.name || "Titolo sconosciuto";
  const isFavorite = favorites?.has(`${item.id}`);

  useEffect(() => {
    async function load() {
      try {
        const titleParam = title || item.name || "";
        const trailerParams = new URLSearchParams();
        if (titleParam) trailerParams.append("title", titleParam);
        if (item.original_language) trailerParams.append("original_language", item.original_language);
        const trailerQuery = trailerParams.toString() ? `?${trailerParams.toString()}` : "";

        const [detailData, trailerData] = await Promise.all([
          apiFetch(`/api/v1/media/${mediaType}/${item.id}`),
          apiFetch(`/api/v1/media/${mediaType}/${item.id}/trailer${trailerQuery}`),
        ]);
        setDetails(detailData);
        setTrailerKey(trailerData.key);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [item, mediaType]);

  const handleFavorite = async () => {
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

  const backdrop = getImageUrl(details?.backdrop_path || item.backdrop_path, "original");

  const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
  };

  const runtimeInfo =
    mediaType === "movie"
      ? formatRuntime(details?.runtime)
      : details?.number_of_seasons
      ? `${details.number_of_seasons} stagion${details.number_of_seasons === 1 ? "e" : "i"}${
          details?.number_of_episodes ? ` (${details.number_of_episodes} episod${details.number_of_episodes === 1 ? "io" : "i"})` : ""
        }`
      : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-netflix-dark rounded-lg overflow-hidden shadow-2xl flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 rounded-full hover:bg-black/80"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-48 md:h-64 flex-shrink-0">
          {trailerKey ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1`}
              title="Trailer"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : backdrop ? (
            <img src={backdrop} alt={title} className="w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-transparent to-transparent" />
        </div>

        <div className="p-5 md:p-6 -mt-12 relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{title}</h2>
          <div className="flex items-center gap-3 mb-3 text-sm text-white/80">
            <span className="text-green-400 font-bold">
              {Math.round((details?.vote_average || 0) * 10)}% Match
            </span>
            <span>{(details?.release_date || details?.first_air_date || "").slice(0, 4)}</span>
            <span className="border border-white/40 px-1 text-xs">HD</span>
          </div>
          <p className="text-sm text-white/90 mb-4 line-clamp-4">{item.overview || details?.overview}</p>

          <div className="flex gap-3 mb-4">
            <a
              href={`/watch/${mediaType}/${item.id}`}
              className="flex items-center gap-2 px-5 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 text-sm"
            >
              <Play className="w-4 h-4 fill-black" /> Riproduci
            </a>
            <button
              onClick={handleFavorite}
              className="flex items-center gap-2 px-5 py-2 border border-white/50 rounded hover:bg-white/10 text-sm"
            >
              {isFavorite ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isFavorite ? "Nella mia lista" : "La mia lista"}
            </button>
          </div>

          {details?.genres && (
            <div className="text-xs text-white/70 mb-2">
              <span className="text-white/50">Generi: </span>
              {details.genres.map((g) => g.name).join(", ")}
            </div>
          )}

          {runtimeInfo && (
            <div className="text-xs text-white/70">
              <span className="text-white/50">
                {mediaType === "movie" ? "Durata: " : "Serie TV: "}
              </span>
              {runtimeInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

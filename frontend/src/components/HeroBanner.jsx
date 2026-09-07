import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, getImageUrl } from "../services/api";

export default function HeroBanner({ item, onInfo }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [muted, setMuted] = useState(true);

  const title = item?.title || item?.name || "Titolo in evidenza";
  const overview = item?.overview || "";

  useEffect(() => {
    async function loadTrailer() {
      if (!item) return;
      const type = item.media_type === "tv" ? "tv" : "movie";
      const params = new URLSearchParams();
      if (title) params.append("title", title);
      if (item.original_language) params.append("original_language", item.original_language);
      const query = params.toString() ? `?${params.toString()}` : "";
      try {
        const data = await apiFetch(`/api/v1/media/${type}/${item.id}/trailer${query}`);
        setTrailerKey(data.key);
      } catch {
        setTrailerKey(null);
      }
    }
    loadTrailer();
  }, [item]);

  const backdrop = getImageUrl(item?.backdrop_path, "original");

  return (
    <div className="relative h-[70vh] md:h-[80vh] w-full">
      {trailerKey ? (
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            className="w-full h-full scale-110"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1`}
            title="Hero Trailer"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      ) : backdrop ? (
        <img src={backdrop} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-netflix-dark" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 p-4 md:p-12 w-full md:w-2/3 lg:w-1/2">
        <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">{title}</h1>
        <p className="text-sm md:text-lg text-white/90 mb-6 line-clamp-3 drop-shadow">
          {overview}
        </p>
        <div className="flex items-center gap-3">
          <a
            href={`/watch/${item?.media_type === "tv" ? "tv" : "movie"}/${item?.id}`}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200"
          >
            <Play className="w-5 h-5 fill-black" /> Riproduci
          </a>
          <button
            onClick={onInfo}
            className="flex items-center gap-2 px-6 py-2 bg-white/30 text-white font-bold rounded hover:bg-white/20 backdrop-blur-sm"
          >
            <Info className="w-5 h-5" /> Altre info
          </button>
          {trailerKey && (
            <button
              onClick={() => setMuted(!muted)}
              className="ml-auto p-2 border border-white/50 rounded-full hover:bg-white/10"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

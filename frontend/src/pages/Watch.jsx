import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "../services/api";

export default function Watch() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const details = await apiFetch(`/api/v1/media/${type}/${id}`);
        const title = details.title || details.name || "";
        const params = new URLSearchParams();
        if (title) params.append("title", title);
        if (details.original_language) params.append("original_language", details.original_language);
        const query = params.toString() ? `?${params.toString()}` : "";
        const data = await apiFetch(`/api/v1/media/${type}/${id}/trailer${query}`);
        setTrailerKey(data.key);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, id]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-4 p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white hover:text-gray-300"
        >
          <ArrowLeft className="w-6 h-6" /> Indietro
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
        ) : trailerKey ? (
          <div className="w-full max-w-5xl aspect-video">
            <iframe
              className="w-full h-full rounded"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title="Trailer"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="text-white/70">Trailer non disponibile.</p>
        )}
      </div>
    </div>
  );
}

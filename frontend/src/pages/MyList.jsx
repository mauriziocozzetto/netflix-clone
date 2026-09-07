import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { apiFetch, getImageUrl } from "../services/api";

export default function MyList() {
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/favorites");
      setFavorites(
        data.map((f) => ({
          id: f.media_id,
          title: f.title,
          name: f.title,
          poster_path: f.poster_path,
          media_type: f.media_type,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />
      <div className="pt-24 px-4 md:px-12 pb-12">
        <h1 className="text-3xl font-bold mb-6">La mia lista</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-white/60">Non hai ancora aggiunto titoli alla tua lista.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((item) => (
              <MovieCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                type={item.media_type}
                onClick={() => setSelected({ item, type: item.media_type })}
                isFavorite={true}
                onToggleFavorite={fetchFavorites}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <MovieModal
          item={selected.item}
          type={selected.type}
          onClose={() => setSelected(null)}
          favorites={new Set(favorites.map((f) => `${f.id}`))}
          onToggleFavorite={fetchFavorites}
        />
      )}
    </div>
  );
}

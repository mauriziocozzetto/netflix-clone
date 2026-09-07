import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import MovieModal from "../components/MovieModal";
import SkeletonBanner from "../components/SkeletonBanner";
import SkeletonRow from "../components/SkeletonRow";
import { apiFetch } from "../services/api";

const MOVIE_CATEGORIES = [
  { name: "action", label: "Azione" },
  { name: "comedy", label: "Commedie" },
  { name: "horror", label: "Horror" },
  { name: "documentary", label: "Documentari" },
];

const TV_CATEGORIES = [
  { name: "crime", label: "Crime" },
  { name: "drama", label: "Drama" },
  { name: "science_fiction", label: "Fantascienza" },
  { name: "mystery", label: "Mistero" },
];

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const typeFilter = searchParams.get("type");

  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [categoryItems, setCategoryItems] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [heroItem, setHeroItem] = useState(null);
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const data = await apiFetch("/api/v1/favorites");
      setFavorites(new Set(data.map((f) => `${f.media_id}`)));
    } catch {
      setFavorites(new Set());
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (searchQuery) {
          const data = await apiFetch(`/api/v1/media/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(data.results || []);
          setHeroItem(null);
        } else if (typeFilter === "movie") {
          const [trendingData, popularData] = await Promise.all([
            apiFetch("/api/v1/media/trending?media_type=movie"),
            apiFetch("/api/v1/media/popular/movie"),
          ]);
          const items = trendingData.results || [];
          setTrending(items);
          setPopular(popularData.results || []);

          const hero = items[Math.floor(Math.random() * Math.min(items.length, 5))];
          setHeroItem(hero ? { ...hero, media_type: "movie" } : null);

          const categoryData = {};
          await Promise.all(
            MOVIE_CATEGORIES.map(async (cat) => {
              const data = await apiFetch(`/api/v1/media/category/${cat.name}?media_type=movie`);
              categoryData[cat.name] = data.results || [];
            })
          );
          setCategoryItems(categoryData);
        } else if (typeFilter === "tv") {
          const [trendingData, popularData] = await Promise.all([
            apiFetch("/api/v1/media/trending?media_type=tv"),
            apiFetch("/api/v1/media/popular/tv"),
          ]);
          const items = trendingData.results || [];
          setTrending(items);
          setPopular(popularData.results || []);

          const hero = items[Math.floor(Math.random() * Math.min(items.length, 5))];
          setHeroItem(hero ? { ...hero, media_type: "tv" } : null);

          const categoryData = {};
          await Promise.all(
            TV_CATEGORIES.map(async (cat) => {
              const data = await apiFetch(`/api/v1/media/category/${cat.name}?media_type=tv`);
              categoryData[cat.name] = data.results || [];
            })
          );
          setCategoryItems(categoryData);
        } else {
          const [trendingData, moviesData, tvData] = await Promise.all([
            apiFetch("/api/v1/media/trending"),
            apiFetch("/api/v1/media/popular/movie"),
            apiFetch("/api/v1/media/popular/tv"),
          ]);
          const allTrending = trendingData.results || [];
          setTrending(allTrending);
          setPopular(moviesData.results || []);
          setPopularTv(tvData.results || []);

          const hero = allTrending[Math.floor(Math.random() * Math.min(allTrending.length, 5))];
          setHeroItem(hero);

          const categoryData = {};
          await Promise.all(
            MOVIE_CATEGORIES.map(async (cat) => {
              const data = await apiFetch(`/api/v1/media/category/${cat.name}?media_type=movie`);
              categoryData[cat.name] = data.results || [];
            })
          );
          setCategoryItems(categoryData);
        }
        await fetchFavorites();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchQuery, typeFilter]);

  const filteredResults = searchResults.filter((item) => {
    if (!typeFilter) return true;
    return (item.media_type || "movie") === typeFilter;
  });

  const categories = typeFilter === "tv" ? TV_CATEGORIES : MOVIE_CATEGORIES;
  const pageTitle = typeFilter === "movie" ? "Film" : typeFilter === "tv" ? "Serie TV" : "Home";

  return (
    <div className="min-h-screen bg-netflix-black pb-12">
      <Navbar />

      {loading ? (
        <>
          <SkeletonBanner />
          <div className="-mt-16 relative z-10 pt-8">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </>
      ) : searchQuery ? (
        <div className="pt-24 px-4 md:px-12">
          <h2 className="text-2xl font-bold mb-4">
            Risultati per "{searchQuery}"
          </h2>
          {filteredResults.length === 0 ? (
            <p className="text-white/70 text-lg">
              Nessun risultato trovato per "{searchQuery}".
            </p>
          ) : (
            <MovieRow
              title=""
              items={filteredResults}
              onSelect={(item, type) => setSelected({ item, type })}
              favorites={favorites}
              onToggleFavorite={fetchFavorites}
            />
          )}
        </div>
      ) : (
        <>
          {heroItem && (
            <HeroBanner
              item={heroItem}
              onInfo={() => setSelected({ item: heroItem, type: heroItem.media_type || "movie" })}
            />
          )}

          <div className="-mt-16 relative z-10 pt-12">
            <h2 className="text-2xl font-bold px-4 md:px-12 mb-2">{pageTitle}</h2>
            <MovieRow
              title={typeFilter === "tv" ? "Trending Serie TV" : typeFilter === "movie" ? "Trending Film" : "Trending"}
              items={trending}
              type={typeFilter || undefined}
              onSelect={(item, type) => setSelected({ item, type })}
              favorites={favorites}
              onToggleFavorite={fetchFavorites}
            />
            <MovieRow
              title={typeFilter === "tv" ? "Serie TV Popolari" : "Film Popolari"}
              items={popular}
              type={typeFilter === "tv" ? "tv" : "movie"}
              onSelect={(item, type) => setSelected({ item, type })}
              favorites={favorites}
              onToggleFavorite={fetchFavorites}
            />
            {!typeFilter && (
              <MovieRow
                title="Serie TV Popolari"
                items={popularTv}
                type="tv"
                onSelect={(item, type) => setSelected({ item, type })}
                favorites={favorites}
                onToggleFavorite={fetchFavorites}
              />
            )}
            {categories.map((cat) => (
              <MovieRow
                key={cat.name}
                title={cat.label}
                items={categoryItems[cat.name] || []}
                type={typeFilter === "tv" ? "tv" : "movie"}
                onSelect={(item, type) => setSelected({ item, type })}
                favorites={favorites}
                onToggleFavorite={fetchFavorites}
              />
            ))}
          </div>
        </>
      )}

      {selected && (
        <MovieModal
          item={selected.item}
          type={selected.type}
          onClose={() => setSelected(null)}
          favorites={favorites}
          onToggleFavorite={fetchFavorites}
        />
      )}
    </div>
  );
}

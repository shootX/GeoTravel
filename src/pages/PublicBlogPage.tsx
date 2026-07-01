import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export default function PublicBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await apiFetch("/api/public/blog");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch blog posts", err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Travel Blog</h1>
      <p className="text-gray-600 mb-12 max-w-2xl">
        Read our latest stories, tips, and guides to inspire your next adventure.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
            >
              {post.imageUrl ? (
                <div className="h-48 overflow-hidden">
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="h-48 bg-teal-50 flex items-center justify-center">
                  <span className="text-teal-200 text-4xl">📝</span>
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-teal-600 font-semibold mb-2">
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{post.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                  {post.excerpt || "Read more about this exciting travel story..."}
                </p>
                <span className="text-[#0B4A46] text-sm font-semibold">Read article &rarr;</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500 text-lg">
            No blog posts available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}

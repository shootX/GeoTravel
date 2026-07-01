import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import SiteFooter from "../components/SiteFooter";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function PublicBlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/blog/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPost(data.post);
      })
      .catch(() => setError("Post not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500">Loading...</div>;
  }

  if (error || !post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">{error || "Not found"}</p>
        <Link to="/blog" className="text-[#0B4A46] font-medium hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>
      </div>
    );
  }

  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <article className="flex-1 w-full">
        {post.imageUrl && (
          <div className="relative h-[40vh] min-h-[240px] max-h-[480px]">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
          <Link to="/blog" className="text-sm text-[#0B4A46] font-medium hover:underline flex items-center gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> All posts
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.createdAt}>{date}</time>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">{post.excerpt}</p>
          )}

          <div className="prose prose-gray max-w-none whitespace-pre-wrap leading-relaxed text-gray-700">
            {post.content}
          </div>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}

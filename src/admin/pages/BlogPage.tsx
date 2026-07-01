import { useState, useEffect, FormEvent } from "react";
import { adminFetch } from "../api";

interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminBlogPost>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await adminFetch("/blog");
    const data = await res.json();
    setPosts(data.posts || []);
  };

  useEffect(() => {
    load();
  }, []);

  const selectPost = (post: AdminBlogPost) => {
    setSelectedId(post.id);
    setForm(post);
    setMessage(null);
  };

  const startNew = () => {
    setSelectedId("__new__");
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      imageUrl: "",
      isPublished: false,
    });
    setMessage(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const isNew = selectedId === "__new__";
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/blog" : `/blog/${selectedId}`;

    const res = await adminFetch(url, {
      method,
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setMessage("Failed to save blog post");
      return;
    }

    setMessage("Saved successfully");
    if (isNew) {
      const data = await res.json();
      setSelectedId(data.post.id);
    }
    load();
  };

  const remove = async () => {
    if (!selectedId || selectedId === "__new__") return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    await adminFetch(`/blog/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Blog Posts</h1>
          <button
            onClick={startNew}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            + New
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => selectPost(post)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${
                selectedId === post.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{post.title}</div>
                <div className="text-xs text-gray-500 truncate">/{post.slug}</div>
              </div>
              {!post.isPublished && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">DRAFT</span>
              )}
            </button>
          ))}
          {posts.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">No posts found.</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {selectedId ? (
          <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-gray-900">
              {selectedId === "__new__" ? "New Post" : "Edit Post"}
            </h2>
            {message && <div className="text-sm text-blue-600 font-medium">{message}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.slug || ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.imageUrl || ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm h-20"
                value={form.excerpt || ""}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Content (Markdown/HTML)</label>
              <textarea
                required
                className="w-full border rounded-lg px-3 py-2 text-sm h-64 font-mono"
                value={form.content || ""}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished || false}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Published
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                Save Post
              </button>
              {selectedId !== "__new__" && (
                <button
                  type="button"
                  onClick={remove}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            Select a post to edit or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}

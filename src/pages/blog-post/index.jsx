import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import blogService from "utils/blogService";
import HeaderNavigation from "../../components/ui/HeaderNavigation.jsx";
import DynamicFooter from "../../components/ui/DynamicFooter.jsx";
import OGMeta from "../../components/seo/OGMeta.jsx";
import Icon from "../../components/AppIcon.jsx";
import RoleBadge from "../../components/ui/RoleBadge.jsx";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    const res = await blogService.getPostBySlug(slug);
    if (res.success) {
      setPost(res.data);
    } else {
      setError(res.error || "Failed to load post");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      try {
        const rel = await blogService.getRelatedPosts(slug);
        if (rel.success) setRelated(rel.data);
      } catch {
        // Silently ignore related post errors (non-critical)
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between pt-24">
        <HeaderNavigation />
        <div className="max-w-3xl mx-auto p-6 flex-grow flex items-center justify-center">
          <div className="flex items-center space-x-3 text-text-secondary">
            <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            <span>Loading article...</span>
          </div>
        </div>
        <DynamicFooter />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between pt-24">
        <HeaderNavigation />
        <div className="max-w-3xl mx-auto p-6 flex-grow flex flex-col items-center justify-center text-center">
          <Icon name="AlertCircle" size={40} className="text-error mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Post Not Found</h2>
          <p className="text-text-secondary mb-6">{error || "The article you requested could not be found."}</p>
          <a href="/blog" className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition">
            Back to Blog
          </a>
        </div>
        <DynamicFooter />
      </div>
    );
  }

  const title = post.title || "Untitled";
  const desc = post.excerpt || (post.content || "").slice(0, 140);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between pt-24">
      <OGMeta
        title={title + " — Blog"}
        description={desc}
        image={post.featured_image || undefined}
      />
      {/* Title + basic meta tags handled by OGMeta & global SEO component */}
      <HeaderNavigation />
      <main className="max-w-3xl mx-auto p-6 flex-grow w-full">
        <article>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {
                const shareData = {
                  title,
                  text: desc,
                  url: window.location.href,
                };
                if (navigator.share) {
                  navigator.share(shareData).catch(() => {
                    /* ignore */
                  });
                } else {
                  try {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard");
                  } catch {
                    /* ignore */
                  }
                }
              }}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-border-accent/40 rounded hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
              aria-label="Share this post"
            >
              <Icon name="Share2" size={14} /> Share
            </button>
          </div>
          {post.author?.full_name && (
            <div className="text-sm text-text-secondary mb-6 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Icon name="User" size={16} />
                <span className="text-text-primary font-medium">
                  {post.author.full_name}
                </span>
              </div>
              <RoleBadge
                role={post.author.role}
                email={post.author.email}
                adminEmail={import.meta.env.VITE_ADMIN_EMAIL}
              />
              {post.published_at && (
                <time className="text-xs" dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString()}
                </time>
              )}
            </div>
          )}
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt="Featured"
              className="w-full rounded mb-6 object-cover max-h-[420px]"
            />
          )}
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
          {post.tags?.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-border-accent/30 px-2 py-1 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <section className="mt-14">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="Link" size={18} /> Related Posts
          </h2>
          {!related.length && (
            <p className="text-text-secondary text-sm">No related posts yet.</p>
          )}
          <ul className="space-y-3">
            {related.map((r) => (
              <li key={r.id}>
                <a
                  href={`/blog/${r.slug}`}
                  className="group block p-4 rounded bg-surface border border-border-accent/20 hover:border-primary transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium group-hover:text-primary truncate">
                      {r.title}
                    </h3>
                    {r.author?.role && (
                      <RoleBadge
                        role={r.author.role}
                        email={r.author.email}
                        adminEmail={import.meta.env.VITE_ADMIN_EMAIL}
                      />
                    )}
                  </div>
                  {r.excerpt && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {r.excerpt}
                    </p>
                  )}
                  {r.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-border-accent/40 px-1 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <DynamicFooter />
    </div>
  );
};

export default BlogPost;

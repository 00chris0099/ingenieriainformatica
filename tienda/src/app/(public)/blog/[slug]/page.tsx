import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SanitizedHTML from '@/components/ui/SanitizedHTML';

async function getPost(slug: string) {
  try {
    const wmsUrl = process.env.WMS_INTERNAL_URL || 'https://tiendavirtual-adrisuestesiwms.jpq6em.easypanel.host';
    const res = await fetch(`${wmsUrl}/api/v1/blog/posts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Articulo no encontrado' };

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/blog" className="text-green-600 hover:text-green-700 text-sm mb-4 inline-block">
        ← Volver al blog
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{post.category}</span>
          )}
          <span className="text-xs text-gray-500">
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {post.author && (
            <span className="text-xs text-gray-500">por {post.author.fullName}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
      </div>

      {post.coverImage && (
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-green max-w-none">
        <SanitizedHTML html={post.content} />
      </div>

      {post.tags?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

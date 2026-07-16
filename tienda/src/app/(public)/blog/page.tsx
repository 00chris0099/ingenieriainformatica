import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - Consejos y Novedades para Bebes',
  description: 'Articulos sobre muebles para bebes, seguridad, decoracion nursery y consejos para padres en Peru.',
};

async function getPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/blog/posts?status=published&limit=20`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
        <p className="text-gray-600 mt-2">Consejos, novedades y todo sobre muebles para bebes</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Proximamente publicaremos articulos interesantes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {post.coverImage && (
                <div className="aspect-video bg-gray-100">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {post.category && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{post.category}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('es-PE')}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{post.title}</h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

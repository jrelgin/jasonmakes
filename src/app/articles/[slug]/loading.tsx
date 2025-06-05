export default function ArticleLoading() {
    return (
      <article className="max-w-3xl mx-auto py-8 px-4 animate-pulse">
        <header className="mb-8">
          {/* Feature image skeleton */}
          <div className="mb-6 aspect-video relative rounded-lg overflow-hidden bg-gray-200" />
          
          {/* Title skeleton */}
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
          
          {/* Date skeleton */}
          <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
          
          {/* Excerpt skeleton */}
          <div className="h-6 bg-gray-200 rounded w-full" />
        </header>
        
        {/* Content skeleton */}
        <div className="prose prose-lg max-w-none">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-32 bg-gray-200 rounded w-full my-6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </article>
    );
  }
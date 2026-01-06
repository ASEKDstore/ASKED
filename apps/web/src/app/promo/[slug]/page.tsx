'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';

export default function PromoPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { data: promo, isLoading, error } = useQuery({
    queryKey: ['promo', slug],
    queryFn: () => api.getPromoBySlug(slug),
    enabled: !!slug,
  });

  const handleCtaClick = () => {
    if (!promo) return;

    if (promo.ctaType === 'PRODUCT') {
      // Handle product link: /p/:id or productId
      if (promo.ctaUrl) {
        if (promo.ctaUrl.startsWith('/p/')) {
          router.push(promo.ctaUrl);
        } else {
          // Assume it's a productId
          router.push(`/p/${promo.ctaUrl}`);
        }
      }
    } else if (promo.ctaUrl) {
      // URL - open in new tab
      window.open(promo.ctaUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка промо-страницы...</p>
        </div>
      </div>
    );
  }

  if (error || !promo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Промо-страница не найдена</CardTitle>
            <CardDescription>
              Промо-страница с указанным slug не найдена или неактивна.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/catalog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться в каталог
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get hero media (first from gallery or use banner media if available)
  const heroMedia = promo.media && promo.media.length > 0 ? promo.media[0] : null;
  const heroMediaUrl = heroMedia ? normalizeImageUrl(heroMedia.mediaUrl) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>

      {/* Hero Section */}
      {heroMediaUrl && (
        <div className="mb-8">
          <div className="w-full h-96 rounded-2xl overflow-hidden bg-gray-100">
            {heroMedia.mediaType === 'IMAGE' ? (
              <img
                src={heroMediaUrl}
                alt={promo.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.hero-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'hero-fallback w-full h-full flex items-center justify-center text-gray-400';
                    fallback.textContent = 'No image';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <video
                src={heroMediaUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
                muted
                loop
              />
            )}
          </div>
        </div>
      )}

      {/* Title and Description */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{promo.title}</CardTitle>
          {promo.description && (
            <CardDescription className="text-base mt-2">{promo.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Gallery */}
      {promo.media && promo.media.length > 1 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Галерея</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {promo.media.slice(1).map((media) => {
                const normalizedUrl = normalizeImageUrl(media.mediaUrl);
                return normalizedUrl ? (
                  <div key={media.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {media.mediaType === 'IMAGE' ? (
                      <img
                        src={normalizedUrl}
                        alt={`${promo.title} ${media.sort + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={normalizedUrl}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    )}
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Button */}
      {promo.ctaUrl && (
        <div className="flex justify-center">
          <Button
            onClick={handleCtaClick}
            size="lg"
            className="rounded-full px-8"
          >
            {promo.ctaText || 'Посмотреть'}
            {promo.ctaType === 'URL' && <ExternalLink className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      )}
    </div>
  );
}


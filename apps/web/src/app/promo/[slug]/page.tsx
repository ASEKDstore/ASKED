'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';

export default function PromoPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [heroImageError, setHeroImageError] = useState(false);

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
      {heroMedia && heroMediaUrl ? (
        <div className="mb-8">
          <div className="w-full h-96 rounded-2xl overflow-hidden bg-gray-100 relative">
            {heroMedia.mediaType === 'IMAGE' && !heroImageError ? (
              <Image
                src={heroMediaUrl}
                alt={promo.title}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized
                onError={() => setHeroImageError(true)}
              />
            ) : heroMedia.mediaType === 'IMAGE' && heroImageError ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
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
      ) : (
        <div className="mb-8">
          <div className="w-full h-96 rounded-2xl bg-muted flex items-center justify-center text-sm opacity-70">
            Нет медиа
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
                if (!media) return null;
                const normalizedUrl = normalizeImageUrl(media.mediaUrl);
                return normalizedUrl ? (
                  <div key={media.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                    {media.mediaType === 'IMAGE' ? (
                      <Image
                        src={normalizedUrl}
                        alt={`${promo.title} ${media.sort + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        unoptimized
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


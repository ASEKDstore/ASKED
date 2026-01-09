export interface PublicLabProductDto {
  id: string;
  title: string;
  subtitle: string | null;
  price: number;
  currency: string;
  coverMediaType: 'IMAGE' | 'VIDEO';
  coverMediaUrl: string;
  ctaType: 'NONE' | 'PRODUCT' | 'URL';
  ctaProductId: string | null;
  ctaUrl: string | null;
}





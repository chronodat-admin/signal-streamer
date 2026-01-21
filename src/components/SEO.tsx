import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export const SEO = ({
  title = 'TradeMoq - Real-Time Trading Signal Tracking Platform',
  description = 'Connect TradingView webhooks to TradeMoq. Track, analyze, and share your trading signals with sub-50ms latency. Real-time analytics, multi-strategy management, and public strategy pages.',
  keywords = 'trading signals, TradingView, webhook, trading alerts, signal tracking, real-time alerts, webhook alerts, trading bot signals, automated trading signals, trading analytics, win rate tracking, performance analytics, strategy sharing, public strategy pages, trading dashboard, signal latency, cryptocurrency signals, stock signals, forex signals, algorithmic trading signals',
  ogImage = 'https://trademoq.com/og-image.png',
  ogType = 'website',
  canonical,
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update description
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:url', canonical || window.location.href, true);
    updateMetaTag('og:site_name', 'TradeMoq', true);

    // Update Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical || window.location.href);
  }, [title, description, keywords, ogImage, ogType, canonical]);

  return null;
};

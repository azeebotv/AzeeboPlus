'use client';

import { useState, useCallback } from 'react';
import { Share2, Link, MessageCircle, Check, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ShareButtonProps {
  contentId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  className?: string;
}

const SHARE_PLATFORMS = [
  { id: 'twitter', label: 'Twitter', icon: Share2, color: '#1DA1F2' },
  { id: 'facebook', label: 'Facebook', icon: Share2, color: '#1877F2' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { id: 'copy', label: 'Copy Link', icon: Link, color: 'var(--brand-orange)' },
] as const;

export function ShareButton({
  contentId,
  title,
  description,
  thumbnail,
  className = '',
}: ShareButtonProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const getShareUrl = useCallback(async (): Promise<string> => {
    if (shareUrl) return shareUrl;

    try {
      const result = await apiFetch<{ shortUrl: string }>('/content/sharing/link', {
        method: 'POST',
        body: JSON.stringify({ contentId, platform: 'native' }),
      });
      if (result.success && result.data) {
        setShareUrl(result.data.shortUrl);
        return result.data.shortUrl;
      }
    } catch {
      // Fallback to direct URL
    }

    const fallback = `${typeof window !== 'undefined' ? window.location.origin : 'https://azeeboplus.com'}/content/${contentId}`;
    setShareUrl(fallback);
    return fallback;
  }, [contentId, shareUrl]);

  const handleNativeShare = useCallback(async () => {
    const url = await getShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || `Check out ${title} on Azeebo+`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      setIsOpen(true);
    }
  }, [getShareUrl, title, description]);

  const handlePlatformShare = useCallback(
    async (platform: string) => {
      const url = await getShareUrl();
      const text = encodeURIComponent(`Check out ${title} on Azeebo+`);
      const encodedUrl = encodeURIComponent(url);

      let shareLink = '';
      switch (platform) {
        case 'twitter':
          shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
          break;
        case 'facebook':
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case 'whatsapp':
          shareLink = `https://wa.me/?text=${text}%20${encodedUrl}`;
          break;
        case 'copy':
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard API not available
          }
          setIsOpen(false);
          return;
      }

      if (shareLink) {
        window.open(shareLink, '_blank', 'width=600,height=400,noopener,noreferrer');
      }

      // Track share
      apiFetch('/content/sharing/link', {
        method: 'POST',
        body: JSON.stringify({ contentId, platform }),
      }).catch(() => {});

      setIsOpen(false);
    },
    [getShareUrl, contentId, title]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
        style={{ color: 'var(--text-muted, #9A8A7A)' }}
        aria-label="Share this content"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="az-glass p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Share</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10"
                aria-label="Close share dialog"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Content Preview */}
            {thumbnail && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={thumbnail} alt={title} className="w-full h-32 object-cover" />
              </div>
            )}
            <p className="text-sm text-white/80 mb-4 line-clamp-2">{title}</p>

            {/* Platform Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {SHARE_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformShare(platform.id)}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: `${platform.color}20` }}
                  >
                    {platform.id === 'copy' && copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
                    )}
                  </div>
                  <span className="text-sm text-white/80">
                    {platform.id === 'copy' && copied ? 'Copied!' : platform.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

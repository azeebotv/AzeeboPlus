'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Check } from 'lucide-react';
import BrandLogo from '@/components/auth/BrandLogo';
import { Alert, Spinner } from '@/components/auth/FormBits';
import { OptimizedImage } from '@/components/OptimizedImage';

// Default interests - can be overridden via user-service API
const DEFAULT_INTERESTS = [
  'Comedy',
  'Movies',
  'Sports',
  'Music',
  'Gaming',
  'Reality Shows',
  'Lifestyle',
  'Education',
  'News',
  'Technology',
];

const DEFAULT_GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function ProfileSetupPage(): React.JSX.Element {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState<string>(user?.displayName || user?.name || '');
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS);
  const [genders, setGenders] = useState<string[]>(DEFAULT_GENDERS);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [interestsRes, gendersRes] = await Promise.allSettled([
          apiFetch<string[]>('/v1/users/profile-options/interests'),
          apiFetch<string[]>('/v1/users/profile-options/genders'),
        ]);
        if (
          interestsRes.status === 'fulfilled' &&
          interestsRes.value.success &&
          interestsRes.value.data
        ) {
          setInterests(interestsRes.value.data);
        }
        if (
          gendersRes.status === 'fulfilled' &&
          gendersRes.value.success &&
          gendersRes.value.data
        ) {
          setGenders(gendersRes.value.data);
        }
      } catch {
        // Use defaults
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await apiFetch('/media/upload/avatar', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      const data = result.data as { url?: string } | undefined;
      if (result.success && data?.url) {
        setAvatarUrl(data.url);
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      setError(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  const toggleInterest = useCallback((interest: string): void => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full name is required (min 2 characters)');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiFetch('/v1/users/me/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          displayName: displayName.trim() || fullName.trim(),
          fullName: fullName.trim(),
          username: username.trim() || undefined,
          avatarUrl: avatarUrl || undefined,
          email,
          phone: phone || undefined,
          location: location || undefined,
          dob: dob || undefined,
          gender: gender || undefined,
          bio: bio.trim() || undefined,
          interests: selectedInterests,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to complete profile setup');
      }

      await refreshUser?.();
      setSuccess(true);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = setTimeout(() => router.push('/home'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during profile setup';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-az-surface-root p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-[72px] items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet shadow-az-glow">
            <Check size={36} strokeWidth={2.5} className="text-az-ink" aria-hidden />
          </div>
          <h2 className="az-section-title mb-2 text-az-ink">Profile Setup Complete!</h2>
          <p className="az-body text-az-ink-muted">Redirecting you to the home page...</p>
        </div>
      </div>
    );
  }

  const profileInitial = (fullName || 'Y').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-az-surface-root p-6 text-az-ink sm:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <BrandLogo variant="light" />
        </div>

        <header className="mb-10">
          <h1 className="az-heading mb-2 text-az-ink">Profile Setup</h1>
          <p className="az-body max-w-xl text-az-ink-muted">
            Your curated home for Nigerian contents, community and creation.
          </p>
        </header>

        {error && (
          <div className="mb-6 max-w-xl">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-8">
          {/* Left: profile preview card */}
          <div className="az-glass p-6 flex flex-col items-center text-center h-fit">
            <div className="relative mb-4">
              <div
                className={`flex size-[120px] items-center justify-center overflow-hidden rounded-full border-2 border-az-ink/20 az-display text-az-ink ${
                  avatarUrl ? '' : 'bg-gradient-to-br from-az-flame to-az-scarlet'
                }`}
              >
                {isUploadingAvatar ? (
                  <Spinner />
                ) : avatarUrl ? (
                  <OptimizedImage src={avatarUrl} alt="Profile" fill className="object-cover" />
                ) : (
                  profileInitial
                )}
              </div>
              <input
                ref={fileInputRef}
                aria-label="Upload profile picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="az-micro-label absolute bottom-1 left-1/2 -translate-x-1/2 cursor-pointer whitespace-nowrap rounded-az-pill bg-az-scarlet px-3 py-1 font-bold text-az-ink"
              >
                Change profile picture
              </button>
            </div>
            <p className="az-subtitle text-az-ink">{fullName.trim() || 'Your Name'}</p>
            <p className="az-caption text-az-ink-muted">@{username.trim() || 'username'}</p>
          </div>

          {/* Right: form grid */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" className="az-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  className="az-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Yetunde Williams"
                />
              </div>
              <div>
                <label htmlFor="username" className="az-label">
                  Username
                </label>
                <input
                  id="username"
                  className="az-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="YetyWilly"
                />
              </div>
              <div>
                <label htmlFor="displayName" className="az-label">
                  Display Name
                </label>
                <input
                  id="displayName"
                  className="az-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Yetty"
                />
              </div>
              <div>
                <label htmlFor="email" className="az-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="az-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="az-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="az-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div>
                <label htmlFor="location" className="az-label">
                  Location
                </label>
                <input
                  id="location"
                  className="az-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Lagos, Nigeria"
                />
              </div>
              <div>
                <label htmlFor="dob" className="az-label">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="az-input [color-scheme:dark]"
                />
              </div>
              <div>
                <label htmlFor="gender" className="az-label">
                  Gender
                </label>
                <select
                  id="gender"
                  className="az-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    color: gender
                      ? 'var(--color-az-ink)'
                      : 'color-mix(in srgb, var(--color-az-ink) 40%, transparent)',
                  }}
                >
                  <option value="">Select gender</option>
                  {genders.map((g) => (
                    <option key={g} value={g} style={{ color: 'var(--color-az-surface-root)' }}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="az-label">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                className="az-input resize-y"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={200}
              />
              <p className="az-caption mt-1 text-right text-az-ink/40">{bio.length}/200</p>
            </div>

            <div>
              <span className="az-label">Select Your Interests</span>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      aria-pressed={selected}
                      className={`az-body-strong rounded-az-pill border px-4 py-2 transition-all ${
                        selected
                          ? 'border-az-flame bg-az-scarlet/25 text-az-ink'
                          : 'border-az-ink/12 bg-az-ink/6 text-az-ink/75 hover:border-az-glass-border-hover'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="az-btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Setting up...
                  </span>
                ) : (
                  'Complete Profile Setup'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/home')}
                className="az-body rounded-az-pill border border-az-ink/15 px-6 text-az-ink/55 transition-colors hover:text-az-ink"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

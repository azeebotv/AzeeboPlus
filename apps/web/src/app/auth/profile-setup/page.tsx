'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import BrandLogo from '@/components/auth/BrandLogo';
import { Alert, Spinner } from '@/components/auth/FormBits';

const INTERESTS = [
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

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

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
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during profile setup';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#1A0A0A' }}
      >
        <div className="text-center max-w-md">
          <div
            className="mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
              boxShadow: '0 0 30px rgba(204,28,28,0.5)',
            }}
          >
            <svg
              className="h-9 w-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="az-headline text-white text-2xl mb-2">Profile Setup Complete!</h2>
          <p className="text-white/55">Redirecting you to the home page...</p>
        </div>
      </div>
    );
  }

  const profileInitial = (fullName || 'Y').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full p-6 sm:p-10" style={{ backgroundColor: '#1A0A0A' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <BrandLogo variant="light" />
        </div>

        <header className="mb-10">
          <h1 className="az-headline text-white text-4xl mb-2">Profile Setup</h1>
          <p className="text-white/55 text-sm max-w-xl">
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
                className="rounded-full flex items-center justify-center font-bold text-white"
                style={{
                  width: 120,
                  height: 120,
                  fontSize: 48,
                  background: 'linear-gradient(135deg, #0D3B2E, #1A0A0A)',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {profileInitial}
              </div>
              <span
                className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap px-3 py-1"
                style={{ background: '#CC1C1C', borderRadius: 999 }}
              >
                Change profile picture
              </span>
            </div>
            <p className="az-headline text-white text-lg">
              {fullName.trim() || 'Yetunde Williams'}
            </p>
            <p className="text-white/50 text-sm">@{username.trim() || 'YetyWilly'}</p>
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
                  className="az-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{ colorScheme: 'dark' }}
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
                  style={{ color: gender ? '#fff' : 'rgba(255,255,255,0.4)' }}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g} style={{ color: '#000' }}>
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
                className="az-input"
                style={{ resize: 'vertical' }}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={200}
              />
              <p className="text-right text-white/40 text-xs mt-1">{bio.length}/200</p>
            </div>

            <div>
              <span className="az-label">Select Your Interests</span>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: selected ? 'rgba(204,28,28,0.25)' : 'rgba(255,255,255,0.06)',
                        border: selected ? '1px solid #CC1C1C' : '1px solid rgba(255,255,255,0.12)',
                        color: selected ? '#fff' : 'rgba(255,255,255,0.75)',
                      }}
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
                  'Continue to Interests'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 rounded-full text-sm font-medium text-white/55 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
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

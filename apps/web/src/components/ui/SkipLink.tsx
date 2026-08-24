'use client';

export function SkipLink() {
  const [focused, setFocused] = useState(false);
  return (
    <a
      href="#main-content"
      className={`fixed top-0 left-0 z-[100] px-4 py-2 bg-blue-600 text-white font-medium transition-transform ${
        focused ? 'translate-y-0' : '-translate-y-full'
      }`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      Skip to main content
    </a>
  );
}

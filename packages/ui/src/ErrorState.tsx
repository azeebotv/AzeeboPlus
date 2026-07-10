interface ErrorStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onRetry?: () => void;
  onButtonPress?: () => void;
}

export function ErrorState({ title = 'Error', description, buttonText = 'Try Again', onRetry, onButtonPress }: ErrorStateProps) {
  const handlePress = onRetry || onButtonPress;
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
      {handlePress && (
        <button
          onClick={handlePress}
          className="px-4 py-2 bg-[#E8420A] text-white rounded-lg hover:bg-[#C83A08] transition-colors"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

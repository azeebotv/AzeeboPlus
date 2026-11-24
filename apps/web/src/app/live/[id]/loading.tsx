import RouteLoading from '@/components/ui/RouteLoading';

export default function LiveDetailLoading(): React.JSX.Element {
  return <RouteLoading label="Connecting to live stream" hint="Connecting to stream..." />;
}

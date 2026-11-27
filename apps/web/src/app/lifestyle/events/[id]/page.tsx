import { Metadata } from 'next';
import { resolvedApiUrl } from '../../../../lib/api';
import EventDetailClient from './EventDetailClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/lifestyle/events/${id}`, {
      next: { revalidate: 60 },
    });
    const body = await res.json();

    if (!body.success || !body.data) {
      return {
        title: 'Event Not Found',
        description: 'The requested event could not be found.',
      };
    }

    const event: {
      title: string;
      description: string;
      thumbnail?: string;
      venue?: string;
      city?: string;
      country?: string;
      date?: string;
    } = body.data;

    const location = [event.venue, event.city, event.country].filter(Boolean).join(', ');
    const description = location ? `${event.description} — ${location}` : event.description;

    return {
      title: event.title,
      description,
      openGraph: {
        title: event.title,
        description,
        type: 'website',
        ...(event.date ? { publishedTime: event.date } : {}),
        images: event.thumbnail ? [{ url: event.thumbnail }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description,
        images: event.thumbnail ? [event.thumbnail] : [],
      },
    };
  } catch {
    return {
      title: 'Events - Azeebo+',
      description: 'Discover lifestyle events on Azeebo+',
    };
  }
}

export default async function EventDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  return <EventDetailClient id={id} />;
}

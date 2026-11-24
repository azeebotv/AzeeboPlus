import { NextRequest, NextResponse } from 'next/server';
import { getLiveDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || 'AZ-8492';

    const liveDb = getLiveDb();
    const room = await liveDb.watchPartyRoom.findUnique({
      where: { code },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Watch party room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        code: room.code,
        title: room.title,
        contentId: room.contentId,
        playbackTime: room.playbackTime,
        isPlaying: room.isPlaying,
        participants: room.participants || [],
        messages: room.messages.map((m) => ({
          id: m.id,
          user: m.userName,
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query watch party room';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code = 'AZ-8492', userName = 'You', message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    const liveDb = getLiveDb();
    const room = await liveDb.watchPartyRoom.findUnique({ where: { code } });
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const newMsg = await liveDb.watchPartyMessage.create({
      data: {
        roomId: room.id,
        userId: 'usr-client',
        userName,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newMsg.id,
        user: newMsg.userName,
        text: newMsg.message,
        time: new Date(newMsg.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to post message';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

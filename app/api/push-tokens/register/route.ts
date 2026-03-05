import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST /api/push-tokens/register - Register or update Expo push token
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pushToken, deviceId, deviceType } = body;

    if (!pushToken) {
      return NextResponse.json(
        { success: false, error: 'pushToken is required' },
        { status: 400 }
      );
    }

    // Validate deviceType if provided
    if (deviceType && deviceType !== 'ios' && deviceType !== 'android') {
      return NextResponse.json(
        { success: false, error: 'deviceType must be "ios" or "android"' },
        { status: 400 }
      );
    }

    // Check if token already exists for this user
    const existingToken = await prisma.expoPushToken.findUnique({
      where: { pushToken },
    });

    let expoPushToken;

    if (existingToken) {
      // Update existing token if it belongs to the same user
      if (existingToken.userId === session.user.id) {
        expoPushToken = await prisma.expoPushToken.update({
          where: { id: existingToken.id },
          data: {
            deviceId,
            deviceType,
            isActive: true,
            lastUsedAt: new Date(),
          },
        });
      } else {
        // Token belongs to another user — reassign it to the current user
        expoPushToken = await prisma.expoPushToken.update({
          where: { id: existingToken.id },
          data: {
            userId: session.user.id,
            deviceId,
            deviceType,
            isActive: true,
            lastUsedAt: new Date(),
          },
        });
      }
    } else {
      // Create new token
      expoPushToken = await prisma.expoPushToken.create({
        data: {
          pushToken,
          userId: session.user.id,
          deviceId,
          deviceType,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: expoPushToken,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

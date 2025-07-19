
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.BACKEND_API_URL;

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const path = pathname.replace('/api', ''); // Remove /api prefix

  if (!BACKEND_API_BASE_URL) {
    return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
  }

  const backendUrl = `${BACKEND_API_BASE_URL}${path}?${searchParams.toString()}`;

  try {
    const response = await fetch(backendUrl, {
      headers: request.headers,
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Backend error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Proxy GET request failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api', ''); // Remove /api prefix

  if (!BACKEND_API_BASE_URL) {
    return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
  }

  const backendUrl = `${BACKEND_API_BASE_URL}${path}`;

  try {
    const body = await request.json();
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Backend error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Proxy POST request failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

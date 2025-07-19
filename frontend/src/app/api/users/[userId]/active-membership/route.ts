import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.BACKEND_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!BACKEND_API_BASE_URL) {
    return NextResponse.json(
      { error: 'Backend API URL not configured' }, 
      { status: 500 }
    );
  }

  const { userId } = await params;
  const backendUrl = `${BACKEND_API_BASE_URL}/api/v1/users/${userId}/active-membership`;

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any necessary headers from the original request
        ...Object.fromEntries(request.headers),
      },
    });

    if (!response.ok) {
      // If no active membership is found, the backend returns 404
      if (response.status === 404) {
        return NextResponse.json(null, { status: 404 });
      }
      
      // Attempt to parse error from backend if available
      let errorData = { message: `Backend error: ${response.statusText}` };
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`Proxy GET /api/users/${userId}/active-membership request failed:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
} 
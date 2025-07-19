import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  if (!BACKEND_API_BASE_URL) {
    console.error('BACKEND_API_URL environment variable is not set');
    return NextResponse.json(
      { error: 'Backend API URL not configured' }, 
      { status: 500 }
    );
  }

  const backendUrl = `${BACKEND_API_BASE_URL}/api/v1/usage/update`;
  console.log(`Proxying request to: ${backendUrl}`);

  try {
    const body = await request.json();
    console.log('Request body:', body);
    console.log('Request body type:', typeof body);
    console.log('Request body keys:', Object.keys(body));
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Don't forward all headers as they might interfere with the request
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Attempt to parse error from backend if available
      let errorData = { message: `Backend error: ${response.statusText}` };
      try {
        errorData = await response.json();
        console.log('Backend error response:', errorData);
      } catch (e) {
        console.log('Could not parse backend error response as JSON');
        // Ignore if response is not JSON
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('Backend response:', data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Proxy POST /api/usage/update request failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
} 
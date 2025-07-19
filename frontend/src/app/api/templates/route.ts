
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.BACKEND_API_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerType = searchParams.get('customer_type');

  if (!BACKEND_API_BASE_URL) {
    return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
  }

  let backendUrl = `${BACKEND_API_BASE_URL}/api/v1/templates`;
  if (customerType) {
    backendUrl += `?customer_type=${customerType}`;
  }

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
    console.error('Proxy GET /api/templates request failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

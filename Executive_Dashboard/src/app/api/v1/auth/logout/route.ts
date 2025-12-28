import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ data: { success: true } })
  
  response.cookies.delete('refreshToken')
  
  return response
}


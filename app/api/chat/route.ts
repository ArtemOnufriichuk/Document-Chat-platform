import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    return NextResponse.json({ response: `Received: ${message}` })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Произошла внутренняя ошибка сервера.",
      },
      { status: 500 },
    )
  }
}


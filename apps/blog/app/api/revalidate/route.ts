import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const tag = request.nextUrl.searchParams.get("tag");

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: "Missing tag parameter" }, { status: 400 });
  }

  // Revalidate the specific post
  revalidateTag(`post-${tag}`);
  // Also revalidate post listings (homepage, category pages)
  revalidateTag("posts");

  return NextResponse.json({ revalidated: true, tag });
}

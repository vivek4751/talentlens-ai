import { NextRequest, NextResponse } from "next/server";
import { PdfParserService } from "@/services/pdf-parser.service";
import { MatchingService } from "@/services/matching.service";
import { mobileError, requireMobileUser } from "@/lib/mobile-auth";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (user.role !== "candidate") return NextResponse.json({ message: "Candidate access is required." }, { status: 403 });
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) return NextResponse.json({ message: "A PDF resume is required." }, { status: 400 });
    const candidate = await MatchingService.createCandidateProfile(user.id, await PdfParserService.parsePdf(Buffer.from(await file.arrayBuffer())));
    return NextResponse.json({ success: true, data: { id: candidate.id, candidateId: candidate.candidateId, name: candidate.name } }, { status: 201 });
  } catch (error) {
    const { message, status } = mobileError(error);
    return NextResponse.json({ message }, { status });
  }
}

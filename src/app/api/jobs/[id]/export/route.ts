import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ExcelJS from "exceljs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const role = (session.user as any).role;
    if (role !== "recruiter" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 2. Retrieve job and verify exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ message: "Job Posting not found" }, { status: 404 });
    }

    // 4. Retrieve candidate matches ordered by overall score in descending order
    const matches = await prisma.match.findMany({
      where: { jobId },
      orderBy: { overallScore: "desc" },
      include: {
        candidate: {
          select: {
            candidateId: true,
            name: true,
            rawResumeText: true,
          },
        },
      },
    });

    // 5. Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TalentLens AI";
    workbook.lastModifiedBy = "TalentLens AI";
    workbook.created = new Date();
    workbook.modified = new Date();

    // WORKSHEET 1: Ranked Candidates
    const sheet1 = workbook.addWorksheet("Ranked Candidates");
    sheet1.views = [{ state: "frozen", ySplit: 1 }];

    sheet1.columns = [
      { header: "Rank", key: "rank", width: 8 },
      { header: "Candidate ID", key: "candidateId", width: 15 },
      { header: "Candidate Name", key: "name", width: 25 },
      { header: "Job ID", key: "jobId", width: 25 },
      { header: "Overall Score", key: "overallScore", width: 15 },
      { header: "Semantic Score", key: "semanticScore", width: 15 },
      { header: "Skills Score", key: "skillsScore", width: 15 },
      { header: "Experience Score", key: "experienceScore", width: 18 },
      { header: "Education Score", key: "educationScore", width: 18 },
      { header: "Domain Score", key: "domainScore", width: 15 },
      { header: "Career Progression", key: "careerProgressionScore", width: 20 },
      { header: "Availability", key: "availabilityScore", width: 15 },
      { header: "AI Recommendation", key: "recommendation", width: 20 },
      { header: "Explainability", key: "hiringRecommendation", width: 45 },
      { header: "Resume Status", key: "resumeStatus", width: 15 },
    ];

    // Style Header Row
    const headerRow1 = sheet1.getRow(1);
    headerRow1.height = 28;
    headerRow1.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" }, // Slate 800
    };
    headerRow1.alignment = { vertical: "middle", horizontal: "center" };

    // Add Data Rows
    matches.forEach((m, idx) => {
      const score = m.overallScore;
      
      let rec = "Reject";
      if (score >= 0.8) rec = "Strong Hire";
      else if (score >= 0.6) rec = "Hire";
      else if (score >= 0.4) rec = "Consider";

      const resumeStatus = m.candidate.rawResumeText && m.candidate.rawResumeText.trim().length > 0 
        ? "Parsed" 
        : "Pending";

      const row = sheet1.addRow({
        rank: idx + 1,
        candidateId: m.candidate.candidateId,
        name: m.candidate.name,
        jobId: m.jobId,
        overallScore: score,
        semanticScore: m.semanticSimilarity,
        skillsScore: m.skillMatchScore,
        experienceScore: m.experienceScore,
        educationScore: m.educationScore,
        domainScore: m.domainScore,
        careerProgressionScore: m.careerProgressionScore,
        availabilityScore: m.availabilityScore,
        recommendation: rec,
        hiringRecommendation: m.hiringRecommendation,
        resumeStatus: resumeStatus,
      });

      // Alignments
      row.getCell("rank").alignment = { horizontal: "center" };
      row.getCell("candidateId").alignment = { horizontal: "center" };
      row.getCell("resumeStatus").alignment = { horizontal: "center" };
      row.getCell("recommendation").alignment = { horizontal: "center" };

      // Formatting scores as percentages
      const scoreCols = [
        "overallScore",
        "semanticScore",
        "skillsScore",
        "experienceScore",
        "educationScore",
        "domainScore",
        "careerProgressionScore",
        "availabilityScore",
      ];
      scoreCols.forEach((col) => {
        const cell = row.getCell(col);
        cell.numFmt = "0.0%";
        cell.alignment = { horizontal: "right" };
      });

      // Soft conditional formatting for Overall Score cell
      const overallCell = row.getCell("overallScore");
      if (score >= 0.8) {
        overallCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } }; // Light green
        overallCell.font = { name: "Arial", size: 10, color: { argb: "FF065F46" }, bold: true };
      } else if (score >= 0.6) {
        overallCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; // Light yellow
        overallCell.font = { name: "Arial", size: 10, color: { argb: "FF92400E" }, bold: true };
      } else {
        overallCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; // Light red
        overallCell.font = { name: "Arial", size: 10, color: { argb: "FF991B1B" }, bold: true };
      }

      // Recommendation cell text styling
      const recCell = row.getCell("recommendation");
      if (rec === "Strong Hire") {
        recCell.font = { name: "Arial", size: 10, color: { argb: "FF10B981" }, bold: true };
      } else if (rec === "Hire") {
        recCell.font = { name: "Arial", size: 10, color: { argb: "FF3B82F6" }, bold: true };
      } else if (rec === "Consider") {
        recCell.font = { name: "Arial", size: 10, color: { argb: "FFF59E0B" }, bold: true };
      } else {
        recCell.font = { name: "Arial", size: 10, color: { argb: "FFEF4444" }, bold: true };
      }

      // Borders
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Auto-fit Column Widths (Sheet 1)
    sheet1.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : "";
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.max(maxLen + 4, 11);
    });

    // Enable Filters on Header
    sheet1.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 15 },
    };

    // WORKSHEET 2: Analytics Summary
    const sheet2 = workbook.addWorksheet("Analytics");
    
    // Title Banner
    sheet2.mergeCells("A1:D1");
    const titleCell = sheet2.getCell("A1");
    titleCell.value = "AI Hiring Platform Analytics Summary";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E293B" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    sheet2.getRow(1).height = 40;

    // KPI Metrics Section
    const totalCandidates = matches.length;
    const scoresList = matches.map(m => m.overallScore);
    const maxScore = totalCandidates > 0 ? Math.max(...scoresList) : 0;
    const minScore = totalCandidates > 0 ? Math.min(...scoresList) : 0;
    const avgScore = totalCandidates > 0 ? scoresList.reduce((a, b) => a + b, 0) / totalCandidates : 0;

    const strongCount = matches.filter(m => m.overallScore >= 0.8).length;
    const hireCount = matches.filter(m => m.overallScore >= 0.6 && m.overallScore < 0.8).length;
    const considerCount = matches.filter(m => m.overallScore >= 0.4 && m.overallScore < 0.6).length;
    const rejectCount = matches.filter(m => m.overallScore < 0.4).length;

    sheet2.getCell("A3").value = "Key Performance Indicators (KPIs)";
    sheet2.getCell("A3").font = { name: "Arial", size: 12, bold: true, color: { argb: "FF3B82F6" } };

    sheet2.getCell("A4").value = "Metric";
    sheet2.getCell("B4").value = "Value";
    [sheet2.getCell("A4"), sheet2.getCell("B4")].forEach((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } }; // Slate-600
      cell.alignment = { horizontal: "center" };
    });

    const kpiMetrics = [
      { metric: "Total Candidates", val: totalCandidates, fmt: undefined },
      { metric: "Average Match Score", val: avgScore, fmt: "0.0%" },
      { metric: "Highest Score", val: maxScore, fmt: "0.0%" },
      { metric: "Lowest Score", val: minScore, fmt: "0.0%" },
    ];

    kpiMetrics.forEach((kpi, idx) => {
      const rowNum = 5 + idx;
      sheet2.getCell(`A${rowNum}`).value = kpi.metric;
      
      const valCell = sheet2.getCell(`B${rowNum}`);
      valCell.value = kpi.val;
      if (kpi.fmt) {
        valCell.numFmt = kpi.fmt;
      }
      valCell.alignment = { horizontal: kpi.fmt ? "right" : "center" };
      
      // borders
      [`A${rowNum}`, `B${rowNum}`].forEach((cellRef) => {
        const c = sheet2.getCell(cellRef);
        c.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Recommendation Distribution Summary (Section 2)
    const startRecRow = 11;
    sheet2.getCell(`A${startRecRow - 1}`).value = "Recommendation Distribution";
    sheet2.getCell(`A${startRecRow - 1}`).font = { name: "Arial", size: 12, bold: true, color: { argb: "FF3B82F6" } };

    sheet2.getCell(`A${startRecRow}`).value = "Recommendation";
    sheet2.getCell(`B${startRecRow}`).value = "Count";
    sheet2.getCell(`C${startRecRow}`).value = "Percentage";
    
    [sheet2.getCell(`A${startRecRow}`), sheet2.getCell(`B${startRecRow}`), sheet2.getCell(`C${startRecRow}`)].forEach((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
      cell.alignment = { horizontal: "center" };
    });

    const recMetrics = [
      { name: "Strong Hire (>=80%)", val: strongCount, pct: totalCandidates > 0 ? strongCount / totalCandidates : 0 },
      { name: "Hire (60-79%)", val: hireCount, pct: totalCandidates > 0 ? hireCount / totalCandidates : 0 },
      { name: "Consider (40-59%)", val: considerCount, pct: totalCandidates > 0 ? considerCount / totalCandidates : 0 },
      { name: "Reject (<40%)", val: rejectCount, pct: totalCandidates > 0 ? rejectCount / totalCandidates : 0 },
    ];

    recMetrics.forEach((rec, idx) => {
      const rowNum = startRecRow + 1 + idx;
      sheet2.getCell(`A${rowNum}`).value = rec.name;
      sheet2.getCell(`B${rowNum}`).value = rec.val;
      
      const pctCell = sheet2.getCell(`C${rowNum}`);
      pctCell.value = rec.pct;
      pctCell.numFmt = "0.0%";
      
      sheet2.getCell(`B${rowNum}`).alignment = { horizontal: "center" };
      pctCell.alignment = { horizontal: "right" };

      [`A${rowNum}`, `B${rowNum}`, `C${rowNum}`].forEach((cellRef) => {
        const c = sheet2.getCell(cellRef);
        c.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Top 10 Ranked Candidates Table (Section 3)
    const startTopRow = 18;
    sheet2.getCell(`A${startTopRow - 1}`).value = "Top 10 Ranked Candidates";
    sheet2.getCell(`A${startTopRow - 1}`).font = { name: "Arial", size: 12, bold: true, color: { argb: "FF3B82F6" } };

    sheet2.getCell(`A${startTopRow}`).value = "Rank";
    sheet2.getCell(`B${startTopRow}`).value = "Candidate ID";
    sheet2.getCell(`C${startTopRow}`).value = "Candidate Name";
    sheet2.getCell(`D${startTopRow}`).value = "Overall Score";

    [sheet2.getCell(`A${startTopRow}`), sheet2.getCell(`B${startTopRow}`), sheet2.getCell(`C${startTopRow}`), sheet2.getCell(`D${startTopRow}`)].forEach((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
      cell.alignment = { horizontal: "center" };
    });

    const top10List = matches.slice(0, 10);
    top10List.forEach((m, idx) => {
      const rowNum = startTopRow + 1 + idx;
      sheet2.getCell(`A${rowNum}`).value = idx + 1;
      sheet2.getCell(`B${rowNum}`).value = m.candidate.candidateId;
      sheet2.getCell(`C${rowNum}`).value = m.candidate.name;
      
      const scoreCell = sheet2.getCell(`D${rowNum}`);
      scoreCell.value = m.overallScore;
      scoreCell.numFmt = "0.0%";

      sheet2.getCell(`A${rowNum}`).alignment = { horizontal: "center" };
      sheet2.getCell(`B${rowNum}`).alignment = { horizontal: "center" };
      scoreCell.alignment = { horizontal: "right" };

      [`A${rowNum}`, `B${rowNum}`, `C${rowNum}`, `D${rowNum}`].forEach((cellRef) => {
        const c = sheet2.getCell(cellRef);
        c.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Auto-fit Column Widths (Sheet 2)
    sheet2.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : "";
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.max(maxLen + 4, 16);
    });

    // 6. Write to Buffer and return NextResponse
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="recommended_candidates.xlsx"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Export Excel Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate Excel report" },
      { status: 500 }
    );
  }
}

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "pdf"
FONT = Path("C:/Windows/Fonts/malgun.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/malgunbd.ttf")


@dataclass(frozen=True)
class Manual:
    title: str
    filename: str
    output: str


MANUALS = [
    Manual("사용자 매뉴얼 및 릴리즈 노트", "10_USER_MANUAL_AND_RELEASE_NOTES.md", "01_user_manual_release_notes.pdf"),
    Manual("관리자 매뉴얼", "16_ADMIN_MANUAL.md", "02_admin_manual.pdf"),
    Manual("튜터 매뉴얼", "17_TUTOR_MANUAL.md", "03_tutor_manual.pdf"),
    Manual("학생 및 보호자 안내", "18_STUDENT_PARENT_GUIDE.md", "04_student_parent_guide.pdf"),
    Manual("배포 및 환경 변수 가이드", "11_DEPLOYMENT_AND_ENV_GUIDE.md", "05_deployment_env_guide.pdf"),
    Manual("Supabase 및 Vercel 운영 체크리스트", "19_SUPABASE_VERCEL_OPERATIONS_CHECKLIST.md", "06_supabase_vercel_checklist.pdf"),
    Manual("최종 개발 및 QA 체크리스트", "13_FINAL_DEVELOPMENT_CHECKLIST.md", "07_final_qa_checklist.pdf"),
    Manual("데모 시나리오", "20_DEMO_SCENARIO.md", "08_demo_scenario.pdf"),
]


class HorizontalRule(Flowable):
    def __init__(self, width: float, color=colors.HexColor("#d8d1ba")):
        super().__init__()
        self.width = width
        self.height = 1
        self.color = color

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(0.7)
        self.canv.line(0, 0, self.width, 0)


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Malgun", str(FONT)))
    pdfmetrics.registerFont(TTFont("Malgun-Bold", str(FONT_BOLD)))


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "Title": ParagraphStyle(
            "ManualTitle",
            parent=base["Title"],
            fontName="Malgun-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.HexColor("#a61c1c"),
            spaceAfter=10,
            alignment=TA_LEFT,
        ),
        "H1": ParagraphStyle(
            "ManualH1",
            parent=base["Heading1"],
            fontName="Malgun-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#a61c1c"),
            spaceBefore=16,
            spaceAfter=8,
        ),
        "H2": ParagraphStyle(
            "ManualH2",
            parent=base["Heading2"],
            fontName="Malgun-Bold",
            fontSize=13,
            leading=18,
            textColor=colors.HexColor("#1e2a38"),
            spaceBefore=11,
            spaceAfter=5,
        ),
        "H3": ParagraphStyle(
            "ManualH3",
            parent=base["Heading3"],
            fontName="Malgun-Bold",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#1e2a38"),
            spaceBefore=8,
            spaceAfter=4,
        ),
        "Body": ParagraphStyle(
            "ManualBody",
            parent=base["BodyText"],
            fontName="Malgun",
            fontSize=9.5,
            leading=15,
            textColor=colors.HexColor("#1e2a38"),
            spaceAfter=5,
        ),
        "Code": ParagraphStyle(
            "ManualCode",
            parent=base["Code"],
            fontName="Malgun",
            fontSize=8.5,
            leading=13,
            backColor=colors.HexColor("#f3edd5"),
            borderColor=colors.HexColor("#d8d1ba"),
            borderWidth=0.4,
            borderPadding=6,
            textColor=colors.HexColor("#1e2a38"),
            spaceBefore=4,
            spaceAfter=7,
        ),
        "Bullet": ParagraphStyle(
            "ManualBullet",
            parent=base["BodyText"],
            fontName="Malgun",
            fontSize=9.3,
            leading=14,
            textColor=colors.HexColor("#1e2a38"),
            leftIndent=10,
            firstLineIndent=0,
        ),
    }
    return styles


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline_markdown(text: str) -> str:
    text = esc(text)
    text = re.sub(r"`([^`]+)`", r"<font color='#a61c1c'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def list_block(items: list[str], ordered: bool, styles):
    flow_items = []
    for item in items:
        flow_items.append(
            ListItem(
                Paragraph(inline_markdown(item), styles["Bullet"]),
                leftIndent=14,
            )
        )
    return ListFlowable(
        flow_items,
        bulletType="1" if ordered else "bullet",
        start="1",
        leftIndent=16,
        bulletFontName="Malgun",
        bulletFontSize=8,
        bulletColor=colors.HexColor("#a61c1c"),
        spaceAfter=6,
    )


def parse_markdown(text: str, styles, include_title: bool = True):
    story = []
    list_items: list[str] = []
    ordered = False
    in_code = False
    code_lines: list[str] = []

    def flush_list():
        nonlocal list_items, ordered
        if list_items:
            story.append(list_block(list_items, ordered, styles))
            list_items = []
            ordered = False

    def flush_code():
        nonlocal code_lines
        if code_lines:
            story.append(Paragraph("<br/>".join(esc(line) for line in code_lines), styles["Code"]))
            code_lines = []

    for raw in text.splitlines():
        line = raw.rstrip()

        if line.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                flush_list()
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if not line.strip():
            flush_list()
            story.append(Spacer(1, 2.5))
            continue

        heading_match = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading_match:
            flush_list()
            level = len(heading_match.group(1))
            content = heading_match.group(2).strip()
            if level == 1 and include_title:
                story.append(Paragraph(inline_markdown(content), styles["Title"]))
                story.append(HorizontalRule(170 * mm))
                story.append(Spacer(1, 8))
            elif level == 1:
                story.append(Paragraph(inline_markdown(content), styles["H1"]))
            elif level == 2:
                story.append(Paragraph(inline_markdown(content), styles["H2"]))
            else:
                story.append(Paragraph(inline_markdown(content), styles["H3"]))
            continue

        bullet_match = re.match(r"^[-*]\s+(.+)$", line)
        number_match = re.match(r"^\d+\.\s+(.+)$", line)
        if bullet_match or number_match:
            is_ordered = bool(number_match)
            content = (number_match or bullet_match).group(1).strip()
            if list_items and ordered != is_ordered:
                flush_list()
            ordered = is_ordered
            list_items.append(content)
            continue

        flush_list()
        story.append(Paragraph(inline_markdown(line), styles["Body"]))

    flush_list()
    flush_code()
    return story


def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Malgun", 8)
    canvas.setFillColor(colors.HexColor("#5a6b7c"))
    canvas.drawString(doc.leftMargin, 12 * mm, "Roter Faden")
    canvas.drawRightString(A4[0] - doc.rightMargin, 12 * mm, f"{doc.page}")
    canvas.restoreState()


def build_pdf(output: Path, manuals: list[Manual], combined: bool) -> None:
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title=output.stem,
        author="Roter Faden",
    )
    story = []

    if combined:
        story.append(Paragraph("Roter Faden 운영 매뉴얼", styles["Title"]))
        story.append(Paragraph("관리자, 튜터, 학생/보호자, 배포, QA, 데모 시나리오 통합본", styles["Body"]))
        story.append(HorizontalRule(170 * mm))
        story.append(Spacer(1, 8))
        for index, manual in enumerate(manuals):
            if index:
                story.append(PageBreak())
            text = (DOCS / manual.filename).read_text(encoding="utf-8")
            story.extend(parse_markdown(text, styles, include_title=True))
    else:
        manual = manuals[0]
        text = (DOCS / manual.filename).read_text(encoding="utf-8")
        story.extend(parse_markdown(text, styles, include_title=True))

    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    register_fonts()

    build_pdf(OUT / "roter-faden-operations-manual.pdf", MANUALS, combined=True)
    for manual in MANUALS:
        build_pdf(OUT / manual.output, [manual], combined=False)

    print(f"Created PDFs in {OUT}")


if __name__ == "__main__":
    main()



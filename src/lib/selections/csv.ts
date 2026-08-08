import { SELECTION_STATUSES, type Selection, type SelectionStatus } from "./types";

export interface WantCategoryRef {
  id: string;
  categoryName: string;
}

export interface ParsedSelectionRow {
  line: number;
  companyName: string;
  position: string;
  industry: string;
  companyUrl: string;
  status: SelectionStatus;
  wantScores: Record<string, number>;
}

export interface SelectionRowError {
  line: number;
  message: string;
}

export interface ParseSelectionsCsvResult {
  rows: ParsedSelectionRow[];
  errors: SelectionRowError[];
  hasPositionColumn: boolean;
  hasStatusColumn: boolean;
  hasIndustryColumn: boolean;
  hasCompanyUrlColumn: boolean;
  matchedWantCategoryIds: string[];
}

const COMPANY_HEADERS = ["企業名", "会社名", "company", "companyname", "company_name"];
const POSITION_HEADERS = ["職種", "position"];
const STATUS_HEADERS = ["ステータス", "status"];
const INDUSTRY_HEADERS = ["業界", "industry"];
const COMPANY_URL_HEADERS = ["企業url", "企業サイト", "求人url", "url", "company_url", "companyurl"];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushField();
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function parseSelectionsCsv(
  text: string,
  wantCategories: WantCategoryRef[] = [],
): ParseSelectionsCsvResult {
  const BOM = String.fromCharCode(0xfeff);
  const stripped = text.startsWith(BOM) ? text.slice(1) : text;
  const table = parseCsvRows(stripped);

  if (table.length === 0) {
    return {
      rows: [],
      errors: [{ line: 0, message: "CSVが空です" }],
      hasPositionColumn: false,
      hasStatusColumn: false,
      hasIndustryColumn: false,
      hasCompanyUrlColumn: false,
      matchedWantCategoryIds: [],
    };
  }

  const rawHeader = table[0].map((h) => h.trim());
  const header = rawHeader.map(normalizeHeader);
  const companyIdx = header.findIndex((h) => COMPANY_HEADERS.includes(h));
  const positionIdx = header.findIndex((h) => POSITION_HEADERS.includes(h));
  const statusIdx = header.findIndex((h) => STATUS_HEADERS.includes(h));
  const industryIdx = header.findIndex((h) => INDUSTRY_HEADERS.includes(h));
  const companyUrlIdx = header.findIndex((h) => COMPANY_URL_HEADERS.includes(h));

  const wantColumnByIdx = new Map<number, string>();
  rawHeader.forEach((h, idx) => {
    if (
      idx === companyIdx ||
      idx === positionIdx ||
      idx === statusIdx ||
      idx === industryIdx ||
      idx === companyUrlIdx
    )
      return;
    const match = wantCategories.find((c) => c.categoryName.trim() === h);
    if (match) wantColumnByIdx.set(idx, match.id);
  });

  if (companyIdx === -1) {
    return {
      rows: [],
      errors: [
        { line: 1, message: "企業名の列が見つかりません（「企業名」または「company」）" },
      ],
      hasPositionColumn: positionIdx !== -1,
      hasStatusColumn: statusIdx !== -1,
      hasIndustryColumn: industryIdx !== -1,
      hasCompanyUrlColumn: companyUrlIdx !== -1,
      matchedWantCategoryIds: Array.from(wantColumnByIdx.values()),
    };
  }

  const rows: ParsedSelectionRow[] = [];
  const errors: SelectionRowError[] = [];

  for (let i = 1; i < table.length; i++) {
    const line = i + 1;
    const cols = table[i];
    if (cols.every((c) => c.trim() === "")) continue;

    const companyName = (cols[companyIdx] ?? "").trim();
    if (!companyName) {
      errors.push({ line, message: "企業名が空です" });
      continue;
    }

    const position = positionIdx === -1 ? "" : (cols[positionIdx] ?? "").trim();
    const industry = industryIdx === -1 ? "" : (cols[industryIdx] ?? "").trim();
    const companyUrl = companyUrlIdx === -1 ? "" : (cols[companyUrlIdx] ?? "").trim();
    const rawStatus = statusIdx === -1 ? "" : (cols[statusIdx] ?? "").trim();

    let status: SelectionStatus;
    if (!rawStatus) {
      status = "応募";
    } else if ((SELECTION_STATUSES as readonly string[]).includes(rawStatus)) {
      status = rawStatus as SelectionStatus;
    } else {
      errors.push({
        line,
        message: `ステータス「${rawStatus}」が不正です（${SELECTION_STATUSES.join("/")}のいずれか）`,
      });
      continue;
    }

    const wantScores: Record<string, number> = {};
    for (const [colIdx, categoryId] of wantColumnByIdx) {
      const raw = (cols[colIdx] ?? "").trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        errors.push({
          line,
          message: `Want評価「${raw}」が不正です（1〜5の整数で指定してください）`,
        });
        continue;
      }
      wantScores[categoryId] = n;
    }

    rows.push({ line, companyName, position, industry, companyUrl, status, wantScores });
  }

  return {
    rows,
    errors,
    hasPositionColumn: positionIdx !== -1,
    hasStatusColumn: statusIdx !== -1,
    hasIndustryColumn: industryIdx !== -1,
    hasCompanyUrlColumn: companyUrlIdx !== -1,
    matchedWantCategoryIds: Array.from(wantColumnByIdx.values()),
  };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildSelectionsCsv(
  selections: Selection[],
  wantCategories: WantCategoryRef[] = [],
): string {
  const header = [
    "企業名",
    "職種",
    "業界",
    "ステータス",
    "企業URL",
    ...wantCategories.map((c) => c.categoryName),
  ];
  const lines = [header.map(csvEscape).join(",")];

  for (const s of selections) {
    const row = [
      s.companyName,
      s.position,
      s.industry ?? "",
      s.status,
      s.companyUrl ?? "",
      ...wantCategories.map((c) => String(s.wantFitScores?.[c.id] ?? "")),
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  return lines.join("\r\n");
}

export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("shift-jis").decode(buffer);
  }
}

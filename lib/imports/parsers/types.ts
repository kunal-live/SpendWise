import { ImportSourceType } from "@/lib/types";

export interface ParsedRawTransaction {
  date: string;
  description: string;
  amount?: number;
  debit?: number;
  credit?: number;
  reference?: string;
  valueDate?: string;
  balance?: number;
  rawType?: string;
  account?: string;
  rawData?: Record<string, any>;
}

export interface ParsedStatementResult {
  sourceType: ImportSourceType;
  sourceName: string;
  accountIdentifier?: string;
  currency?: string;
  transactions: ParsedRawTransaction[];
  metadata?: {
    totalRowsParsed?: number;
    statementPeriod?: string;
    accountHolder?: string;
    pageCount?: number;
  };
}

export interface StatementParser {
  canParse(filename: string, content: string | Buffer): boolean;
  parse(filename: string, content: string | Buffer): Promise<ParsedStatementResult>;
}

// Shared risk level type for consistent typing across the application
export type RiskLevel = "Critical" | "High" | "Moderate" | "Low";

export interface DnsRecords {
  a: string[];
  mx: { exchange: string; priority: number }[];
  ns: string[];
  txt: string[][];
}

export interface WhoisData {
  registrar: string;
  creationDate: string;
  expiryDate: string;
  updatedDate: string;
  nameServers: string | string[];
}

export interface SslStatus {
  valid: boolean;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  issuer: string;
  subject: string;
  serialNumber: string;
  fingerprint: string;
  protocol?: string;
  cipher?: string;
  bits?: number;
}

export interface ThreatIntel {
  virusTotal: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetermined: number;
    verdict: string;
  } | null;
  googleSafeBrowsing: {
    isSafe: boolean;
    matches: string[];
  } | null;
  overallVerdict: 'Malicious' | 'Suspicious' | 'Clean';
}

export interface GeoLocation {
  country: string;
  city: string;
  isp: string;
  lat: number;
  lon: number;
  ip: string;
}

export interface AbuseReputation {
  abuseConfidenceScore: number;
  totalReports: number;
  lastReportedAt: string | null;
  usageType: string | null;
  isp: string | null;
  domain: string | null;
  isWhitelisted: boolean;
  reports: Array<{
    reportedAt: string;
    comment: string;
    categories: number[];
  }>;
}

export interface UrlScanData {
  screenshot: string;
  verdict: string;
  score: number;
  technologies: string[];
  pageDetails?: {
    title?: string;
    server?: string;
    ip?: string;
    country?: string;
    asn?: string;
    asnname?: string;
  };
  stats?: {
    requests: number;
    size: number;
    links: number;
  };
  malicious_details?: string[];
}

export interface ScanResults {
  domain: string;
  dns_data: DnsRecords;
  whois_data: WhoisData | string;
  ssl_status: SslStatus;
  threat_intel: ThreatIntel;
  geo_location?: GeoLocation | null;
  abuse_reputation?: AbuseReputation | null;
  url_scan?: UrlScanData | null;
  score: number;
  explanation: string[];
  riskLevel: RiskLevel;
  timestamp: string;
  expert_analysis?: {
    overview: string;
    risks: string[];
    recommendation: string;
  };
}

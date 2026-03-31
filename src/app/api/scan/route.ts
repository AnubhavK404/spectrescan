import { NextRequest, NextResponse } from 'next/server';
import { getDnsRecords } from '@/lib/scanner/dns';
import { getWhoisData } from '@/lib/scanner/whois';
import { getSslStatus } from '@/lib/scanner/ssl';
import { getThreatIntel, getGeoLocation, checkAbuseIPDB, submitUrlScan, getUrlScanResult } from '@/lib/scanner/threat-intel';
import { calculateRiskScore } from '@/lib/scanner/scoring';
import { generateIntelBrief } from '@/lib/scanner/intel-brief';
import { ScanResults } from '@/lib/types';

// Simple in-memory cache for repeated scans
const scanCache = new Map<string, { data: ScanResults; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract domain from URL
    let domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (domain.includes(':')) {
      domain = domain.split(':')[0];
    }

    // Check cache
    const cached = scanCache.get(domain);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Parallelize core scans
    const [dns_data, whois_data, ssl_status, threat_intel] = await Promise.all([
      getDnsRecords(domain),
      getWhoisData(domain),
      getSslStatus(domain),
      getThreatIntel(domain),
    ]);

    // Perform secondary lookups if IP is available
    let geo_location = null;
    let abuse_reputation = null;
    if (dns_data.a?.length > 0) {
      const ip = dns_data.a[0];
      [geo_location, abuse_reputation] = await Promise.all([
        getGeoLocation(ip),
        checkAbuseIPDB(ip),
      ]);
    }

    // Optional URLScan (slow, so we handle it gracefully)
    let url_scan = null;
    const urlScanUuid = await submitUrlScan(`http://${domain}`);
    if (urlScanUuid) {
      // We don't wait too long for the result to avoid timeout
      // In a real app, you'd poll this or use a webhook
      // For now, we'll try a quick fetch or just return the UUID/placeholder
      url_scan = await getUrlScanResult(urlScanUuid);
    }

    const results: Partial<ScanResults> = {
      domain,
      dns_data,
      whois_data: whois_data || 'No data found',
      ssl_status,
      threat_intel,
      geo_location,
      abuse_reputation,
      url_scan,
    };

    const risk_score = calculateRiskScore(results);
    const intel_brief = generateIntelBrief({ ...results, ...risk_score });

    const finalResponse = {
      ...results,
      ...risk_score,
      intel_brief,
      timestamp: new Date().toISOString(),
    } as ScanResults;

    // Save to cache
    scanCache.set(domain, { data: finalResponse, timestamp: Date.now() });

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Scan API Error:', error);
    return NextResponse.json({ error: 'Failed to perform scan' }, { status: 500 });
  }
}

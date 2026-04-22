import axios from 'axios';
import { ThreatIntel } from '../types';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const GOOGLE_SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;
const URLSCAN_API_KEY = process.env.URLSCAN_API_KEY;
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;

export async function checkVirusTotal(domain: string) {
  if (!VIRUSTOTAL_API_KEY) return null;

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
        },
      }
    );
    const stats = response.data?.data?.attributes?.last_analysis_stats;
    return {
      malicious: stats?.malicious || 0,
      suspicious: stats?.suspicious || 0,
      harmless: stats?.harmless || 0,
      undetermined: stats?.undetermined || 0,
      verdict: stats?.malicious > 0 ? 'Malicious' : stats?.suspicious > 0 ? 'Suspicious' : 'Clean',
    };
  } catch (error) {
    console.error('VirusTotal API Error:', error);
    return null;
  }
}

export async function checkGoogleSafeBrowsing(url: string) {
  if (!GOOGLE_SAFE_BROWSING_KEY) return null;

  try {
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`,
      {
        client: {
          clientId: 'specterscan',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }
    );

    const matches = response.data?.matches || [];
    return {
      isSafe: matches.length === 0,
      matches: matches.map((m: { threatType: string }) => m.threatType),
    };
  } catch (error) {
    console.error('Google Safe Browsing API Error:', error);
    return null;
  }
}

export async function getGeoLocation(ip: string) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    if (response.data?.status === 'fail') return null;
    return {
      country: response.data?.country || 'Unknown',
      city: response.data?.city || 'Unknown',
      isp: response.data?.isp || 'Unknown',
      lat: response.data?.lat || 0,
      lon: response.data?.lon || 0,
      ip: ip,
    };
  } catch (error) {
    console.error('GeoLocation API Error:', error);
    return null;
  }
}

export async function checkAbuseIPDB(ip: string) {
  if (!ABUSEIPDB_API_KEY) return null;

  try {
    const response = await axios.get(
      `https://api.abuseipdb.com/api/v2/check`,
      {
        params: { 
          ipAddress: ip, 
          maxAgeInDays: 90,
          verbose: true, // Fetch reports
        },
        headers: {
          'Key': ABUSEIPDB_API_KEY,
          'Accept': 'application/json',
        },
      }
    );
    const data = response.data?.data;
    return {
      abuseConfidenceScore: data?.abuseConfidenceScore || 0,
      totalReports: data?.totalReports || 0,
      lastReportedAt: data?.lastReportedAt || null,
      usageType: data?.usageType || 'Unknown',
      isp: data?.isp || 'Unknown',
      domain: data?.domain || null,
      isWhitelisted: data?.isWhitelisted || false,
      reports: data?.reports?.slice(0, 5).map((r: { reportedAt: string; comment: string; categories: number[] }) => ({
        reportedAt: r.reportedAt,
        comment: r.comment,
        categories: r.categories,
      })) || [],
    };
  } catch (error) {
    console.error('AbuseIPDB API Error:', error);
    return null;
  }
}

export async function submitUrlScan(url: string) {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.post(
      'https://urlscan.io/api/v1/scan/',
      { url: url, visibility: 'public' },
      {
        headers: {
          'API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data?.uuid;
  } catch (error) {
    console.error('URLScan Submission Error:', error);
    return null;
  }
}

export async function getUrlScanResult(uuid: string) {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey) return null;

  try {
    // Poll for the scan to process (it can take up to 20-30 seconds)
    let attempts = 0;
    let response;
    while (attempts < 6) {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        response = await axios.get(`https://urlscan.io/api/v1/result/${uuid}/`, {
          headers: { 'API-Key': apiKey }
        });
        if (response.status === 200) break;
      } catch (e) {
        attempts++;
      }
    }

    if (!response) return null;

    const data = response.data;
    const verdict = data.verdicts?.overall || {};
    const page = data.page || {};
    const stats = data.stats || {};

    return {
      screenshot: `https://urlscan.io/screenshots/${uuid}.png`,
      verdict: verdict.malicious ? 'Malicious' : 'Clean',
      score: verdict.score || 0,
      technologies: data.stats?.resourceStats?.slice(0, 10).map((s: any) => s.name) || [],
      pageDetails: {
        title: page.title,
        server: page.server,
        ip: page.ip,
        country: page.country,
        asn: page.asn,
        asnname: page.asnname
      },
      stats: {
        requests: stats.resourceStats?.length || 0,
        size: stats.totalSize || 0,
        links: data.links?.length || 0
      },
      malicious_details: verdict.tags || []
    };
  } catch (error) {
    console.error('URLScan Result Error:', error);
    return null;
  }
}

export async function getThreatIntel(domain: string): Promise<ThreatIntel> {
  const [vt, gsb] = await Promise.all([
    checkVirusTotal(domain),
    checkGoogleSafeBrowsing(`http://${domain}`),
  ]);

  return {
    virusTotal: vt,
    googleSafeBrowsing: gsb,
    overallVerdict: (vt?.verdict === 'Malicious' || gsb?.isSafe === false) ? 'Malicious' : (vt?.verdict === 'Suspicious' ? 'Suspicious' : 'Clean'),
  };
}

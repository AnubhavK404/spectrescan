import { ScanResults, WhoisData } from '../types';

export function calculateRiskScore(results: Partial<ScanResults>): {
  score: number;
  explanation: string[];
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
} {
  let score = 0;
  const reasons: string[] = [];

  // Threat Intel Scoring
  if (results.threat_intel?.overallVerdict === 'Malicious') {
    score += 80;
    reasons.push('Known malicious entity in threat intelligence databases');
  } else if (results.threat_intel?.overallVerdict === 'Suspicious') {
    score += 40;
    reasons.push('Flagged as suspicious by threat intelligence sources');
  }

  // SSL Scoring
  if (!results.ssl_status?.valid) {
    score += 40;
    reasons.push('Invalid, missing, or untrusted SSL certificate');
  } else {
    // Check for weak protocols
    if (results.ssl_status.protocol && (results.ssl_status.protocol.includes('TLSv1.0') || results.ssl_status.protocol.includes('TLSv1.1'))) {
      score += 25;
      reasons.push(`Weak SSL protocol detected (${results.ssl_status.protocol}); vulnerable to modern attacks`);
    }
    
    // Check for weak bits
    if (results.ssl_status.bits && results.ssl_status.bits < 128) {
      score += 15;
      reasons.push(`Weak SSL encryption strength (${results.ssl_status.bits} bits); below modern security standards`);
    }

    // Check for near-expiry
    if (results.ssl_status.daysRemaining < 7) {
      score += 10;
      reasons.push(`SSL certificate is expiring very soon (${results.ssl_status.daysRemaining} days remaining)`);
    }
  }

  // WHOIS Scoring (Domain Age)
  const whois = results.whois_data as WhoisData;
  if (whois?.creationDate) {
    const creationDate = new Date(whois.creationDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - creationDate.getFullYear()) * 12 + (now.getMonth() - creationDate.getMonth());

    if (ageInMonths < 6) {
      score += 15;
      reasons.push('Domain is very young (less than 6 months), which is common for phishing');
    }
  } else {
    score += 5;
    reasons.push('WHOIS registration data is hidden or unavailable');
  }

  // DNS Scoring
  if (results.dns_data?.a?.length === 0) {
    score += 10;
    reasons.push('No A records found; domain might be parked or inactive');
  }

  // AbuseIPDB Reputation Scoring
  if (results.abuse_reputation) {
    if (results.abuse_reputation.abuseConfidenceScore > 50) {
      score += 40;
      reasons.push(`IP has a high abuse confidence score (${results.abuse_reputation.abuseConfidenceScore}%)`);
    } else if (results.abuse_reputation.abuseConfidenceScore > 10) {
      score += 10;
      reasons.push(`IP has some reports of malicious activity`);
    }
  }

  // URLScan Scoring
  if (results.url_scan) {
    if (results.url_scan.verdict === 'Malicious') {
      score += 50;
      reasons.push('URLScan analysis confirmed malicious activity');
    } else if (results.url_scan.score > 50) {
      score += 25;
      reasons.push(`URLScan reported a high risk score (${results.url_scan.score}/100)`);
    }

    if (results.url_scan.malicious_details && results.url_scan.malicious_details.length > 0) {
      score += 10;
      reasons.push(`URLScan flagged suspicious tags: ${results.url_scan.malicious_details.join(', ')}`);
    }
  }

  // Final Score Normalization (0-100)
  score = Math.min(Math.max(score, 0), 100);

  return {
    score,
    explanation: reasons.length > 0 ? reasons : ['No significant threats detected'],
    riskLevel: score > 70 ? 'Critical' : score > 40 ? 'High' : score > 15 ? 'Moderate' : 'Low',
  };
}

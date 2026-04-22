import { ScanResults } from '../types';

export function generateSecurityAssessment(results: Partial<ScanResults>): {
  overview: string;
  risks: string[];
  recommendation: string;
} {
  const score = results.score || 0;
  const domain = results.domain || 'the target';
  
  let overview = '';
  const risks: string[] = [];
  let recommendation = '';

  // Overview Generation
  if (score > 70) {
    overview = `Critical security alert for ${domain}. Our deep scan has identified high-confidence indicators of malicious activity or severe infrastructure vulnerabilities that pose an immediate threat.`;
  } else if (score > 40) {
    overview = `Warning: ${domain} exhibits several suspicious characteristics. While not confirmed malicious, the combination of infrastructure anomalies and threat intelligence flags suggests a high-risk profile.`;
  } else if (score > 15) {
    overview = `Moderate caution advised for ${domain}. The domain appears functional but lacks certain modern security configurations or shows minor reputation flags that warrant attention.`;
  } else {
    overview = `${domain} appears to be a legitimate and secure entity. Our analysis found no significant threats, and the infrastructure aligns with industry best practices.`;
  }

  // Risk Analysis
  if (!results.ssl_status?.valid) {
    risks.push('Unencrypted Data: Lack of a valid SSL certificate means any data sent to this site can be intercepted via Man-in-the-Middle (MitM) attacks.');
  } else if (results.ssl_status.protocol && (results.ssl_status.protocol.includes('TLSv1.0') || results.ssl_status.protocol.includes('TLSv1.1'))) {
    risks.push('Protocol Vulnerability: Use of deprecated TLS versions allows for advanced decryption attacks (e.g., POODLE, BEAST).');
  }

  if (results.abuse_reputation && results.abuse_reputation.abuseConfidenceScore > 50) {
    risks.push(`Infrastructure Reputation: The hosting IP has a ${results.abuse_reputation.abuseConfidenceScore}% confidence score for abuse, indicating it may be part of a botnet or phishing network.`);
  }

  if (results.url_scan?.verdict === 'Malicious') {
    risks.push('Active Payload: Real-time analysis detected malicious scripts or phishing elements currently active on the page.');
  }

  if (results.threat_intel?.overallVerdict === 'Malicious') {
    risks.push('Global Blacklist: This domain is explicitly flagged in major threat intelligence databases (VirusTotal/Google Safe Browsing).');
  }

  // Recommendations
  if (score > 70) {
    recommendation = 'DO NOT PROCEED. Block all traffic to this domain. If this is an internal asset, isolate the server immediately and perform a full forensic audit.';
  } else if (score > 40) {
    recommendation = 'Exercise high caution. Do not enter sensitive credentials or download files. Verify the entity via secondary out-of-band channels before continuing.';
  } else if (score > 15) {
    recommendation = 'Safe to browse, but avoid sharing financial or highly sensitive data until infrastructure (like SSL protocols) is modernized.';
  } else {
    recommendation = 'Safe to proceed. No special precautions required based on current intelligence.';
  }

  return {
    overview,
    risks: risks.length > 0 ? risks : ['No critical risks identified.'],
    recommendation,
  };
}

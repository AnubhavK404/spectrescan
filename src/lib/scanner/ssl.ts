import tls from 'tls';
import { SslStatus } from '../types';

export async function getSslStatus(domain: string): Promise<SslStatus> {
  return new Promise((resolve) => {
    const options = {
      host: domain,
      port: 443,
      servername: domain, // SNI is important
      rejectUnauthorized: false, // We want to get info even for invalid certs
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();

      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy();
        resolve({
          valid: false,
          validFrom: '',
          validTo: '',
          daysRemaining: 0,
          issuer: 'No data found',
          subject: 'No data found',
          serialNumber: 'N/A',
          fingerprint: 'N/A',
        });
        return;
      }

      const validTo = new Date(cert.valid_to);
      const validFrom = new Date(cert.valid_from);
      const daysRemaining = Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const isValid = socket.authorized || (daysRemaining > 0 && !!cert.issuer);

      const getFirstOrString = (val: string | string[] | undefined) => {
        if (!val) return undefined;
        return Array.isArray(val) ? val[0] : val;
      };

      const result: SslStatus = {
        valid: isValid,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysRemaining: daysRemaining,
        issuer: typeof cert.issuer === 'string' ? cert.issuer : (getFirstOrString(cert.issuer.O) || getFirstOrString(cert.issuer.CN) || 'Unknown'),
        subject: typeof cert.subject === 'string' ? cert.subject : (getFirstOrString(cert.subject.CN) || 'Unknown'),
        serialNumber: cert.serialNumber || 'N/A',
        fingerprint: cert.fingerprint || 'N/A',
        protocol: protocol || undefined,
        cipher: cipher.name || undefined,
        bits: (cipher as any).bits || undefined,
      };

      socket.destroy();
      resolve(result);
    });

    socket.on('error', (error) => {
      console.error('SSL Check Socket Error:', error);
      socket.destroy();
      resolve({
        valid: false,
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        issuer: 'Error fetching certificate',
        subject: 'N/A',
        serialNumber: 'N/A',
        fingerprint: 'N/A',
      });
    });

    socket.setTimeout(5000);
    socket.on('timeout', () => {
      console.error('SSL Check Timeout');
      socket.destroy();
      resolve({
        valid: false,
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        issuer: 'Connection timeout',
        subject: 'N/A',
        serialNumber: 'N/A',
        fingerprint: 'N/A',
      });
    });
  });
}

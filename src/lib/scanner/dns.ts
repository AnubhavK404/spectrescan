import { promises as dns } from 'dns';
import { DnsRecords } from '../types';

export async function getDnsRecords(domain: string): Promise<DnsRecords> {
  try {
    const [a, mx, ns, txt] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveMx(domain),
      dns.resolveNs(domain),
      dns.resolveTxt(domain),
    ]);

    return {
      a: a.status === 'fulfilled' ? a.value : [],
      mx: mx.status === 'fulfilled' ? mx.value : [],
      ns: ns.status === 'fulfilled' ? ns.value : [],
      txt: txt.status === 'fulfilled' ? txt.value : [],
    };
  } catch (error) {
    console.error('DNS Lookup Error:', error);
    return { a: [], mx: [], ns: [], txt: [] };
  }
}

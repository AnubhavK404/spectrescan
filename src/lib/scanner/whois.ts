import whois from 'whois-json';
import { WhoisData } from '../types';

export async function getWhoisData(domain: string): Promise<WhoisData | null> {
  try {
    const results = await whois(domain);
    if (!results || Object.keys(results).length === 0) {
      return null;
    }
    return {
      registrar: results.registrar || 'No data found',
      creationDate: results.creationDate || results.createdDate || 'No data found',
      expiryDate: results.expiryDate || results.expirationDate || 'No data found',
      updatedDate: results.updatedDate || 'No data found',
      nameServers: results.nameServer || 'No data found',
    };
  } catch (error) {
    console.error('WHOIS Lookup Error:', error);
    return null;
  }
}

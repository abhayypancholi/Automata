/**
 * Tests for POST /api/check-units endpoint
 */

import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('POST /api/check-units', () => {
  const createRequest = (body: unknown) => {
    return new Request('http://localhost:3000/api/check-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };
  
  it('successfully checks valid program', async () => {
    const request = createRequest({
      source: 'tau : second\nI : volt\ndv/dt = (I - v)/tau : volt',
    });
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    
    const json = await response.json();
    expect(json.ok).toBe(true);
  });
  
  it('returns 400 for unit mismatch', async () => {
    const request = createRequest({
      source: 'I : volt\ntau : second\nx = I + tau : volt',
    });
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNIT_MISMATCH');
  });
  
  it('returns 400 for parse error', async () => {
    const request = createRequest({ source: 'x = @ : m' });
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNEXPECTED_CHARACTER');
  });
  
  it('is deterministic', async () => {
    const source = 'x : m\ny = x * 2 : m';
    const request1 = createRequest({ source });
    const request2 = createRequest({ source });
    
    const response1 = await POST(request1);
    const response2 = await POST(request2);
    
    const json1 = await response1.json();
    const json2 = await response2.json();
    
    expect(JSON.stringify(json1)).toBe(JSON.stringify(json2));
  });
});

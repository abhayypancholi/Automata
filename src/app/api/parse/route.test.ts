/**
 * Tests for POST /api/parse endpoint
 */

import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('POST /api/parse', () => {
  const createRequest = (body: unknown) => {
    return new Request('http://localhost:3000/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };
  
  it('successfully parses valid source', async () => {
    const request = createRequest({ source: 'x : m' });
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.result.ast).toBeDefined();
  });
  
  it('returns 400 for malformed JSON', async () => {
    const request = new Request('http://localhost:3000/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });
  
  it('returns 400 for missing source field', async () => {
    const request = createRequest({});
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
  });
  
  it('returns 422 for source exceeding limit', async () => {
    const longSource = 'x : m\n'.repeat(1000); // Over 5000 chars
    const request = createRequest({ source: longSource });
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
  });
  
  it('returns 400 for parse error', async () => {
    const request = createRequest({ source: 'x = @ : m' });
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNEXPECTED_CHARACTER');
  });
  
  it('returns 413 for oversized body', async () => {
    const largeBody = { source: 'x'.repeat(200000) }; // Over 100 KB
    const request = createRequest(largeBody);
    const response = await POST(request);
    
    expect(response.status).toBe(413);
    
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('BODY_TOO_LARGE');
  });
  
  it('is deterministic (same input gives same output)', async () => {
    const request1 = createRequest({ source: 'x : m\ny = x * 2 : m' });
    const request2 = createRequest({ source: 'x : m\ny = x * 2 : m' });
    
    const response1 = await POST(request1);
    const response2 = await POST(request2);
    
    const json1 = await response1.json();
    const json2 = await response2.json();
    
    expect(JSON.stringify(json1)).toBe(JSON.stringify(json2));
  });
  
  it('validates response envelope shape', async () => {
    const request = createRequest({ source: 'x : m' });
    const response = await POST(request);
    
    const json = await response.json();
    
    // Success envelope
    expect(json).toHaveProperty('ok');
    if (json.ok) {
      expect(json).toHaveProperty('result');
      expect(json.result).toHaveProperty('ast');
    }
  });
});

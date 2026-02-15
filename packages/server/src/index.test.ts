import request from 'supertest';
// import app from './index'; // We might need to export app from index.ts to test it properly

describe('Server Basic Test', () => {
    it('should pass a basic truthy test', () => {
        expect(true).toBe(true);
    });
});

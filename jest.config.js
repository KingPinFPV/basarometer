import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Path to your Next.js app
  dir: './',
});

// Custom Jest configuration
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/__tests__/**/*.ts',
    '<rootDir>/__tests__/**/*.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/globals.css',
    '!src/types/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/v3/',
    '<rootDir>/scan bot/',
    '<rootDir>/test bot/',
    '<rootDir>/mcp/',
    '<rootDir>/data/',
    '<rootDir>/system/',
    '<rootDir>/src_backup_console_cleanup_20250712_1734/',
    '<rootDir>/.*_backup.*/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/v3/',
    '<rootDir>/scan bot/',
    '<rootDir>/test bot/',
    '<rootDir>/mcp/',
    '<rootDir>/data/',
    '<rootDir>/system/',
    '<rootDir>/src_backup_console_cleanup_20250712_1734/',
    '<rootDir>/.*_backup.*/',
  ],
};

// Export Jest config
export default createJestConfig(customJestConfig);
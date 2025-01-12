import "@testing-library/jest-native/extend-expect";

const mockStorage: { [key: string]: string } = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    setItem: jest.fn((key: string, value: string) => Promise.resolve()),
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key])),
    removeItem: jest.fn((key: string) => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock fetch
const fetchMock = jest.fn();
fetchMock.mockImplementation(() =>
  Promise.resolve({ text: () => Promise.resolve("") })
);
global.fetch = fetchMock;

beforeEach(() => {
  // Clear mock storage and all mocks before each test
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  jest.clearAllMocks();
});

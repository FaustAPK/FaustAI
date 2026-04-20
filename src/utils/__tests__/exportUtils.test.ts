import {Platform, Alert} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
// import Share from 'react-native-share'; // Удалено

// Mock dependencies
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
  DownloadDirectoryPath: '/mock/downloads',
  exists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  copyFile: jest.fn(),
}));

// jest.mock('react-native-share', () => ({
//   open: jest.fn(),
// })); // Удалено

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 33,
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock the uiStore
jest.mock('../../store', () => ({
  uiStore: {
    l10n: {
      components: {
        exportUtils: {
          fileSavedMessage: 'File saved: {{filename}}',
          fileSaved: 'File Saved',
          share: 'Share',
          ok: 'OK',
          saveOptions: 'Save Options',
          saveOptionsMessage: 'Choose an option',
          cancel: 'Cancel',
          exportError: 'Export Error',
          exportErrorMessage: 'Failed to export',
          shareError: 'Share Error',
          shareErrorMessage: 'Failed to share',
          shareContentErrorMessage: 'Failed to share content',
        },
      },
    },
  },
}));

// Import after mocks
import {
  exportChatSession,
  exportAllChatSessions,
  exportPal,
  exportAllPals,
  exportLegacyChatSessions,
} from '../exportUtils';
import {chatSessionRepository} from '../../repositories/ChatSessionRepository';
import {palStore} from '../../store';

// Mock dependencies
jest.mock('../../repositories/ChatSessionRepository');
jest.mock('../../store', () => ({
  palStore: {
    getPals: jest.fn(),
  },
  uiStore: {
    l10n: {
      components: {
        exportUtils: {
          fileSavedMessage: 'File saved: {{filename}}',
          fileSaved: 'File Saved',
          share: 'Share',
          ok: 'OK',
          saveOptions: 'Save Options',
          saveOptionsMessage: 'Choose an option',
          cancel: 'Cancel',
          exportError: 'Export Error',
          exportErrorMessage: 'Failed to export',
          shareError: 'Share Error',
          shareErrorMessage: 'Failed to share',
          shareContentErrorMessage: 'Failed to share content',
        },
      },
    },
  },
}));
jest.mock('../../utils/androidPermission', () => ({
  ensureLegacyStoragePermission: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../utils/imageUtils', () => ({
  getAbsoluteThumbnailPath: jest.fn(path => path),
  isLocalThumbnailPath: jest.fn(() => true),
}));

// Mock shareJsonData function by mocking the internal implementation
jest.mock('../exportUtils', () => {
  const original = jest.requireActual('../exportUtils');
  return {
    ...original,
    __esModule: true,
    // We'll test through the public API, but we need to ensure Share.open is not actually called
  };
});

const mockedChatSessionRepository =
  chatSessionRepository as jest.Mocked<typeof chatSessionRepository>;
const mockedPalStore = palStore as jest.Mocked<typeof palStore>;

describe('exportUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock RNFS.exists to return false by default
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.writeFile as jest.Mock).mockResolvedValue(undefined);
    (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
    (RNFS.readFile as jest.Mock).mockResolvedValue('{"test": "data"}');
  });

  describe('exportChatSession', () => {
    it('exports a chat session to a JSON file', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'Test Session',
        date: new Date().toISOString(),
        activePalId: 'pal-1',
      };
      const mockMessages = [
        {
          id: 'msg-1',
          author: {id: 'user1', name: 'User'},
          text: 'Hello',
          type: 'text',
          metadata: '{}',
          createdAt: new Date().toISOString(),
        },
      ];
      const mockCompletionSettings = {
        settings: '{"temperature": 0.7}',
      };

      mockedChatSessionRepository.getSessionById.mockResolvedValue({
        session: mockSession,
        messages: mockMessages,
        completionSettings: mockCompletionSettings,
      });

      // Should not throw
      await expect(exportChatSession('session-1')).resolves.not.toThrow();

      expect(mockedChatSessionRepository.getSessionById).toHaveBeenCalledWith(
        'session-1',
      );
    });

    it('throws error if session not found', async () => {
      mockedChatSessionRepository.getSessionById.mockResolvedValue(null);

      await expect(exportChatSession('session-1')).rejects.toThrow(
        'Session not found',
      );
    });
  });

  describe('exportAllChatSessions', () => {
    it('exports all chat sessions', async () => {
      const mockSessions = [
        {id: 'session-1', title: 'Session 1', date: new Date().toISOString()},
        {id: 'session-2', title: 'Session 2', date: new Date().toISOString()},
      ];
      const mockSessionData = {
        session: {id: 'session-1', title: 'Session 1', activePalId: 'pal-1'},
        messages: [],
        completionSettings: null,
      };

      mockedChatSessionRepository.getAllSessions.mockResolvedValue(
        mockSessions as any,
      );
      mockedChatSessionRepository.getSessionById.mockResolvedValue(
        mockSessionData as any,
      );

      await expect(exportAllChatSessions()).resolves.not.toThrow();

      expect(mockedChatSessionRepository.getAllSessions).toHaveBeenCalled();
      expect(mockedChatSessionRepository.getSessionById).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe('exportPal', () => {
    it('exports a single pal', async () => {
      const mockPal = {
        id: 'pal-1',
        name: 'Test Pal',
        description: 'A test pal',
        thumbnail_url: '/mock/thumbnail.jpg',
        systemPrompt: 'You are a test pal',
        originalSystemPrompt: 'You are a test pal',
        isSystemPromptChanged: false,
        useAIPrompt: false,
        defaultModel: 'model-1',
        promptGenerationModel: 'model-2',
        generatingPrompt: false,
        color: ['#FF0000'],
        capabilities: {},
        parameters: {},
        parameterSchema: [],
        source: 'local',
        palshub_id: null,
        creator_info: null,
        categories: [],
        tags: [],
        rating: 0,
        review_count: 0,
        protection_level: 'public',
        price_cents: 0,
        is_owned: true,
        completionSettings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockedPalStore.getPals.mockReturnValue([mockPal]);
      (RNFS.readFile as jest.Mock).mockResolvedValue('base64image');

      await expect(exportPal('pal-1')).resolves.not.toThrow();

      expect(mockedPalStore.getPals).toHaveBeenCalled();
    });

    it('throws error if pal not found', async () => {
      mockedPalStore.getPals.mockReturnValue([]);

      await expect(exportPal('pal-1')).rejects.toThrow('Pal not found');
    });
  });

  describe('exportAllPals', () => {
    it('exports all pals', async () => {
      const mockPals = [
        {
          id: 'pal-1',
          name: 'Pal 1',
          description: 'First pal',
          thumbnail_url: '/mock/pal1.jpg',
          systemPrompt: 'Prompt 1',
          originalSystemPrompt: 'Prompt 1',
          isSystemPromptChanged: false,
          useAIPrompt: false,
          defaultModel: 'model-1',
          promptGenerationModel: 'model-2',
          generatingPrompt: false,
          color: ['#FF0000'],
          capabilities: {},
          parameters: {},
          parameterSchema: [],
          source: 'local',
          palshub_id: null,
          creator_info: null,
          categories: [],
          tags: [],
          rating: 0,
          review_count: 0,
          protection_level: 'public',
          price_cents: 0,
          is_owned: true,
          completionSettings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockedPalStore.getPals.mockReturnValue(mockPals as any);
      (RNFS.readFile as jest.Mock).mockResolvedValue('base64image');

      await expect(exportAllPals()).resolves.not.toThrow();

      expect(mockedPalStore.getPals).toHaveBeenCalled();
    });
  });

  describe('exportLegacyChatSessions', () => {
    it('exports legacy chat sessions if file exists', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.readFile as jest.Mock).mockResolvedValue('{"legacy": "data"}');

      await expect(exportLegacyChatSessions()).resolves.not.toThrow();

      expect(RNFS.exists).toHaveBeenCalled();
      expect(RNFS.readFile).toHaveBeenCalled();
    });

    it('throws error if legacy file does not exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      await expect(exportLegacyChatSessions()).rejects.toThrow(
        'Legacy chat sessions file not found',
      );
    });
  });
});
import {
  ListNames,
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  PHISHING_CONFIG_BASE_URL,
  METAMASK_STALELIST_FILE,
  METAMASK_HOTLIST_DIFF_FILE,
} from '@rolanapp/phishing-controller';
import { ApprovalRequestNotFoundError } from '@rolanapp/approval-controller';
import { PermissionsRequestNotFoundError } from '@rolanapp/permission-controller';
import nock from 'nock';
import mockEncryptor from '../../test/lib/mock-encryptor';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import rolanAppController from './rolanapp-controller';

const { Ganache } = require('../../test/e2e/seeder/ganache');
const ganacheServer = new Ganache();

const browserPolyfillMock = {
  runtime: {
    id: 'fake-extension-id',
    onInstalled: { addListener: () => {} },
    onMessageExternal: { addListener: () => {} },
    getPlatformInfo: async () => 'mac',
  },
  storage: {
    local: {
      get: jest.fn().mockReturnValue({}),
      set: jest.fn(),
    },
  },
};

let loggerMiddlewareMock;
const initializeMockMiddlewareLog = () => {
  loggerMiddlewareMock = { requests: [], responses: [] };
};
const tearDownMockMiddlewareLog = () => {
  loggerMiddlewareMock = undefined;
};

const createLoggerMiddlewareMock = () =>
  (req, res, next) => {
    if (loggerMiddlewareMock) {
      loggerMiddlewareMock.requests.push(req);
      next((cb) => {
        loggerMiddlewareMock.responses.push(res);
        cb();
      });
      return;
    }
    next();
  };

jest.mock('./lib/createLoggerMiddleware', () => createLoggerMiddlewareMock);

const mockULIDs = [
  '01JKAF3DSGM3AB87EM9N0K41AJ',
  '01JKAF3KP7VPAG0YXEDTDRB6ZV',
  '01JKAF3KP7VPAG0YXEDTDRB6ZW',
  '01JKAF3KP7VPAG0YXEDTDRB6ZX',
];

function* ulidGenerator(ulids = mockULIDs) {
  for (const id of ulids) {
    yield id;
  }
  throw new Error('should not be called after exhausting provided IDs');
}

let mockUlidGenerator = ulidGenerator();

jest.mock('ulid', () => ({
  ulid: jest.fn().mockImplementation(() => mockUlidGenerator.next().value),
}));

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('rolanAppController', function () {
  let rolanappController;
  const noop = () => {};

  beforeAll(async () => {
    await ganacheServer.start({ port: 32545 });
  });

  beforeEach(() => {
    nock(PHISHING_CONFIG_BASE_URL)
      .persist()
      .get(METAMASK_STALELIST_FILE)
      .reply(
        200,
        JSON.stringify({
          version: 2,
          tolerance: 2,
          lastUpdated: 1,
          eth_phishing_detect_config: {
            fuzzylist: [],
            allowlist: [],
            blocklist: ['127.0.0.1'],
            name: ListNames.rolanApp,
          },
        }),
      )
      .get(METAMASK_HOTLIST_DIFF_FILE)
      .reply(
        200,
        JSON.stringify([
          { url: '127.0.0.1', targetList: 'blocklist', timestamp: 0 },
        ]),
      );
    rolanappController = new rolanAppController({
      showUserConfirmation: noop,
      encryptor: mockEncryptor,
      initLangCode: 'en_US',
      platform: {
        showTransactionNotification: () => {},
        getVersion: () => 'foo',
      },
      browser: browserPolyfillMock,
      infuraProjectId: 'foo',
    });
    initializeMockMiddlewareLog();
    mockUlidGenerator = ulidGenerator();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
    tearDownMockMiddlewareLog();
  });

  afterAll(async () => {
    await ganacheServer.quit();
  });

  describe('Phishing Detection Mock', function () {
    it('should be updated to use v1 of the API', function () {
      expect(METAMASK_STALELIST_URL).toStrictEqual(
        'https://phishing-detection.api.cx.rolanapp.io/v1/stalelist',
      );
      expect(METAMASK_HOTLIST_DIFF_URL).toStrictEqual(
        'https://phishing-detection.api.cx.rolanapp.io/v1/diffsSince',
      );
    });
  });

  describe('#addNewAccount', function () {
    it('two parallel calls with same accountCount give same result', async function () {
      await rolanappController.createNewVaultAndKeychain('test@123');
      const [addNewAccountResult1, addNewAccountResult2] = await Promise.all([
        rolanappController.addNewAccount(1),
        rolanappController.addNewAccount(1),
      ]);
      expect(addNewAccountResult1).toStrictEqual(addNewAccountResult2);
    });

    it('two successive calls with same accountCount give same result', async function () {
      await rolanappController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await rolanappController.addNewAccount(1);
      const addNewAccountResult2 = await rolanappController.addNewAccount(1);
      expect(addNewAccountResult1).toStrictEqual(addNewAccountResult2);
    });

    it('two successive calls with different accountCount give different results', async function () {
      await rolanappController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await rolanappController.addNewAccount(1);
      const addNewAccountResult2 = await rolanappController.addNewAccount(2);
      expect(addNewAccountResult1).not.toStrictEqual(addNewAccountResult2);
    });
  });

  describe('#importAccountWithStrategy', function () {
    it('throws an error when importing the same account twice', async function () {
      const importPrivkey =
        '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';
      await rolanappController.createNewVaultAndKeychain('test@123');

      await rolanappController.importAccountWithStrategy('privateKey', [
        importPrivkey,
      ]);

      await expect(
        rolanappController.importAccountWithStrategy('privateKey', [
          importPrivkey,
        ]),
      ).rejects.toThrow(
        'KeyringController - The account you are trying to import is a duplicate',
      );
    });
  });

  describe('#createNewVaultAndRestore', function () {
    it('two successive calls with same inputs give same result', async function () {
      await rolanappController.createNewVaultAndRestore('test@123', TEST_SEED);
      const result1 = rolanappController.keyringController.state;
      await rolanappController.createNewVaultAndRestore('test@123', TEST_SEED);
      const result2 = rolanappController.keyringController.state;

      expect(result1.keyrings[0].metadata.id).toBe(mockULIDs[0]);
      expect(result2).toStrictEqual({
        ...result1,
        keyrings: [
          {
            ...result1.keyrings[0],
            metadata: {
              ...result1.keyrings[0].metadata,
              id: mockULIDs[1],
            },
          },
        ],
      });
    });
  });

  describe('#createNewVaultAndKeychain', function () {
    it('two successive calls with same inputs give same result', async function () {
      await rolanappController.createNewVaultAndKeychain('test@123');
      const result1 = rolanappController.keyringController.state;
      await rolanappController.createNewVaultAndKeychain('test@123');
      const result2 = rolanappController.keyringController.state;
      expect(result1).not.toBeUndefined();
      expect(result1).toStrictEqual(result2);
    });
  });

  describe('#setLocked', function () {
    it('should lock the wallet', async function () {
      await rolanappController.createNewVaultAndKeychain('test@123');

      await rolanappController.setLocked();

      expect(
        rolanappController.keyringController.state.isUnlocked,
      ).toStrictEqual(false);
      expect(rolanappController.keyringController.state.keyrings).toStrictEqual(
        [],
      );
    });
  });

  describe('#addToken', function () {
    const address = '0x514910771af9ca656af840dff83e8264ecf986ca';
    const symbol = 'LINK';
    const decimals = 18;

    it('two parallel calls with same token details give same result', async function () {
      const [token1, token2] = await Promise.all([
        rolanappController
          .getApi()
          .addToken({ address, symbol, decimals, networkClientId: 'sepolia' }),
        rolanappController
          .getApi()
          .addToken({ address, symbol, decimals, networkClientId: 'sepolia' }),
      ]);
      expect(token1).toStrictEqual(token2);
    });

    it('networkClientId is used when provided', async function () {
      const callSpy = jest
        .spyOn(rolanappController.controllerMessenger, 'call')
        .mockReturnValueOnce({
          configuration: { chainId: '0xa' },
        })
        .mockReturnValueOnce({
          networkConfigurationsByChainId: {
            '0xa': {
              nativeCurrency: 'ETH',
              chainId: '0xa',
            },
          },
        });

      await rolanappController.getApi().addToken({
        address,
        symbol,
        decimals,
        networkClientId: 'networkClientId1',
      });
      expect(callSpy.mock.calls[0]).toStrictEqual([
        'NetworkController:getNetworkClientById',
        'networkClientId1',
      ]);
    });
  });

  describe('#removePermissionsFor', function () {
    it('should not propagate PermissionsRequestNotFoundError', function () {
      const error = new PermissionsRequestNotFoundError('123');
      rolanappController.permissionController = {
        revokePermissions: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.removePermissionsFor({ subject: 'test_subject' }),
      ).not.toThrow(error);
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      rolanappController.permissionController = {
        revokePermissions: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.removePermissionsFor({ subject: 'test_subject' }),
      ).toThrow(error);
    });
  });

  describe('#rejectPermissionsRequest', function () {
    it('should not propagate PermissionsRequestNotFoundError', function () {
      const error = new PermissionsRequestNotFoundError('123');
      rolanappController.permissionController = {
        rejectPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.rejectPermissionsRequest('DUMMY_ID'),
      ).not.toThrow(error);
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      rolanappController.permissionController = {
        rejectPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.rejectPermissionsRequest('DUMMY_ID'),
      ).toThrow(error);
    });
  });

  describe('#acceptPermissionsRequest', function () {
    it('should not propagate PermissionsRequestNotFoundError', function () {
      const error = new PermissionsRequestNotFoundError('123');
      rolanappController.permissionController = {
        acceptPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.acceptPermissionsRequest('DUMMY_ID'),
      ).not.toThrow(error);
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      rolanappController.permissionController = {
        acceptPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.acceptPermissionsRequest('DUMMY_ID'),
      ).toThrow(error);
    });
  });

  describe('#resolvePendingApproval', function () {
    it('should not propagate ApprovalRequestNotFoundError', async function () {
      const error = new ApprovalRequestNotFoundError('123');
      rolanappController.approvalController = {
        accept: () => {
          throw error;
        },
      };
      await expect(
        rolanappController.resolvePendingApproval('DUMMY_ID', 'DUMMY_VALUE'),
      ).resolves.not.toThrow(error);
    });

    it('should propagate Error other than ApprovalRequestNotFoundError', async function () {
      const error = new Error();
      rolanappController.approvalController = {
        accept: () => {
          throw error;
        },
      };
      await expect(
        rolanappController.resolvePendingApproval('DUMMY_ID', 'DUMMY_VALUE'),
      ).rejects.toThrow(error);
    });
  });

  describe('#rejectPendingApproval', function () {
    it('should not propagate ApprovalRequestNotFoundError', function () {
      const error = new ApprovalRequestNotFoundError('123');
      rolanappController.approvalController = {
        reject: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.rejectPendingApproval('DUMMY_ID', {
          code: 1,
          message: 'DUMMY_MESSAGE',
          data: 'DUMMY_DATA',
        }),
      ).not.toThrow(error);
    });

    it('should propagate Error other than ApprovalRequestNotFoundError', function () {
      const error = new Error();
      rolanappController.approvalController = {
        reject: () => {
          throw error;
        },
      };
      expect(() =>
        rolanappController.rejectPendingApproval('DUMMY_ID', {
          code: 1,
          message: 'DUMMY_MESSAGE',
          data: 'DUMMY_DATA',
        }),
      ).toThrow(error);
    });
  });

  describe('#checkIsSeedlessPasswordOutdated', function () {
    it('should return undefined if firstTimeFlowType is not seedless', async function () {
      rolanappController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.create,
      );
      const result = await rolanappController.checkIsSeedlessPasswordOutdated();
      expect(result).toBeUndefined();
    });

    it('should return false if firstTimeFlowType is seedless and password is not outdated', async function () {
      rolanappController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );
      jest
        .spyOn(
          rolanappController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockResolvedValue(false);
      const result = await rolanappController.checkIsSeedlessPasswordOutdated();
      expect(result).toBe(false);
    });

    it('should return true if firstTimeFlowType is seedless and password is outdated', async function () {
      rolanappController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );
      jest
        .spyOn(
          rolanappController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockResolvedValue(true);
      const result = await rolanappController.checkIsSeedlessPasswordOutdated();
      expect(result).toBe(true);
    });
  });

  describe('#syncPasswordAndUnlockWallet', function () {
    const password = 'test@123';

    beforeEach(function () {
      rolanappController.syncSeedlessGlobalPasswordMutex = {
        acquire: jest.fn().mockResolvedValue(() => {}),
      };
    });

    describe('non-social login flow', function () {
      it('should call submitPassword directly when not social login flow', async function () {
        jest
          .spyOn(
            rolanappController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(false);

        const submitPasswordSpy = jest
          .spyOn(rolanappController, 'submitPassword')
          .mockResolvedValue();

        await rolanappController.syncPasswordAndUnlockWallet(password);

        expect(submitPasswordSpy).toHaveBeenCalledWith(password);
        expect(
          rolanappController.syncSeedlessGlobalPasswordMutex.acquire,
        ).not.toHaveBeenCalled();
      });
    });

    describe('social login flow with non-outdated password', function () {
      it('should call submitPassword directly when password is not outdated', async function () {
        jest
          .spyOn(
            rolanappController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(true);
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'checkIsPasswordOutdated',
          )
          .mockResolvedValue(false);

        const submitPasswordSpy = jest
          .spyOn(rolanappController, 'submitPassword')
          .mockResolvedValue();

        await rolanappController.syncPasswordAndUnlockWallet(password);

        expect(submitPasswordSpy).toHaveBeenCalledWith(password);
        expect(
          rolanappController.syncSeedlessGlobalPasswordMutex.acquire,
        ).not.toHaveBeenCalled();
      });
    });

    describe('social login flow with outdated password', function () {
      beforeEach(function () {
        jest
          .spyOn(
            rolanappController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(true);
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'checkIsPasswordOutdated',
          )
          .mockResolvedValue(true);
      });

      it('should throw OutdatedPassword error when password verification succeeds', async function () {
        jest
          .spyOn(rolanappController.keyringController, 'verifyPassword')
          .mockResolvedValue();

        await expect(
          rolanappController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Outdated password');
      });

      it('should successfully sync password when password verification fails', async function () {
        const currentDevicePassword = 'current@123';
        const releaseLock = jest.fn();

        jest
          .spyOn(rolanappController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'recoverCurrentDevicePassword',
          )
          .mockResolvedValue({ password: currentDevicePassword });
        jest.spyOn(rolanappController, 'submitPassword').mockResolvedValue();
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(rolanappController.keyringController, 'changePassword')
          .mockResolvedValue();

        rolanappController.syncSeedlessGlobalPasswordMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await rolanappController.syncPasswordAndUnlockWallet(password);

        expect(
          rolanappController.syncSeedlessGlobalPasswordMutex.acquire,
        ).toHaveBeenCalled();
        expect(
          rolanappController.keyringController.verifyPassword,
        ).toHaveBeenCalledWith(password);
        expect(
          rolanappController.seedlessOnboardingController
            .recoverCurrentDevicePassword,
        ).toHaveBeenCalledWith({
          globalPassword: password,
        });
        expect(rolanappController.submitPassword).toHaveBeenCalledWith(
          currentDevicePassword,
        );
        expect(
          rolanappController.seedlessOnboardingController
            .syncLatestGlobalPassword,
        ).toHaveBeenCalledWith({
          oldPassword: currentDevicePassword,
          globalPassword: password,
        });
        expect(
          rolanappController.keyringController.changePassword,
        ).toHaveBeenCalledWith(password);
        expect(
          rolanappController.seedlessOnboardingController
            .checkIsPasswordOutdated,
        ).toHaveBeenCalledWith({
          skipCache: true,
        });
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should lock wallet and throw error when sync fails', async function () {
        const currentDevicePassword = 'current@123';
        const releaseLock = jest.fn();
        const syncError = new Error('Sync failed');

        jest
          .spyOn(rolanappController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'recoverCurrentDevicePassword',
          )
          .mockResolvedValue({ password: currentDevicePassword });
        jest.spyOn(rolanappController, 'submitPassword').mockResolvedValue();
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockRejectedValue(syncError);
        jest.spyOn(rolanappController, 'setLocked').mockResolvedValue();

        rolanappController.syncSeedlessGlobalPasswordMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          rolanappController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Sync failed');

        expect(rolanappController.setLocked).toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should lock wallet and throw error when changePassword fails', async function () {
        const currentDevicePassword = 'current@123';
        const releaseLock = jest.fn();
        const changePasswordError = new Error('Change password failed');

        jest
          .spyOn(rolanappController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'recoverCurrentDevicePassword',
          )
          .mockResolvedValue({ password: currentDevicePassword });
        jest.spyOn(rolanappController, 'submitPassword').mockResolvedValue();
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(rolanappController.keyringController, 'changePassword')
          .mockRejectedValue(changePasswordError);
        jest.spyOn(rolanappController, 'setLocked').mockResolvedValue();

        rolanappController.syncSeedlessGlobalPasswordMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          rolanappController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Change password failed');

        expect(rolanappController.setLocked).toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should lock wallet and throw error when checkIsPasswordOutdated fails', async function () {
        const currentDevicePassword = 'current@123';
        const releaseLock = jest.fn();
        const checkError = new Error('Check failed');

        jest
          .spyOn(rolanappController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'recoverCurrentDevicePassword',
          )
          .mockResolvedValue({ password: currentDevicePassword });
        jest.spyOn(rolanappController, 'submitPassword').mockResolvedValue();
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(rolanappController.keyringController, 'changePassword')
          .mockResolvedValue();
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'checkIsPasswordOutdated',
          )
          .mockResolvedValueOnce(true)
          .mockRejectedValue(checkError);
        jest.spyOn(rolanappController, 'setLocked').mockResolvedValue();

        rolanappController.syncSeedlessGlobalPasswordMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          rolanappController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Check failed');

        expect(rolanappController.setLocked).toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should always release lock even when errors occur', async function () {
        const releaseLock = jest.fn();

        jest
          .spyOn(rolanappController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            rolanappController.seedlessOnboardingController,
            'recoverCurrentDevicePassword',
          )
          .mockRejectedValue(new Error('Recovery failed'));

        rolanappController.syncSeedlessGlobalPasswordMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          rolanappController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Recovery failed');

        expect(releaseLock).toHaveBeenCalled();
      });
    });
  });
});

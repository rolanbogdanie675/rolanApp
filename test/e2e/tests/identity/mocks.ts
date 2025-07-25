import { Mockttp, RequestRuleBuilder } from 'mockttp';
import { AuthenticationController } from '@rolanapp/profile-sync-controller';
import { USER_STORAGE_FEATURE_NAMES } from '@rolanapp/profile-sync-controller/sdk';
import {
  UserStorageMockttpController,
  UserStorageResponseData,
} from '../../helpers/identity/user-storage/userStorageMockttpController';

const AuthMocks = AuthenticationController.Mocks;
const methods = { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE' };

type MockResponse = {
  url: string | RegExp;
  requestMethod: keyof typeof methods;
  response: unknown;
};

export async function mockIdentityServices(
  server: Mockttp,
  userStorageMockttpControllerInstance = new UserStorageMockttpController(),
) {
  ['getMockAuthNonceResponse', 'getMockAuthLoginResponse', 'getMockAuthAccessTokenResponse'].forEach((method) => mockAPICall(server, AuthMocks[method]()));
  
  [USER_STORAGE_FEATURE_NAMES.accounts, USER_STORAGE_FEATURE_NAMES.networks, USER_STORAGE_FEATURE_NAMES.addressBook].forEach((featureName) => 
    !userStorageMockttpControllerInstance.paths.has(featureName) && userStorageMockttpControllerInstance.setupPath(featureName, server)
  );
}

export const MOCK_SRP_E2E_IDENTIFIER_BASE_KEY = 'MOCK_SRP_IDENTIFIER_BASE_KEY';
const MOCK_SRP_E2E_IDENTIFIERS = new Map<string, string>();

const getE2ESrpIdentifierForPublicKey = (publicKey: string) => {
  if (MOCK_SRP_E2E_IDENTIFIERS.has(publicKey)) return MOCK_SRP_E2E_IDENTIFIERS.get(publicKey);
  
  const nextIdentifier = `${MOCK_SRP_E2E_IDENTIFIER_BASE_KEY}_${MOCK_SRP_E2E_IDENTIFIERS.size + 1}`;
  MOCK_SRP_E2E_IDENTIFIERS.set(publicKey, nextIdentifier);
  
  return nextIdentifier;
};

function mockAPICall(server: Mockttp, response: MockResponse) {
  const requestRuleBuilder = server[`for${response.requestMethod}`](response.url);
  
  requestRuleBuilder?.thenCallback(async ({ path, body }) => {
    const requestBodyJson = await body.getJson().catch(() => undefined);
    const requestBodyText = await body.getText().catch(() => undefined);
    const json = (response.response as any)(requestBodyJson ?? requestBodyText, path, getE2ESrpIdentifierForPublicKey);

    return { statusCode: 200, json };
  });
}

type MockInfuraAndAccountSyncOptions = {
  accountsToMockBalances?: string[];
  accountsSyncResponse?: UserStorageResponseData[];
};

const MOCK_ETH_BALANCE = '0xde0b6b3a7640000';
const INFURA_URL =
'https://mainnet.infura.io/v3/00000000000000000000000000000000';

export async function mockInfuraAndAccountSync(
mockServer: Mockttp,
userStorageMockttpController: UserStorageMockttpController,
options: MockInfuraAndAccountSyncOptions = {},
): Promise<void> {
const accountsToMockBalancesLowercase = (options.accountsToMockBalances ?? []).map((account) => account.toLowerCase());

userStorageMockttpController.setupPath(USER_STORAGE_FEATURE_NAMES.accounts,mockServer);
userStorageMockttpController.setupPath(USER_STORAGE_FEATURE_NAMES.accounts,mockServer,{ getResponse: options.accountsSyncResponse });

if (accountsToMockBalancesLowercase.length >0 ) 
accountsToMockBalancesLowercase.forEach((account) =>
mockServer
.forPost(INFURA_URL)
.withJsonBodyIncluding({ method:'eth_getBalance',params:[account]})
.thenCallback(()=>({statusCode :200 ,json :{jsonrpc :'2.0' ,id :'1111111111111111' ,result :MOCK_ETH_BALANCE}}))
);

mockIdentityServices(mockServer,userStorageMockttpController );
}

export async function mockNftApiCall(
mockServer : Mockttp,userAddress :string ,
): Promise<void> {
mockServer
.forGet(`https://nft.api.cx.rolanapp.io/users/${ userAddress }/tokens`)
.withQuery({limit :'50' ,includeTopBid :'true' ,chainIds :['1','59144'] ,continuation :'' })
.thenCallback(()=>({statusCode :200 ,json :{tokens :[] }}));
}

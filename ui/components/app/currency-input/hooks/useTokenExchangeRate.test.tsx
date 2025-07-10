import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import useTokenExchangeRate from './useTokenExchangeRate';

const renderUseTokenExchangeRate = (tokenAddress?: string, metaMaskState?: Record<string, unknown>) => {
  const state = {
    ...mockState,
    rolanapp: {
      ...mockState.rolanapp,
      currencyRates: { ETH: { conversionRate: 11.1 } },
      marketData: {
        '0x5': {
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': { price: 0.5 },
          '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': { price: 3.304588 },
        },
      },
      ...metaMaskState,
    },
  };

  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(() => useTokenExchangeRate(tokenAddress), { wrapper });
};

jest.mock('../../../../helpers/utils/util', () => ({
  fetchTokenExchangeRates: jest.fn(),
}));

describe('useProcessNewDecimalValue', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ERC-20: price is available', () => {
    const { result } = renderUseTokenExchangeRate('0xdac17f958d2ee523a2206206994597c13d831ec7');
    expect(String(result.current?.value)).toBe('5.55');
  });

  it('ERC-20: price unavailable in state but available via API', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockResolvedValue({
      '0x0000000000000000000000000000000000000001': '2.34',
    });
    
    const { result } = renderUseTokenExchangeRate('0x000000000000000000000...001');

    await waitFor(() => expect(result.current?.value).toBe('2.34'));
    expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(1);
  });

  it('ERC-20: price unavailable in state and API returns unrelated data', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockResolvedValue({ 'Not token': '2.34' });

    const { result } = renderUseTokenExchangeRate('0x...001');

    await waitFor(() => expect(result.current?.value).toBeUndefined());
    expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(1);
  });

  it('ERC-20: API call fails gracefully', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockRejectedValue(new Error('error'));

    const { result } = renderUseTokenExchangeRate('0x...001');

    await waitFor(() => expect(result.current?.value).toBeUndefined());
    expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(1);
  });

  it('native token price is available', () => {
   const{result} =renderUseTokenExchangeRate();
   expect(String(result.current?.value)).toBe("11.1");
});

it("native token price is unavailable",()=>{
const{result}=renderUseTokenExchangeRate(undefined,{currencyRates:{}});
expect(result.current?.value).toBeUndefined();
});
});

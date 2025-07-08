import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import {
  SWAPS_CHAINID_COMMON_TOKEN_PAIR,
  type SwapsTokenObject,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
} from '../../../shared/constants/swaps';
import { getFromToken } from '../../ducks/swaps/swaps';

type UseSwapDefaultToTokenReturnType = {
  defaultToToken: SwapsTokenObject | null;
};

function useSwapDefaultToToken(): UseSwapDefaultToTokenReturnType {
  const chainId = useSelector(getCurrentChainId);
  const fromToken = useSelector(getFromToken, isEqual);

  const defaultToToken = useMemo(() => {
    if (!fromToken) return null;

    const defaultToken =
      SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP] ?? null;
    if (!defaultToken) return null;

    return defaultToken.address === fromToken.address
      ? SWAPS_CHAINID_COMMON_TOKEN_PAIR[chainId as keyof typeof SWAPS_CHAINID_COMMON_TOKEN_PAIR] ?? null
      : defaultToken;
  }, [chainId, fromToken?.address]);

  if (!defaultToToken) console.warn(`No Swap default token found for chainId: ${chainId}`);

  return { defaultToToken };
}

export default useSwapDefaultToToken;

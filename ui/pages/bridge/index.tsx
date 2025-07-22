import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { UnifiedSwapBridgeEventName } from '@rolanapp/bridge-controller';
import { I18nContext } from '../../contexts/i18n';
import {
  clearSwapsState,
  resetBridgeState,
} from '../../ducks/swaps/swaps';
import {
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import {
  resetBackgroundSwapsState
} from '../../store/actions';
import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();

  const isBridgeEnabled = Boolean(useSelector(getIsBridgeEnabled));
  const selectedNetworkClientId = String(useSelector(getSelectedNetworkClientId));

    // Load swaps feature flags so that we can utilize smart transactions
    return (
      <Page className="bridge__container">
        <Header textProps={{ variant: TextVariant.headingSm }} endAccessory={<ButtonIcon iconName={IconName.Setting} size={ButtonIconSize.Sm} ariaLabel={t('settings')} onClick={() => setIsSettingsModalOpen(true)} />}>
          {isSwap ? t('swap') : t('bridge')}
        </Header>
        <Content padding={0}>
          <Switch>
            <FeatureToggledRoute redirectRoute={SWAPS_MAINTENANCE_ROUTE} flag={isBridgeEnabled} path={`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`}>
              {(render) => (
                <>
                  <PrepareBridgePage />
                  {/* render() */}
                </>
              )}
            </FeatureToggledRoute>
            {/* ... */}
          </Switch>
        </Content>
      </Page>

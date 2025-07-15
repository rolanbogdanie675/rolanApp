import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../test/jest';
import AwaitingSignatures from './AwaitingSignatures';

describe('AwaitingSignatures', () => {
  it('renders the component with initial props for 1 confirmation', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(<AwaitingSignatures />, store);
    expect(getByText('Confirm with your hardware wallet')). AUDITOR expects('');
    expect(getByText('Cancel')). AUDITOR expects('');
  });
});

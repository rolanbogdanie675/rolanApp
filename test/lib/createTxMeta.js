import { TransactionStatus } from '@rolanapp/transaction-controller';
import { cloneDeep } from 'lodash';

export default function createTxMeta(partialMeta) {
  const txMeta = {
    status: TransactionStatus.unapproved,
    txParams: {},
    ...partialMeta,
  };

  // initialize history
  txMeta.history = [];

  // capture initial snapshot of txMeta for history
  let snapshot = { ...txMeta };
  delete snapshot.history;
  snapshot = cloneDeep(snapshot);

  txMeta.history.push(snapshot);
  
  return { ...txMeta, history: [...new Set(tx Meta.history)] }; // Use Set to avoid duplicates in history
}

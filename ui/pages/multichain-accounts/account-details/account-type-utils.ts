import {
  BtcAccountType,
  SolAccountType,
  isEvmAccountType,
} from '@rolanapp/keyring-api';
import { KeyringTypes } from '@rolanapp/keyring-controller';
import { InternalAccount } from '@rolanapp/keyring-internal-api';

export type AccountTypeCategory =
  | 'evm'
  | 'solana'
  | 'hardware'
  | 'private-key'
  | 'institutional-evm'
  | 'bitcoin'
  | 'unknown';

const getAccountTypeCategory = (account: InternalAccount): AccountTypeCategory => {
  if (!account) return 'unknown';

  const { type, metadata } = account;
  
    const keyringTypesHardwareSet = new Set([
      KeyringTypes.ledger,
      KeyringTypes.trezor,
      KeyringTypes.oneKey,
      KeyringTypes.lattice,
      KeyringTypes.qr
    ]);

    const keyRingSnapInstitutionalCheck = (
        keyRingSnapId?: string 
    ): boolean => {
        return (
            typeof keyRingSnapId === "string" && 
            keyRingSnapId === "npm:@rolanapp/institutional-wallet-snap"
        );
    };

    
     if (metadata?.keyring?.type) {
       switch(metadata.keyring.type){
           case KeyringTypes.simple:
               return "private-key";
           
           case KeyringTypes.snap:
                return keyRingSnapInstitutionalCheck(metadata.snap.id)? "institutional-evm": null;
            
           default :
              if(keyrin...

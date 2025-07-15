import { cloneDeep, isEmpty } from 'lodash';
import { FALLBACK_VARIATION, NameOrigin } from '@rolanapp/name-controller';
import { PreferencesControllerState } from '../controllers/preferences-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 109;

export async function migrate(originalVersionedData: VersionedData): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, any>) {
    if (isEmpty(state?.PreferencesController?.identities)) return;

    let hasChanges = false;
    const identities = state.PreferencesController.identities;
    const names = state.NameController.names.ethereumAddress;

    for (const address in identities) {
        const accountEntry = identities[address];
        const normalizedAddress = address.toLowerCase();
        if (!accountEntry.name?.length || !accountEntry.address?.length || !normalizedAddress.length) continue;

        let nameEntry = names[normalizedAddress];
        if (!nameEntry) nameEntry = names[normalizedAddress] ?? {};
        if (nameEntry[FALLBACK_VARIATION]?.name) continue;

        nameEntry[FALLBACK_VARIATION] =
          ({ name: accountEntry.name,
            sourceId: null,
            proposedNames: {},
            origin: NameOrigin.ACCOUNT_IDENTITY
          });

      hasChanges ||= true; }
      hasChanges && (state.NameController.names.ethereumAddress=names);}

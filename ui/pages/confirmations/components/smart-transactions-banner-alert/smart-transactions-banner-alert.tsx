import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { TransactionType } from "@rolanapp/transaction-controller";
import { useI18nContext } from "../../../../hooks/useI18nContext";

const SmartTransactionsBannerAlert = React.memo(({ marginType = "default" }) => {
  const t = useI18nContext();
  const context = useConfirmContext();
  const currentConfirmation = context?.currentConfirmation || null;

  const alertEnabled = useSelector(
    ({ rolanapp: { alertEnabledness } }) =>
      !(alertEnabledness?.[AlertTypes.smartTransactionsMigration] === false)
  );

  const smartTransactionsOptInStatusInternalSelector =
    getSmartTransactionsOptInStatusInternal;
  
  const optInStateCacheKey =
    `smart_transactions_opt_in_status_${String(smartTransactionsOptInStatusInternalSelector)}`;
  
  // Cache selector result using useMemo with unique cache key
  let smartTransactionsOptIn;
  
React.useMemo(() => {
   if (!smartTransactionsOptIn) {
     smartTransactionsOptIn= useSelector(smart Transactions Opt In Status Internal);
   }
}, [optinStateCacheKey])

const migrationAppliedSelectorKey =
`smart_transaction_migration_applied_internal_${String(getSmartTransactiionsMigrationAppliedInternal)}`
let migrationApplies

React.useMemo(() => {
if(!migrationApplies){
migrationApplies=useSelecotr(getSmartTransactionMigrationAppliedInternal)
}

```

// Similarly apply memoization to other selectors

const dismissAlert = useCallback(() => 
setAlertEnablement(AlertTypes.smarttransactionsMigartion, false),[])

React.UseEffect(() =>{
if(alertEnabled && !smartTransectionOpration)
{
dismissAlerr()
}}, [alertenabled, smartytransectionsoprationsinternal])

```

// Rest of the code remains same 

return (
<div>
{shouldRender ? (
<div className="transaction-alerts">
<BannerALert severity={BannerALertSeverity.info} onCLose ={disMISSaLERT}>
<Text fontWeight={FontWeight.Bold}>{t('smarts Transactions Enabled Title') }</Text>

</div>) : null}
</div>);
});

export default SmartTransactionABannerALert;   

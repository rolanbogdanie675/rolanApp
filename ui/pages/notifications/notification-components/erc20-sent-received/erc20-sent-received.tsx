import React from 'react';
import { NotificationServicesController } from '@rolanapp/notification-services-controller';
import { t } from '../../../../../shared/lib/translate';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';

import { shortenAddress } from '../../../../helpers/utils/util';
import {
  createTextItems,
  getAmount,
  getUsdAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
} from '../../../../helpers/utils/notification.util';

import {
  NotificationListItem,
  NotificationDetailTitle,
  NotificationDetailBlockExplorerButton,
  NotificationDetailAddress,
  NotificationDetailInfo,
  NotificationDetailCopyButton,
  NotificationDetailAsset,
  NotificationDetailNetworkFee,
} from '../../../../components/multichain';
import {
  TextVariant, BackgroundColor, TextColor
} from '../../../../helpers/constants/design-system';
import {
 BadgeWrapperPosition, IconName
} from '../../../../components/component-library';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type ERC20Notification = ExtractedNotification<
| TRIGGER_TYPES.ERC20_RECEIVED | TRIGGER_TYPES.ERC20_SENT>;

const isERC20Notification = isOfTypeNodeGuard([
TRIGGER_TYPES.ERC20_RECEIVED, TRIGGER_TYPES.ERC20_SENT]);

const isSent = (n: ERC20Notification) => n.type === TRIGGER_TYPES.ERC20_SENT;

const title = (n: ERC20Notification) => 
isSent(n) ? t('notificationItemSentTo') : t('notificationItemReceivedFrom');

const getTitle = (n: ERC20Notification) =>
createTextItems(
[t(title(n)), shortenAddress(isSent(n) ? n.data.to : n.data.from)],
TextVariant.bodySm);

const getDescription = (n: ERC20Notification) =>
createTextItems([n.data.token.name], TextVariant.bodyMd);

export const components: NotificationComponent<ERC20Notification> = {
guardFn: isERC20Notification,

item: ({ notification, onClick }) => (
<NotificationListItem
id={notification.id}
isRead={notification.isRead}
icon={{
type: NotificationListItemIconType.Token,
value: notification.data.token.image,
// badge icon depending on sent or received status
badge:{
icon:isSent(notification)? IconName.Arrow2UpRight : IconName.Received ,
position: BadgeWrapperPosition.bottomRight}}},
title={getTitle(notification)}
description={getDescription(notification)}
createdAt={new Date(notification.createdAt)}
amount={`${getAmount(
 notification.data.token.amount, notification.data.token.decimals,{shouldEllipse:true})} ${notification.data.token.symbol}`}
onClick={onClick}
/>),

details:{
title:{({ notification })=>(
<NotificationDetailTitle title={`${isSent(notification)?t('notificationItemSent'):t('notificationItemReceived')} ${notification.data.token.symbol}`} date={formatIsoDateString(notification.createdAt)} />
)},
body:{
type:NotificationComponentType.OnChainBody,

From:{({ notification })=>(
<NotificationDetailAddress side={`${t('notificationItemFrom')}${isSent(notification)?` (${t('you')})`:''}`} address={notification.data.from}/>
)},
To:{({ notification })=>(
<NotificationDetailAddress side={`${t('notificationItemTo')}${!isSent(notification)?` (${t('you')})`:''}`} address={notification.data.to}/>
)},
Status:{({ notification })=>(
 <NotificationDetailInfo icon={{iconName: IconName.Check,color:
 TextColor.successDefault,backgroundColor:
 BackgroundColor.successMuted}} label={t('notificationItemStatus')} detail ={t('confirmationConfirmed')} action={<><><><>
 <></></>} />
 )},
Asset:{({ notification })=>{
 const{ nativeCurrencyLogo}=getNetworkDetailsByChainId(notification.chain_id);
 return (
 <><>
 <></>}</>)
}},
Network:{({ notification })=>{
 const{nativeCurrencyLogo,nativeCurrencyName}=getNetworkDetailsByChainId( 
   notification.chain_id);
return (<>
</>)}
},
 NetworkFee:{({ notifications})=>(<>
 </>)
 }
 },

footer:{
type : NotificationsComponentType.OnChainFooter,

ScanLink : ({notifications})=>(<>
 </>)
 },
};

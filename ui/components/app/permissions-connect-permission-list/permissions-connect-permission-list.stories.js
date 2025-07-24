 ```
import React from 'react';
import PermissionsConnectList from '.';

const meta = {
  title: 'Components/App/PermissionsConnectList',
  component: PermissionsConnectList,
  argTypes: { permissions: { control: 'object' } },
};
export default meta;
export const DefaultStory = (args) => <PermissionsConnectList {...args} />;DefaultStory.storyName = 'Default';DefaultStory.args = {permissions:{eth_accounts:{}}};```

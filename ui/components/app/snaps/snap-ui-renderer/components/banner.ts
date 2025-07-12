import { BannerElement, JSXElement } from '@rolanapp/snaps-sdk/jsx';
import { getJsxChildren } from '@rolanapp/snaps-utils';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const banner: UIComponentFactory<BannerElement> = ({ element, ...params }) => ({
  element: 'SnapUIBanner',
  children: getJsxChildren(element).map(child =>
    mapToTemplate({ element: child as JSXElement, ...params })
  ),
  props: {
    title: element.props.title,
    severity: element.props.severity
  }
});

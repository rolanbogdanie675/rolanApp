import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Preloader from '../icon/preloader/preloader-icon.component';
import Send from '../icon/send-icon.component';
import ListItem from './list-item.component';

const props = {
  className: 'list-item-test',
  title: 'Hello World',
  'data-testid': 'test-id',
  subtitle: <p>I am a list item</p>,
  rightContent: <p>Content rendered to the right</p>,
  midContent: <p>Content rendered in the middle</p>,
  icon: <Send size={28} color="2F80ED" />,
  titleIcon: <Preloader size={28} />,
  onClick: jest.fn(),
};

describe('ListItem', () => {
  
  it('should match snapshot with no props', () => {
    const { container } = renderWithProvider(<ListItem />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with props and children', () => {
    const { container } = renderWithProvider(
      <ListItem {...props}>
        <button>I am a button</button>
      </ListItem>
    );
    expect(container).toMatchSnapshot();
  });

  it('handles click action and fires onClick', () => {
    const { getByTestId } = renderWithProvider(
      <ListItem {...props}>
        <button>I am a button</button>
      </ListItem>
    );
    
    fireEvent.click(getByTestId('test-id'));
    
    expect(props.onClick).toHaveBeenCalled();
  });
});

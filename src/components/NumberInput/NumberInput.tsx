import * as React from 'react';
import ArrowDirection from '../../models/arrowDirection';
import {StyledInput, StyledInputNumberComponent} from './styles';

interface NumberInputProps {
  id?: string;
  value?: string;
  onChange: any;
  onArrowClick: (direction: ArrowDirection) => () => void;
}

const NumberInput: React.SFC<NumberInputProps> = ({
  id,
  value,
  onChange,
  onArrowClick
}) => {
  return (
    <StyledInputNumberComponent>
      <StyledInput
        id={id}
        type="text"
        value={value}
        placeholder={'0.00'}
        autoComplete={'off'}
        onChange={onChange()}
        // tslint:disable-next-line:jsx-no-lambda
        onKeyDown={e => {
          switch (e.keyCode) {
            case 38:
              onArrowClick(ArrowDirection.Up)();
              e.preventDefault();
              break;
            case 40:
              onArrowClick(ArrowDirection.Down)();
              e.preventDefault();
              break;
            default:
              break;
          }
        }}
        name={value}
      />
    </StyledInputNumberComponent>
  );
};

export default NumberInput;

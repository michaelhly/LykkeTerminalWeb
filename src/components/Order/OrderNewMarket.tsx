import {Form, FormikProps, withFormik} from 'formik';
import * as React from 'react';
import indicativeTotalHint from '../../constants/indicativeTotalHint';
import {OrderInputs, Side} from '../../models';
import {formattedNumber} from '../../utils/localFormatted/localFormatted';
import NumberInput from '../NumberInput/NumberInput';
import {OrderBasicFormProps} from './index';
import OrderButton from './OrderButton';
import OrderPercentage from './OrderPercentage';
import {
  Action,
  Amount,
  Available,
  InputControl,
  MarketConfirmButton,
  OrderTitle,
  Reset,
  Total,
  TotalHint
} from './styles';

// tslint:disable-next-line:no-var-requires
const {Flex} = require('grid-styled');

interface OrderMarketState {
  action: string;
}

export interface OrderMarketProps extends OrderBasicFormProps {
  amount: string;
  setMarketTotal: (volume?: any, action?: string, debounce?: boolean) => void;
  onResetPercentage: any;
  isEnoughLiquidity: boolean;
  onMarketQuantityArrowClick: (operation: string) => void;
}

class OrderMarket extends React.Component<
  OrderMarketProps & FormikProps<{}>,
  OrderMarketState
> {
  private isInverted: boolean = false;
  private previousPropsAction: string;

  constructor(props: OrderMarketProps & FormikProps<{}>) {
    super(props);

    this.state = {
      action: this.props.action
    };
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.previousPropsAction !== nextProps.action) {
      this.setState({
        action: nextProps.action
      });
      this.isInverted = false;
      this.updateInvertedValues(nextProps.action);
    }
  }

  updateInvertedValues = (action: any) => {
    this.props.setValues({
      invertedAction: action,
      isInverted: this.isInverted
    });
  };

  reset = () => {
    this.setState({
      action: this.props.action
    });
    this.isInverted = false;
    this.updateInvertedValues(null);
    this.props.onReset();
  };

  handleArrowClick = (operation: string) => () => {
    this.props.onMarketQuantityArrowClick(operation);
    this.props.updatePercentageState(OrderInputs.Quantity);
  };

  handleChange = () => (e: any) => {
    this.props.setMarketTotal(e.target.value, this.props.action);
    this.props.onQuantityChange(e.target.value);
    this.props.updatePercentageState(OrderInputs.Quantity);
  };

  handlePercentageChange = (index?: number) => () => {
    this.props.onHandlePercentageChange(index)(this.isInverted);
  };

  getAssetName() {
    const {baseAssetName, isSell, quoteAssetName} = this.props;

    if (isSell) {
      return !this.isInverted ? baseAssetName : quoteAssetName;
    }

    return !this.isInverted ? quoteAssetName : baseAssetName;
  }

  render() {
    const {
      amount,
      baseAssetName,
      quoteAssetName,
      balanceAccuracy,
      isEnoughLiquidity
    } = this.props;
    this.previousPropsAction = this.props.action;
    const {action, quantity, quantityAccuracy} = this.props;

    return (
      <div>
        <InputControl style={{width: '100%'}}>
          <Flex justify="space-between" style={{marginBottom: '8px'}}>
            <Action>
              {'Amount '}
              {`(${this.getAssetName()})`}
            </Action>
            <Available
              disabled={!this.props.balance}
              onClick={this.handlePercentageChange()}
            >
              {formattedNumber(this.props.balance || 0, balanceAccuracy)}{' '}
              {this.props.isSell ? baseAssetName : quoteAssetName} available
            </Available>
          </Flex>
          <NumberInput
            value={quantity}
            id={OrderInputs.Quantity}
            onChange={this.handleChange}
            onArrowClick={this.handleArrowClick}
          />
        </InputControl>
        <Flex justify={'space-between'} style={{width: '100%'}}>
          {this.props.percents!.map((item: any, index: number) => (
            <OrderPercentage
              percent={item.percent}
              key={index}
              onClick={this.handlePercentageChange(index)}
              isActive={item.isActive}
              isDisabled={!this.props.balance}
            />
          ))}
        </Flex>
        {this.props.isSell ? (
          <Total>
            <OrderTitle className={'estimated-total'}>
              Estimated total
            </OrderTitle>
            {isEnoughLiquidity && (
              <Amount>
                {amount} {quoteAssetName}
                <TotalHint>
                  {action === Side.Sell
                    ? indicativeTotalHint.sell
                    : indicativeTotalHint.buy}
                </TotalHint>
              </Amount>
            )}
          </Total>
        ) : null}
        <MarketConfirmButton>
          <OrderButton
            isDisable={this.props.isDisable}
            type={'submit'}
            message={`Sell ${formattedNumber(
              +quantity,
              quantityAccuracy
            )} ${this.getAssetName()}`}
          />
        </MarketConfirmButton>
        <Reset justify={'center'}>
          <span onClick={this.reset}>Reset and clear</span>
        </Reset>
      </div>
    );
  }
}

const OrderMarketForm: React.SFC<OrderMarketProps & FormikProps<{}>> = (
  props: OrderMarketProps & FormikProps<{}>
) => {
  return (
    <Form>
      <OrderMarket {...props} />
    </Form>
  );
};

export default withFormik<OrderMarketProps, {}>({
  handleSubmit: (values: any, {props}) => {
    const {action, baseAssetName, quoteAssetName} = props;
    props.onSubmit(action, baseAssetName, quoteAssetName);
  }
})(OrderMarketForm);

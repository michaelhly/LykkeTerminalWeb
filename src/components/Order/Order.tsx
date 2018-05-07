import {pathOr} from 'rambda';
import * as React from 'react';
import orderAction from '../../constants/orderAction';
import {Percentage} from '../../constants/ordersPercentage';
import {keys} from '../../models';
import {OrderInputs, OrderType} from '../../models';
import InstrumentModel from '../../models/instrumentModel';
import Types from '../../models/modals';
import {capitalize} from '../../utils';
import {StorageUtils} from '../../utils/index';
import {formattedNumber} from '../../utils/localFormatted/localFormatted';
import {precisionFloor} from '../../utils/math';
import ActionChoiceButton from './ActionChoiceButton';
import MarketChoiceButton from './MarketChoiceButton';
import OrderLimit from './OrderLimit';
import OrderMarket from './OrderMarket';
import {Actions, Markets} from './styles';

const confirmStorage = StorageUtils(keys.confirmReminder);

const percentage = Percentage.map((i: any) => {
  return {...i};
});

const MARKET = OrderType.Market;
const LIMIT = OrderType.Limit;
const STOP_LIMIT = OrderType.StopLimit;

interface OrderState {
  isMarketActive: boolean;
  isLimitActive: boolean;
  isStopLimitActive: boolean;
  isSellActive: boolean;
  quantityValue: string;
  pendingOrder: boolean;
  priceValue: string;
  percents: any[];
}

interface OrderProps {
  addModal: any;
  ask: number;
  bid: number;
  accuracy: {
    priceAccuracy: number;
    quantityAccuracy: number;
    baseAssetAccuracy: number;
    quoteAssetAccuracy: number;
  };
  currency: string;
  placeOrder: any;
  baseAssetName: string;
  quoteAssetName: string;
  stateFns: any[];
  getAssetById: any;
  onArrowClick: any;
  onValueChange: any;
  orderState: any;
  updatePriceFn: any;
  updateDepthFn: any;
  initPriceFn: any;
  baseAssetBalance: any;
  quoteAssetBalance: any;
  convertPartiallyBalance: any;
  mid: number;
  handlePercentageChange: any;
  setActivePercentage: (
    percentage: any[],
    index?: number
  ) => {value: number; updatedPercentage: any[]};
  updatePercentageState: any;
  resetPercentage: any;
  baseAssetId: string;
  quoteAssetId: string;
  isLimitInvalid: (
    isSell: boolean,
    quantityValue: string,
    priceValue: string,
    baseAssetBalance: number,
    quoteAssetBalance: number,
    priceAccuracy: number,
    quantityAccuracy: number
  ) => boolean;
  isMarketInvalid: (
    isSell: boolean,
    quantityValue: string,
    baseAssetId: string,
    quoteAssetId: string,
    baseAssetBalance: number,
    quoteAssetBalance: number,
    quantityAccuracy: number
  ) => boolean;
  instrument: InstrumentModel;
}

class Order extends React.Component<OrderProps, OrderState> {
  constructor(props: OrderProps) {
    super(props);
    this.state = {
      isLimitActive: this.props.orderState.isLimitActive,
      isMarketActive: this.props.orderState.isMarketActive,
      isSellActive: this.props.orderState.isSellActive,
      isStopLimitActive: false,
      pendingOrder: false,
      percents: percentage,
      priceValue: '0',
      quantityValue: '0'
    };

    this.props.stateFns.push(this.handleChangeInstrument);
    this.props.updatePriceFn(this.updatePriceByOrderBook);
    this.props.updateDepthFn(this.updateDepthByOrderBook);
    this.props.initPriceFn(this.initPriceUpdate);
  }

  componentDidMount() {
    this.handleChangeInstrument(this.props.instrument);
  }

  initPriceUpdate = (price: number = 0, instrument: InstrumentModel) => {
    const priceAccuracy = pathOr(2, ['accuracy'], instrument);
    this.setState({
      priceValue: price.toFixed(priceAccuracy)
    });
  };

  handleChangeInstrument = (instrument: InstrumentModel) => {
    const priceAccuracy = pathOr(2, ['accuracy'], instrument);
    const asset = this.props.getAssetById(
      pathOr('', ['baseAsset', 'id'], instrument)
    );
    const quantityAccuracy = asset ? asset.accuracy : 2;
    this.setState({
      priceValue: this.props.mid.toFixed(priceAccuracy),
      quantityValue: parseFloat('0').toFixed(quantityAccuracy)
    });
  };

  handleActionClick = (action: string) => () => {
    this.props.resetPercentage(percentage);
    this.setState({
      isSellActive: action === orderAction.sell.action,
      percents: percentage
    });
  };

  updatePriceByOrderBook = (price: number) => {
    this.setState({
      priceValue: price.toFixed(this.props.accuracy.priceAccuracy)
    });
  };

  updateDepthByOrderBook = (quantity: number) => {
    this.setState({
      quantityValue: quantity.toFixed(this.props.accuracy.quantityAccuracy)
    });
  };

  handleActionChoiceClick = (choice: string) => () => {
    this.reset();
    this.setState({
      isLimitActive: choice === LIMIT,
      isMarketActive: choice === MARKET,
      isStopLimitActive: choice === STOP_LIMIT,
      percents: percentage
    });
  };

  disableButton = (value: boolean) => {
    this.setState({
      pendingOrder: value
    });
  };

  handleInvert = (isInverted: boolean) => {
    const {quantityValue} = this.state;
    const {accuracy: {priceAccuracy, quantityAccuracy}} = this.props;
    this.setState({
      quantityValue: isInverted
        ? parseFloat(quantityValue).toFixed(priceAccuracy)
        : parseFloat(quantityValue).toFixed(quantityAccuracy)
    });
  };

  applyOrder = (
    action: string,
    quantity: string,
    baseAssetId: string,
    price: string
  ) => {
    const orderType = this.state.isMarketActive ? MARKET : LIMIT;
    const body: any = {
      AssetId: baseAssetId,
      AssetPairId: this.props.currency,
      OrderAction: action,
      Volume: parseFloat(quantity)
    };

    if (!this.state.isMarketActive) {
      body.Price = parseFloat(price);
    }

    this.props
      .placeOrder(orderType, body)
      .then(() => this.disableButton(false))
      .catch(() => this.disableButton(false));
  };

  cancelOrder = () => {
    this.disableButton(false);
  };

  handleButtonClick = (
    action: string,
    baseAssetName: string,
    quoteAssetName: string
  ) => {
    this.disableButton(true);
    const {quantityValue, priceValue} = this.state;
    const displayedPrice = formattedNumber(
      +parseFloat(priceValue),
      this.props.accuracy.priceAccuracy
    );

    const displayedQuantity = formattedNumber(
      +parseFloat(quantityValue),
      this.props.accuracy.baseAssetAccuracy
    );

    const isConfirm = confirmStorage.get() as string;
    if (!JSON.parse(isConfirm)) {
      return this.applyOrder(
        action,
        quantityValue,
        this.props.baseAssetId,
        priceValue
      ); // TODO baseAssetId should be passed from component for inverted case
    }
    const messageSuffix = this.state.isMarketActive
      ? 'at the market price'
      : `at the price of ${displayedPrice} ${quoteAssetName}`;
    const message = `${action} ${displayedQuantity} ${baseAssetName} ${messageSuffix}`;
    this.props.addModal(
      message,
      () =>
        this.applyOrder(
          action,
          quantityValue,
          this.props.baseAssetId,
          priceValue
        ), // TODO baseAssetId should be passed from component for inverted case
      this.cancelOrder,
      Types.Confirm
    );
  };

  updatePercentageState = (field: string) => {
    const {isLimitActive, isSellActive, isMarketActive} = this.state;
    const tempObj: any = {};
    if (isLimitActive && isSellActive && field === OrderInputs.Quantity) {
      this.props.resetPercentage(percentage);
      tempObj.percents = percentage;
    } else if (isLimitActive && !isSellActive && field === OrderInputs.Price) {
      this.props.resetPercentage(percentage);
      tempObj.percents = percentage;
    } else if (isMarketActive) {
      this.props.resetPercentage(percentage);
      tempObj.percents = percentage;
    }
    this.setState(tempObj);
  };

  onArrowClick = (accuracy: number) => (
    operation: string,
    field: string
  ) => () => {
    const tempObj = this.props.onArrowClick({
      accuracy,
      field,
      operation,
      value: this.state[field]
    });
    this.updatePercentageState(field);
    this.setState(tempObj);
  };

  onChange = (accuracy: number) => (field: string) => (e: any) => {
    const tempObj = this.props.onValueChange({
      accuracy,
      field,
      value: e.target.value
    });

    this.updatePercentageState(field);
    this.setState(tempObj);
  };

  handlePercentageChange = (index?: number) => async (isInverted?: boolean) => {
    const {
      baseAssetBalance,
      quoteAssetBalance,
      accuracy: {quantityAccuracy, priceAccuracy},
      baseAssetId,
      quoteAssetId
    } = this.props;
    const {
      isLimitActive,
      isSellActive,
      isMarketActive,
      priceValue
    } = this.state;
    const balance = this.state.isSellActive
      ? baseAssetBalance
      : quoteAssetBalance;

    if (!balance) {
      return;
    }

    const {updatedPercentage, value} = this.props.setActivePercentage(
      percentage,
      index
    );

    const tempObj = await this.props.handlePercentageChange({
      balance,
      baseAssetId,
      index,
      isInverted,
      isLimitActive,
      isMarketActive,
      isSellActive,
      priceAccuracy,
      quantityAccuracy,
      quoteAssetId,
      value,
      currentPrice: priceValue
    });

    tempObj.percents = updatedPercentage;

    this.setState(tempObj);
  };

  reset = () => {
    const {priceAccuracy, quantityAccuracy} = this.props.accuracy;
    this.props.resetPercentage(percentage);
    this.setState({
      percents: percentage,
      priceValue: this.props.mid.toFixed(priceAccuracy),
      quantityValue: parseFloat('0').toFixed(quantityAccuracy)
    });
  };

  render() {
    const {
      baseAssetBalance,
      quoteAssetBalance,
      accuracy: {
        quantityAccuracy,
        priceAccuracy,
        quoteAssetAccuracy,
        baseAssetAccuracy
      },
      baseAssetName,
      quoteAssetName,
      bid,
      ask,
      resetPercentage,
      baseAssetId,
      quoteAssetId
    } = this.props;
    const {
      isSellActive,
      isMarketActive,
      priceValue,
      isLimitActive,
      quantityValue,
      percents
    } = this.state;
    const {action} = isSellActive ? orderAction.sell : orderAction.buy;
    const currentPrice =
      (isMarketActive ? (isSellActive ? bid : ask) : parseFloat(priceValue)) ||
      0;

    const isLimitInvalid =
      this.state.pendingOrder ||
      this.props.isLimitInvalid(
        isSellActive,
        quantityValue,
        priceValue,
        baseAssetBalance,
        quoteAssetBalance,
        priceAccuracy,
        quantityAccuracy
      );

    const isMarketInvalid =
      this.state.pendingOrder ||
      this.props.isMarketInvalid(
        isSellActive,
        quantityValue,
        baseAssetId,
        quoteAssetId,
        baseAssetBalance,
        quoteAssetBalance,
        quantityAccuracy
      );

    const available = isSellActive ? baseAssetBalance : quoteAssetBalance;

    const balanceAccuracy = isSellActive
      ? baseAssetAccuracy
      : quoteAssetAccuracy;

    const roundedAmount = precisionFloor(
      currentPrice * parseFloat(quantityValue),
      quoteAssetAccuracy
    );

    return (
      <div>
        <Markets>
          <MarketChoiceButton
            title={LIMIT}
            isActive={isLimitActive}
            click={this.handleActionChoiceClick(LIMIT)}
          />
          <MarketChoiceButton
            title={MARKET}
            isActive={isMarketActive}
            click={this.handleActionChoiceClick(MARKET)}
          />
        </Markets>

        <Actions>
          <ActionChoiceButton
            title={orderAction.sell.action}
            click={this.handleActionClick(orderAction.sell.action)}
            isActive={isSellActive}
          />
          <ActionChoiceButton
            title={orderAction.buy.action}
            click={this.handleActionClick(orderAction.buy.action)}
            isActive={!isSellActive}
          />
        </Actions>

        {isLimitActive && (
          <OrderLimit
            action={action}
            onSubmit={this.handleButtonClick}
            quantity={quantityValue}
            price={priceValue}
            quantityAccuracy={quantityAccuracy}
            priceAccuracy={priceAccuracy}
            onChange={this.onChange}
            onArrowClick={this.onArrowClick}
            baseAssetAccuracy={baseAssetAccuracy}
            percents={percents}
            onHandlePercentageChange={this.handlePercentageChange}
            baseAssetName={baseAssetName}
            quoteAssetName={quoteAssetName}
            isSell={isSellActive}
            amount={formattedNumber(roundedAmount || 0, quoteAssetAccuracy)}
            isDisable={isLimitInvalid}
            onReset={this.reset}
            balance={available}
            buttonMessage={`${capitalize(action)} ${formattedNumber(
              +quantityValue,
              quantityAccuracy
            )} ${baseAssetName}`}
            balanceAccuracy={balanceAccuracy}
          />
        )}

        {isMarketActive && (
          <OrderMarket
            quantityAccuracy={quantityAccuracy}
            action={action}
            quantity={quantityValue}
            baseAssetName={baseAssetName}
            quoteAssetName={quoteAssetName}
            percents={percents}
            onHandlePercentageChange={this.handlePercentageChange}
            onChange={this.onChange}
            onArrowClick={this.onArrowClick}
            onReset={this.reset}
            isDisable={isMarketInvalid}
            onSubmit={this.handleButtonClick}
            balance={available}
            isSell={isSellActive}
            // tslint:disable-next-line:jsx-no-lambda
            onResetPercentage={() => resetPercentage(percentage)}
            priceAccuracy={priceAccuracy}
            onInvert={this.handleInvert}
            balanceAccuracy={balanceAccuracy}
          />
        )}
      </div>
    );
  }
}

export default Order;

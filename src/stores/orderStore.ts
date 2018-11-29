import OrderApi, {PlaceOrder} from '../api/orderApi';
import * as topics from '../api/topics';
import ModalMessages from '../constants/modalMessages';
import messages from '../constants/notificationMessages';
import logger from '../Logger';
import {levels, Side} from '../models';
import {OrderType} from '../models';
import Types from '../models/modals';
import {OrderStatus} from '../models/orderType';
import {BaseStore, RootStore} from './index';
import ModalStore from './modalStore';
import NotificationStore from './notificationStore';

const errorOrNoop = (error: string) => {
  try {
    return JSON.parse(error);
  } catch {
    return undefined;
  }
};

enum Errors {
  Confirmation = 'Confirmation',
  AssetKycNeeded = 'AssetKycNeeded'
}

// tslint:disable:no-console
class OrderStore extends BaseStore {
  private readonly modalStore: ModalStore;
  private readonly notificationStore: NotificationStore;

  constructor(store: RootStore, private readonly api: OrderApi) {
    super(store);
    this.notificationStore = this.rootStore.notificationStore;
    this.modalStore = this.rootStore.modalStore;
  }

  placeOrder = async (orderType: string, body: PlaceOrder) => {
    switch (orderType) {
      case OrderType.Market:
        return this.api
          .placeMarket(body)
          .then(this.orderPlacedSuccessfully, this.orderPlacedUnsuccessfully)
          .then(() => Promise.resolve());
      case OrderType.Limit:
        return (
          this.api
            .placeLimit(body)
            // tslint:disable-next-line:no-empty
            .then((orderId: any) => {
              const addedOrder = this.rootStore.orderListStore.addOrder({
                Id: orderId,
                CreateDateTime: new Date(),
                OrderAction: body.OrderAction,
                Volume: body.Volume,
                RemainingVolume: body.Volume,
                Price: body.Price,
                AssetPairId: body.AssetPairId
              });
              if (addedOrder) {
                this.orderPlacedSuccessfully();
              }
            }, this.orderPlacedUnsuccessfully)
        );
      case OrderType.StopLimit: {
        const {Price, StopPrice, ...commonProps} = body;
        const bounds =
          body.OrderAction === Side.Sell
            ? {
                LowerPrice: Price!,
                LowerLimitPrice: StopPrice!,
                UpperPrice: null,
                UpperLimitPrice: null
              }
            : {
                LowerPrice: null,
                LowerLimitPrice: null,
                UpperPrice: Price!,
                UpperLimitPrice: StopPrice!
              };
        return this.api
          .placeStopLimit({...commonProps, ...bounds})
          .then(this.orderPlacedSuccessfully, this.orderPlacedUnsuccessfully);
      }
    }
  };

  editOrder = async (body: any, id: string, type: OrderType) =>
    this.api
      .cancelOrder(id)
      .then(() => {
        switch (type) {
          default:
          case OrderType.Limit:
            return this.api.placeLimit(body);
          case OrderType.StopLimit: {
            const {Price, StopPrice, ...commonProps} = body;
            const bounds =
              body.OrderAction === Side.Sell
                ? {
                    LowerPrice: Price!,
                    LowerLimitPrice: StopPrice!,
                    UpperPrice: null,
                    UpperLimitPrice: null
                  }
                : {
                    LowerPrice: null,
                    LowerLimitPrice: null,
                    UpperPrice: Price!,
                    UpperLimitPrice: StopPrice!
                  };
            return this.api.placeStopLimit({...commonProps, ...bounds});
          }
        }
      })
      .catch(this.orderPlacedUnsuccessfully);

  cancelOrder = async (id: string) => {
    try {
      await this.api.cancelOrder(id);
      const deletedOrder = this.rootStore.orderListStore.deleteOrder(id);
      if (deletedOrder) {
        this.orderCancelledSuccessfully(id);
      }
    } catch (error) {
      this.orderPlacedUnsuccessfully(error);

      logger.logException(error);
    }
  };

  cancelAll = async (isCurrentAsset: boolean) => {
    try {
      const selectedInstrument = this.rootStore.uiStore.selectedInstrument;
      const body = isCurrentAsset ? {AssetPairId: selectedInstrument!.id} : {};

      await this.api.cancelAllOrders(body);
      this.rootStore.orderListStore.deleteAllOrders(body.AssetPairId);
      this.allOrdersCancelledSuccessfully(
        isCurrentAsset ? selectedInstrument!.displayName : null
      );
    } catch (error) {
      this.orderPlacedUnsuccessfully(error);

      logger.logException(error);
    }
  };

  subscribe = () => {
    this.rootStore.socketStore.subscribe(topics.orders, this.onOrders);
  };

  onOrders = (args: any) => {
    const order = args[0][0];
    switch (order.Status) {
      case OrderStatus.Cancelled:
        const deleteOrder = this.rootStore.orderListStore.deleteOrder(order.Id);
        if (deleteOrder) {
          this.orderCancelledSuccessfully(order.Id);
        }
        break;
      case OrderStatus.Matched:
        this.rootStore.orderListStore.deleteOrder(order.Id);
        this.orderClosedSuccessfully(order.Id);
        break;
      case OrderStatus.Pending:
      case OrderStatus.Processing:
        this.rootStore.orderListStore.addOrUpdateOrder(order);
        this.orderPartiallyClosedSuccessfully(order.Id, order.RemainingVolume);
        break;
      case OrderStatus.Placed:
        const isAdded = this.rootStore.orderListStore.addOrder(order);
        if (isAdded) {
          this.orderPlacedSuccessfully();
        }
        break;
    }
  };

  reset = () => {
    return;
  };

  private orderClosedSuccessfully = (orderId: string) => {
    this.notificationStore.addNotification(
      levels.success,
      messages.orderExecuted(orderId)
    );
  };

  private orderPartiallyClosedSuccessfully = (
    orderId: string,
    orderVolume: number
  ) => {
    this.notificationStore.addNotification(
      levels.success,
      messages.orderExecutedPartially(orderId, orderVolume)
    );
  };

  private orderPlacedSuccessfully = () => {
    this.notificationStore.addNotification(
      levels.success,
      messages.orderSuccess
    );
  };

  private orderCancelledSuccessfully = (orderId: string) => {
    this.notificationStore.addNotification(
      levels.information,
      `${messages.orderCancelled} ${orderId}`
    );
  };

  private allOrdersCancelledSuccessfully = (
    instrumentName: string | null | undefined
  ) => {
    this.notificationStore.addNotification(
      levels.information,
      `${
        instrumentName
          ? messages.allCurrentInstrumentOrdersCancelled(instrumentName)
          : messages.allOrdersCancelled
      }`
    );
  };

  private orderPlacedUnsuccessfully = (error: any) => {
    const errorObject = errorOrNoop(error.message);
    if (!errorObject) {
      if (error.message === 'Session confirmation is required') {
        this.modalStore.addModal(
          ModalMessages.expired,
          null,
          null,
          Types.Expired
        );
      } else {
        this.notificationStore.addNotification(
          levels.error,
          `${error.message}`
        );
      }
    } else {
      const key = Object.keys(errorObject)[0];
      if (error.status === 400) {
        switch (key) {
          case Errors.AssetKycNeeded:
            this.modalStore.addModal(null, null, null, Types.MissedKyc);
            break;
          default:
            {
              const message = errorObject[key];
              this.notificationStore.addNotification(
                levels.error,
                `${message}`
              );
            }
            break;
        }
      }
    }
  };
}

export default OrderStore;

import {compose} from 'rambda';
import {withAuth} from '../Auth';
import {connect} from '../connect';
import {withStyledScroll} from '../CustomScrollbar';
import withLoader from '../Loader/withLoader';
import OrderList from './OrderList';
import {OrderListProps} from './OrderList';
import Orders from './Orders';

export const OrderCellWidth = {
  Symbol: 100,
  CancelOrder: 70,
  Id: 320,
  Side: 70,
  Filled: 100,
  CreatedDate: 200,
  Edit: 40
};

export interface OrderActions {
  cancelOrder?: (id: string) => void;
}

const ConnectedOrders = connect(
  ({
    orderStore: {cancelOrder},
    modalStore: {addModal},
    authStore: {isAuth}
  }) => ({
    addModal,
    cancelOrder,
    isAuth
  }),
  withAuth(Orders)
);

const ConnectedOrderList = connect<OrderListProps>(
  ({
    orderListStore: {limitOrders: orders, hasPendingRequests},
    referenceStore: {getInstrumentById}
  }) => ({
    orders,
    loading: hasPendingRequests,
    getInstrumentById
  }),
  compose(
    withLoader<OrderListProps>(p => p.loading!),
    withStyledScroll({height: 'calc(100% - 85px)'})
  )(OrderList)
);

export {ConnectedOrders as Orders};
export {ConnectedOrderList as OrderList};
export {default as OrderListItem} from './OrderListItem';

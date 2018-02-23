import {RestApi} from './restApi';

export interface AssetApi {
  fetchAll: () => Promise<any>;
  fetchAssetById: (id: string) => Promise<any>;
  fetchBaseAsset: () => Promise<any>;
  fetchAssetCategories: () => Promise<any>;
  fetchAssetInstruments: () => Promise<any>;
  setBaseAsset: (body: any) => Promise<any>;
}

export class RestAssetApi extends RestApi implements AssetApi {
  fetchAll = () => this.get('/assets');
  fetchAvailableAssets = () => this.get('/assets/available');
  fetchBaseAsset = () => this.get('/assets/baseAsset');
  fetchAssetCategories = () => this.get('/assets/categories');
  fetchAssetInstruments = () => this.get('/assetpairs');
  setBaseAsset = (body: any) => this.fireAndForget('/assets/baseAsset', body);
  fetchAssetById = (id: string) => this.get(`/assets/${id}`);
}

// tslint:disable-next-line:max-classes-per-file
export class MockAssetApi implements AssetApi {
  fetchAll = () => Promise.resolve<any[]>([]);
  fetchAssetById = () => Promise.resolve<any[]>([]);
  fetchBaseAsset = () => Promise.resolve<any[]>([]);
  fetchAssetCategories = () => Promise.resolve<any[]>([]);
  fetchAssetInstruments = () => Promise.resolve<any[]>([]);
  setBaseAsset = () => Promise.resolve<any[]>([]);
}

export default AssetApi;

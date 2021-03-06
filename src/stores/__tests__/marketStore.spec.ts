import {AssetModel, InstrumentModel} from '../../models/index';
import {RootStore} from '../index';
import MarketStore from '../marketStore';

describe('market store', () => {
  const instruments = [
    new InstrumentModel({
      id: 'BTCUSD',
      baseAsset: new AssetModel({id: 'BTC'}),
      quoteAsset: new AssetModel({id: 'USD'}),
      bid: 9500,
      ask: 9600
    }),
    new InstrumentModel({
      id: 'USDRUB',
      baseAsset: new AssetModel({id: 'USD'}),
      quoteAsset: new AssetModel({id: 'RUB'}),
      bid: 55,
      ask: 58
    }),
    new InstrumentModel({
      id: 'LKKUSD',
      baseAsset: new AssetModel({id: 'LKK'}),
      quoteAsset: new AssetModel({id: 'USD'}),
      bid: 0.05,
      ask: 0.06
    }),
    new InstrumentModel({
      id: 'BTCEUR',
      baseAsset: new AssetModel({id: 'BTC'}),
      quoteAsset: new AssetModel({id: 'EUR'}),
      bid: 5800
    }),
    new InstrumentModel({
      id: 'EURUSD',
      baseAsset: new AssetModel({id: 'EUR'}),
      quoteAsset: new AssetModel({id: 'USD'}),
      bid: 1.1
    }),
    new InstrumentModel({
      id: 'LKKEUR',
      baseAsset: new AssetModel({id: 'LKK'}),
      quoteAsset: new AssetModel({id: 'EUR'}),
      ask: 100
    })
  ];

  const assets = [
    new AssetModel({id: 'BTC'}),
    new AssetModel({id: 'USD'}),
    new AssetModel({id: 'RUB'}),
    new AssetModel({id: 'LKK'}),
    new AssetModel({id: 'TEST'}),
    new AssetModel({id: 'EUR'})
  ];

  const find = (id: string) => instruments.find(x => x.id === id)!;

  const marketStore = new MarketStore(new RootStore(false));

  beforeEach(() => {
    marketStore.init(instruments, assets);
  });

  describe('convert', () => {
    it('should return initial amount if no conversion needed', async () => {
      const result = marketStore.convert(1, 'BTC', 'BTC', find);
      expect(result).toBe(1);
    });

    it('should return zero if conversion cannot be executed (asset does not exist)', async () => {
      const result = marketStore.convert(1, 'BTC', 'FOO', find);
      expect(result).toBe(0);

      const result2 = marketStore.convert(1, 'FOO', 'BTC', find);
      expect(result2).toBe(0);
    });

    it('should return zero if conversion cannot be executed (no pair for conversion)', async () => {
      const result = marketStore.convert(1, 'BTC', 'TEST', find);
      expect(result).toBe(0);

      const result2 = marketStore.convert(1, 'TEST', 'BTC', find);
      expect(result2).toBe(0);
    });

    it('should be converted', async () => {
      const resultBtcUsd = marketStore.convert(1, 'BTC', 'USD', find);
      expect(resultBtcUsd).toBe(9500);

      const resultBtcRub = marketStore.convert(1.5, 'BTC', 'RUB', find);
      expect(resultBtcRub).toBe(1.5 * 9500 * 55);

      const resultLkkBtc = marketStore.convert(20000, 'LKK', 'BTC', find);
      expect(resultLkkBtc).toBe(20000 * 0.05 * (1 / 9600));

      const resultRubLkk = marketStore.convert(10000, 'RUB', 'LKK', find);
      expect(resultRubLkk).toBe(10000 * (1 / 58) * (1 / 0.06));
    });

    it('should avoid path with zero price', async () => {
      const resultEurBtc = marketStore.convert(1000, 'EUR', 'BTC', find);
      expect(resultEurBtc).toBe(1000 * 1.1 * (1 / 9600)); // EUR -> USD -> BTC

      const resultLKkEur = marketStore.convert(1000, 'LKK', 'EUR', find);
      expect(resultLKkEur).toBe(1000 * 0.05 * (1 / 9600) * 5800); // LKK -> USD -> BTC -> EUR

      const resultEurLkk = marketStore.convert(1000, 'EUR', 'LKK', find);
      expect(resultEurLkk).toBe(1000 * (1 / 100));
    });
  });
});

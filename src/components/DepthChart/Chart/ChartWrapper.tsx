import * as React from 'react';

import {observable} from 'mobx';

import {FastLayer, Layer, Stage} from 'react-konva';

import Measure from 'react-measure';

import Chart from './Chart';
import Mesh from './Mesh';

import {ChartProps} from './Models';

import chart from './chartConstants';

class ChartWrapper extends React.Component<ChartProps> {
  @observable width: number = -1;
  @observable height: number = -1;

  constructor(props: ChartProps) {
    super(props);
  }

  render() {
    const {asks, bids, mid, baseAsset, quoteAsset, priceAccuracy} = this.props;

    return (
      <Measure
        // tslint:disable-next-line:jsx-boolean-value
        client
        // tslint:disable-next-line:jsx-no-lambda
        onResize={contentRect => {
          this.width = Math.ceil(contentRect.client!.width);
          this.height = Math.ceil(
            contentRect.client!.height - chart.labelsHeight
          );
          this.forceUpdate();
        }}
      >
        {({measureRef}) => (
          <div style={{height: '100%'}} ref={measureRef}>
            <Stage width={this.width} height={this.height}>
              <FastLayer clearBeforeDraw={true}>
                <Mesh
                  asks={asks}
                  bids={bids}
                  mid={mid}
                  baseAsset={baseAsset}
                  quoteAsset={quoteAsset}
                  width={this.width - chart.labelsWidth}
                  height={this.height - chart.labelsHeight}
                  priceAccuracy={priceAccuracy}
                />
              </FastLayer>
              <Layer>
                <Chart
                  asks={asks}
                  bids={bids}
                  mid={mid}
                  baseAsset={baseAsset}
                  quoteAsset={quoteAsset}
                  width={this.width - chart.labelsWidth}
                  height={this.height - chart.labelsHeight}
                  priceAccuracy={priceAccuracy}
                />
              </Layer>
            </Stage>
          </div>
        )}
      </Measure>
    );
  }
}

export default ChartWrapper;

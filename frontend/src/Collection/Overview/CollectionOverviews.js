import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Grid, WindowScroller } from 'react-virtualized';
import CollectionItemConnector from 'Collection/CollectionItemConnector';
import Measure from 'Components/Measure';
import dimensions from 'Styles/Variables/dimensions';
import getIndexOfFirstCharacter from 'Utilities/Array/getIndexOfFirstCharacter';
import hasDifferentItemsOrOrder from 'Utilities/Object/hasDifferentItemsOrOrder';
import CollectionOverviewConnector from './CollectionOverviewConnector';
import styles from './CollectionOverviews.css';

// Poster container dimensions
const columnPadding = parseInt(dimensions.movieIndexColumnPadding);
const columnPaddingSmallScreen = parseInt(dimensions.movieIndexColumnPaddingSmallScreen);

function calculatePosterWidth(posterSize, isSmallScreen) {
  const maximumPosterWidth = isSmallScreen ? 152 : 162;

  if (posterSize === 'large') {
    return maximumPosterWidth;
  }

  if (posterSize === 'medium') {
    return Math.floor(maximumPosterWidth * 0.75);
  }

  return Math.floor(maximumPosterWidth * 0.5);
}

function calculateRowHeight(posterHeight, sortKey, isSmallScreen, overviewOptions) {
  const heights = [
    overviewOptions.showPosters ? posterHeight : 75,
    isSmallScreen ? columnPaddingSmallScreen : columnPadding
  ];

  return heights.reduce((acc, height) => acc + height + 80, 0);
}

function calculatePosterHeight(posterWidth) {
  return Math.ceil((250 / 170) * posterWidth);
}

class CollectionOverviews extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      width: 0,
      columnCount: 1,
      posterWidth: 162,
      posterHeight: 238,
      rowHeight: calculateRowHeight(238, null, props.isSmallScreen, {})
    };

    this._grid = null;
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      items,
      sortKey,
      overviewOptions,
      jumpToCharacter,
      scrollTop,
      isSmallScreen
    } = this.props;

    const {
      width,
      rowHeight,
      scrollRestored
    } = this.state;

    if (prevProps.sortKey !== sortKey ||
        prevProps.overviewOptions !== overviewOptions) {
      this.calculateGrid(this.state.width, isSmallScreen);
    }

    if (
      this._grid &&
        (prevState.width !== width ||
            prevState.rowHeight !== rowHeight ||
            hasDifferentItemsOrOrder(prevProps.items, items) ||
            prevProps.overviewOptions !== overviewOptions)) {
      // recomputeGridSize also forces Grid to discard its cache of rendered cells
      this._grid.recomputeGridSize();
    }

    if (this._grid && scrollTop !== 0 && !scrollRestored) {
      this.setState({ scrollRestored: true });
      this._gridScrollToPosition({ scrollTop });
    }

    if (jumpToCharacter != null && jumpToCharacter !== prevProps.jumpToCharacter) {
      const index = getIndexOfFirstCharacter(items, jumpToCharacter);

      if (this._grid && index != null) {
        this._gridScrollToCell({
          rowIndex: index,
          columnIndex: 0
        });
      }
    }
  }

  //
  // Control

  setGridRef = (ref) => {
    this._grid = ref;
  };

  calculateGrid = (width = this.state.width, isSmallScreen) => {
    const {
      sortKey,
      overviewOptions
    } = this.props;

    const posterWidth = overviewOptions.showPosters ? calculatePosterWidth(overviewOptions.size, isSmallScreen) : 0;
    const posterHeight = overviewOptions.showPosters ? calculatePosterHeight(posterWidth) : 0;
    const rowHeight = calculateRowHeight(posterHeight, sortKey, isSmallScreen, overviewOptions);

    this.setState({
      width,
      posterWidth,
      posterHeight,
      rowHeight
    });
  };

  cellRenderer = ({ key, rowIndex, style }) => {
    const {
      items,
      sortKey,
      overviewOptions,
      showRelativeDates,
      shortDateFormat,
      longDateFormat,
      timeFormat,
      isSmallScreen,
      selectedState,
      onSelectedChange
    } = this.props;

    const {
      posterWidth,
      posterHeight,
      rowHeight
    } = this.state;

    const collection = items[rowIndex];

    if (!collection) {
      return null;
    }

    return (
      <div
        className={styles.container}
        key={key}
        style={style}
      >
        <CollectionItemConnector
          key={collection.id}
          component={CollectionOverviewConnector}
          sortKey={sortKey}
          posterWidth={posterWidth}
          posterHeight={posterHeight}
          rowHeight={rowHeight}
          overviewOptions={overviewOptions}
          showRelativeDates={showRelativeDates}
          shortDateFormat={shortDateFormat}
          longDateFormat={longDateFormat}
          timeFormat={timeFormat}
          isSmallScreen={isSmallScreen}
          collectionId={collection.id}
          isSelected={selectedState[collection.id]}
          onSelectedChange={onSelectedChange}
        />
      </div>
    );
  };

  _gridScrollToCell = ({ rowIndex = 0, columnIndex = 0 }) => {
    const scrollOffset = this._grid.getOffsetForCell({
      rowIndex,
      columnIndex
    });

    this._gridScrollToPosition(scrollOffset);
  };

  _gridScrollToPosition = ({ scrollTop = 0, scrollLeft = 0 }) => {
    this.props.scroller?.scrollTo({ top: scrollTop, left: scrollLeft });
  };

  //
  // Listeners

  onMeasure = ({ width }) => {
    this.calculateGrid(width, this.props.isSmallScreen);
  };

  //
  // Render

  render() {
    const {
      isSmallScreen,
      scroller,
      items,
      selectedState
    } = this.props;

    const {
      width,
      rowHeight
    } = this.state;

    return (
      <Measure
        whitelist={['width']}
        onMeasure={this.onMeasure}
      >
        <WindowScroller
          scrollElement={isSmallScreen ? undefined : scroller}
        >
          {({ height, registerChild, onChildScroll, scrollTop }) => {
            if (!height) {
              return <div />;
            }

            return (
              <div ref={registerChild}>
                <Grid
                  ref={this.setGridRef}
                  className={styles.grid}
                  autoHeight={true}
                  height={height}
                  columnCount={1}
                  columnWidth={width}
                  rowCount={items.length}
                  rowHeight={rowHeight}
                  width={width}
                  onScroll={onChildScroll}
                  scrollTop={scrollTop}
                  overscanRowCount={2}
                  cellRenderer={this.cellRenderer}
                  selectedState={selectedState}
                  scrollToAlignment={'start'}
                  isScrollingOptout={true}
                />
              </div>
            );
          }
          }
        </WindowScroller>
      </Measure>
    );
  }
}

CollectionOverviews.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  sortKey: PropTypes.string,
  overviewOptions: PropTypes.object.isRequired,
  jumpToCharacter: PropTypes.string,
  scrollTop: PropTypes.number,
  scroller: PropTypes.instanceOf(Element).isRequired,
  showRelativeDates: PropTypes.bool.isRequired,
  shortDateFormat: PropTypes.string.isRequired,
  longDateFormat: PropTypes.string.isRequired,
  isSmallScreen: PropTypes.bool.isRequired,
  timeFormat: PropTypes.string.isRequired,
  selectedState: PropTypes.object.isRequired,
  onSelectedChange: PropTypes.func.isRequired
};

export default CollectionOverviews;

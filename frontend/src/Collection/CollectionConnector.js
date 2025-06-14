import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import * as commandNames from 'Commands/commandNames';
import withScrollPosition from 'Components/withScrollPosition';
import { executeCommand } from 'Store/Actions/commandActions';
import {
  fetchMovieCollections,
  saveMovieCollections,
  setMovieCollectionsFilter,
  setMovieCollectionsSort
} from 'Store/Actions/movieCollectionActions';
import { clearQueueDetails, fetchQueueDetails } from 'Store/Actions/queueActions';
import scrollPositions from 'Store/scrollPositions';
import createCollectionClientSideCollectionItemsSelector from 'Store/Selectors/createCollectionClientSideCollectionItemsSelector';
import createCommandExecutingSelector from 'Store/Selectors/createCommandExecutingSelector';
import createDimensionsSelector from 'Store/Selectors/createDimensionsSelector';
import Collection from './Collection';

function createMapStateToProps() {
  return createSelector(
    createCollectionClientSideCollectionItemsSelector('movieCollections'),
    createCommandExecutingSelector(commandNames.REFRESH_COLLECTIONS),
    createDimensionsSelector(),
    (
      collections,
      isRefreshingCollections,
      dimensionsState
    ) => {
      return {
        ...collections,
        isRefreshingCollections,
        isSmallScreen: dimensionsState.isSmallScreen
      };
    }
  );
}

function createMapDispatchToProps(dispatch, props) {
  return {
    dispatchFetchMovieCollections() {
      dispatch(fetchMovieCollections());
    },
    dispatchFetchQueueDetails() {
      dispatch(fetchQueueDetails());
    },
    dispatchClearQueueDetails() {
      dispatch(clearQueueDetails());
    },
    onUpdateSelectedPress(payload) {
      dispatch(saveMovieCollections(payload));
    },
    onSortSelect(sortKey) {
      dispatch(setMovieCollectionsSort({ sortKey }));
    },
    onFilterSelect(selectedFilterKey) {
      dispatch(setMovieCollectionsFilter({ selectedFilterKey }));
    },
    onRefreshMovieCollectionsPress() {
      dispatch(executeCommand({
        name: commandNames.REFRESH_COLLECTIONS
      }));
    }
  };
}

class CollectionConnector extends Component {

  //
  // Lifecycle

  componentDidMount() {
    this.props.dispatchFetchMovieCollections();
    this.props.dispatchFetchQueueDetails();
  }

  componentWillUnmount() {
    this.props.dispatchClearQueueDetails();
  }

  //
  // Listeners

  onScroll = ({ scrollTop }) => {
    scrollPositions.movieCollections = scrollTop;
  };

  onUpdateSelectedPress = (payload) => {
    this.props.onUpdateSelectedPress(payload);
  };

  //
  // Render

  render() {
    const {
      dispatchFetchMovieCollections,
      dispatchFetchQueueDetails,
      dispatchClearQueueDetails,
      ...otherProps
    } = this.props;

    return (
      <Collection
        {...otherProps}
        onViewSelect={this.onViewSelect}
        onScroll={this.onScroll}
        onUpdateSelectedPress={this.onUpdateSelectedPress}
      />
    );
  }
}

CollectionConnector.propTypes = {
  isSmallScreen: PropTypes.bool.isRequired,
  view: PropTypes.string.isRequired,
  onUpdateSelectedPress: PropTypes.func.isRequired,
  dispatchFetchMovieCollections: PropTypes.func.isRequired,
  dispatchFetchQueueDetails: PropTypes.func.isRequired,
  dispatchClearQueueDetails: PropTypes.func.isRequired
};

export default withScrollPosition(
  connect(createMapStateToProps, createMapDispatchToProps)(CollectionConnector),
  'movieCollections'
);

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TextTruncate from 'react-text-truncate';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import EditMovieCollectionModal from 'Collection/Edit/EditMovieCollectionModal';
import CheckInput from 'Components/Form/CheckInput';
import Icon from 'Components/Icon';
import Label from 'Components/Label';
import IconButton from 'Components/Link/IconButton';
import MonitorToggleButton from 'Components/MonitorToggleButton';
import { icons, sizes } from 'Helpers/Props';
import MovieGenres from 'Movie/MovieGenres';
import QualityProfileName from 'Settings/Profiles/Quality/QualityProfileName';
import dimensions from 'Styles/Variables/dimensions';
import fonts from 'Styles/Variables/fonts';
import translate from 'Utilities/String/translate';
import CollectionMovieConnector from './CollectionMovieConnector';
import CollectionMovieLabelConnector from './CollectionMovieLabelConnector';
import styles from './CollectionOverview.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

const columnPadding = parseInt(dimensions.movieIndexColumnPadding);
const columnPaddingSmallScreen = parseInt(dimensions.movieIndexColumnPaddingSmallScreen);
const defaultFontSize = parseInt(fonts.defaultFontSize);
const lineHeight = parseFloat(fonts.lineHeight);

// Hardcoded height beased on line-height of 32 + bottom margin of 10. 19 + 5 for List Row
// Less side-effecty than using react-measure.
const titleRowHeight = 100;

function getContentHeight(rowHeight, isSmallScreen) {
  const padding = isSmallScreen ? columnPaddingSmallScreen : columnPadding;

  return rowHeight - padding;
}

class CollectionOverview extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      isEditCollectionModalOpen: false,
      isNewAddMovieModalOpen: false
    };
  }

  //
  // Control

  setSliderPrevRef = (ref) => {
    this._swiperPrevRef = ref;
  };

  setSliderNextRef = (ref) => {
    this._swiperNextRef = ref;
  };

  //
  // Listeners

  onPress = () => {
    this.setState({ isNewAddMovieModalOpen: true });
  };

  onEditCollectionPress = () => {
    this.setState({ isEditCollectionModalOpen: true });
  };

  onEditCollectionModalClose = () => {
    this.setState({ isEditCollectionModalOpen: false });
  };

  onAddMovieModalClose = () => {
    this.setState({ isNewAddMovieModalOpen: false });
  };

  onChange = ({ value, shiftKey }) => {
    const {
      id,
      onSelectedChange
    } = this.props;

    onSelectedChange({ id, value, shiftKey });
  };

  //
  // Render

  render() {
    const {
      monitored,
      qualityProfileId,
      rootFolderPath,
      genres,
      id,
      title,
      movies,
      overview,
      missingMovies,
      posterHeight,
      posterWidth,
      rowHeight,
      isSmallScreen,
      isSelected,
      onMonitorTogglePress
    } = this.props;

    const {
      showDetails,
      showOverview,
      showPosters,
      detailedProgressBar
    } = this.props.overviewOptions;

    const {
      isEditCollectionModalOpen
    } = this.state;

    const contentHeight = getContentHeight(rowHeight, isSmallScreen);
    const overviewHeight = contentHeight - titleRowHeight - posterHeight;

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.editorSelect}>
            <CheckInput
              className={styles.checkInput}
              name={id.toString()}
              value={isSelected}
              onChange={this.onChange}
            />
          </div>
          <div className={styles.info} style={{ maxHeight: contentHeight }}>

            <div className={styles.titleRow}>
              <div className={styles.titleContainer}>
                <div className={styles.toggleMonitoredContainer}>
                  <MonitorToggleButton
                    className={styles.monitorToggleButton}
                    monitored={monitored}
                    size={isSmallScreen ? 20 : 25}
                    onPress={onMonitorTogglePress}
                  />
                </div>
                <div className={styles.title}>
                  {title}
                </div>

                <IconButton
                  name={icons.EDIT}
                  title={translate('EditCollection')}
                  onPress={this.onEditCollectionPress}
                />
              </div>

              {
                showPosters &&
                  <div className={styles.navigationButtons}>
                    <span ref={this.setSliderPrevRef}>
                      <IconButton
                        name={icons.ARROW_LEFT}
                        title={translate('ScrollMovies')}
                        size={20}
                      />
                    </span>

                    <span ref={this.setSliderNextRef}>
                      <IconButton
                        name={icons.ARROW_RIGHT}
                        title={translate('ScrollMovies')}
                        size={20}
                      />
                    </span>
                  </div>
              }

            </div>

            {
              showDetails &&
                <div className={styles.defaults}>
                  <Label
                    className={styles.detailsLabel}
                    size={sizes.MEDIUM}
                  >
                    <Icon
                      name={icons.DRIVE}
                      size={13}
                    />
                    <span className={styles.status}>
                      {translate('CountMissingMoviesFromLibrary', { count: missingMovies })}
                    </span>
                  </Label>

                  {
                    !isSmallScreen &&
                      <Label
                        className={styles.detailsLabel}
                        size={sizes.MEDIUM}
                      >
                        <Icon
                          name={icons.PROFILE}
                          size={13}
                        />
                        <span className={styles.qualityProfileName}>
                          {
                            <QualityProfileName
                              qualityProfileId={qualityProfileId}
                            />
                          }
                        </span>
                      </Label>
                  }

                  {
                    !isSmallScreen &&
                      <Label
                        className={styles.detailsLabel}
                        size={sizes.MEDIUM}
                      >
                        <Icon
                          name={icons.FOLDER}
                          size={13}
                        />
                        <span className={styles.path}>
                          {rootFolderPath}
                        </span>
                      </Label>
                  }

                  {
                    !isSmallScreen &&
                      <Label
                        className={styles.detailsLabel}
                        size={sizes.MEDIUM}
                      >
                        <Icon
                          name={icons.GENRE}
                          size={13}
                        />
                        <MovieGenres className={styles.genres} genres={genres} />
                      </Label>
                  }

                </div>
            }

            {
              showOverview &&
                <div className={styles.details}>
                  <div className={styles.overview}>
                    <TextTruncate
                      line={Math.floor(overviewHeight / (defaultFontSize * lineHeight))}
                      text={overview}
                    />
                  </div>
                </div>
            }

            {
              showPosters ?
                <div className={styles.sliderContainer}>
                  <Swiper
                    slidesPerView='auto'
                    spaceBetween={10}
                    slidesPerGroup={3}
                    loop={false}
                    loopFillGroupWithBlank={true}
                    className="mySwiper"
                    modules={[Navigation]}
                    onInit={(swiper) => {
                      swiper.params.navigation.prevEl = this._swiperPrevRef;
                      swiper.params.navigation.nextEl = this._swiperNextRef;
                      swiper.navigation.init();
                      swiper.navigation.update();
                    }}
                  >
                    {movies.map((movie) => (
                      <SwiperSlide key={movie.tmdbId} style={{ width: posterWidth }}>
                        <CollectionMovieConnector
                          key={movie.tmdbId}
                          posterWidth={posterWidth}
                          posterHeight={posterHeight}
                          detailedProgressBar={detailedProgressBar}
                          collectionId={id}
                          {...movie}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div> :
                <div className={styles.labelsContainer}>
                  {movies.map((movie) => (
                    <CollectionMovieLabelConnector
                      key={movie.tmdbId}
                      collectionId={id}
                      {...movie}
                    />
                  ))}
                </div>
            }

          </div>
        </div>

        <EditMovieCollectionModal
          isOpen={isEditCollectionModalOpen}
          collectionId={id}
          onModalClose={this.onEditCollectionModalClose}
        />
      </div>
    );
  }
}

CollectionOverview.propTypes = {
  id: PropTypes.number.isRequired,
  monitored: PropTypes.bool.isRequired,
  qualityProfileId: PropTypes.number.isRequired,
  minimumAvailability: PropTypes.string.isRequired,
  searchOnAdd: PropTypes.bool.isRequired,
  rootFolderPath: PropTypes.string.isRequired,
  tmdbId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  overview: PropTypes.string.isRequired,
  movies: PropTypes.arrayOf(PropTypes.object).isRequired,
  genres: PropTypes.arrayOf(PropTypes.string).isRequired,
  missingMovies: PropTypes.number.isRequired,
  images: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowHeight: PropTypes.number.isRequired,
  posterHeight: PropTypes.number.isRequired,
  posterWidth: PropTypes.number.isRequired,
  overviewOptions: PropTypes.object.isRequired,
  showRelativeDates: PropTypes.bool.isRequired,
  shortDateFormat: PropTypes.string.isRequired,
  longDateFormat: PropTypes.string.isRequired,
  timeFormat: PropTypes.string.isRequired,
  isSmallScreen: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool,
  onMonitorTogglePress: PropTypes.func.isRequired,
  onSelectedChange: PropTypes.func.isRequired
};

export default CollectionOverview;

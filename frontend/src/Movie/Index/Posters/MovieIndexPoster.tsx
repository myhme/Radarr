import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MOVIE_SEARCH, REFRESH_MOVIE } from 'Commands/commandNames';
import Icon from 'Components/Icon';
import ImdbRating from 'Components/ImdbRating';
import Label from 'Components/Label';
import IconButton from 'Components/Link/IconButton';
import Link from 'Components/Link/Link';
import SpinnerIconButton from 'Components/Link/SpinnerIconButton';
import MovieTagList from 'Components/MovieTagList';
import RottenTomatoRating from 'Components/RottenTomatoRating';
import TmdbRating from 'Components/TmdbRating';
import Popover from 'Components/Tooltip/Popover';
import TraktRating from 'Components/TraktRating';
import { icons } from 'Helpers/Props';
import DeleteMovieModal from 'Movie/Delete/DeleteMovieModal';
import MovieDetailsLinks from 'Movie/Details/MovieDetailsLinks';
import EditMovieModal from 'Movie/Edit/EditMovieModal';
import MovieIndexProgressBar from 'Movie/Index/ProgressBar/MovieIndexProgressBar';
import MovieIndexPosterSelect from 'Movie/Index/Select/MovieIndexPosterSelect';
import { Statistics } from 'Movie/Movie';
import MoviePoster from 'Movie/MoviePoster';
import { executeCommand } from 'Store/Actions/commandActions';
import createUISettingsSelector from 'Store/Selectors/createUISettingsSelector';
import formatDate from 'Utilities/Date/formatDate';
import getRelativeDate from 'Utilities/Date/getRelativeDate';
import translate from 'Utilities/String/translate';
import createMovieIndexItemSelector from '../createMovieIndexItemSelector';
import MovieIndexPosterInfo from './MovieIndexPosterInfo';
import selectPosterOptions from './selectPosterOptions';
import styles from './MovieIndexPoster.css';

interface MovieIndexPosterProps {
  movieId: number;
  sortKey: string;
  isSelectMode: boolean;
  posterWidth: number;
  posterHeight: number;
}

function MovieIndexPoster(props: MovieIndexPosterProps) {
  const { movieId, sortKey, isSelectMode, posterWidth, posterHeight } = props;

  const { movie, qualityProfile, isRefreshingMovie, isSearchingMovie } =
    useSelector(createMovieIndexItemSelector(props.movieId));

  const {
    detailedProgressBar,
    showTitle,
    showMonitored,
    showQualityProfile,
    showCinemaRelease,
    showDigitalRelease,
    showPhysicalRelease,
    showReleaseDate,
    showTmdbRating,
    showImdbRating,
    showRottenTomatoesRating,
    showTraktRating,
    showTags,
    showSearchAction,
  } = useSelector(selectPosterOptions);

  const { showRelativeDates, shortDateFormat, longDateFormat, timeFormat } =
    useSelector(createUISettingsSelector());

  const {
    title,
    monitored,
    status,
    images,
    tmdbId,
    imdbId,
    youTubeTrailerId,
    hasFile,
    isAvailable,
    studio,
    added,
    year,
    inCinemas,
    physicalRelease,
    digitalRelease,
    releaseDate,
    path,
    movieFile,
    ratings,
    statistics = {} as Statistics,
    certification,
    originalTitle,
    originalLanguage,
    tags = [],
  } = movie;

  const { sizeOnDisk = 0 } = statistics;

  const dispatch = useDispatch();
  const [hasPosterError, setHasPosterError] = useState(false);
  const [isEditMovieModalOpen, setIsEditMovieModalOpen] = useState(false);
  const [isDeleteMovieModalOpen, setIsDeleteMovieModalOpen] = useState(false);

  const onRefreshPress = useCallback(() => {
    dispatch(
      executeCommand({
        name: REFRESH_MOVIE,
        movieIds: [movieId],
      })
    );
  }, [movieId, dispatch]);

  const onSearchPress = useCallback(() => {
    dispatch(
      executeCommand({
        name: MOVIE_SEARCH,
        movieIds: [movieId],
      })
    );
  }, [movieId, dispatch]);

  const onPosterLoadError = useCallback(() => {
    setHasPosterError(true);
  }, [setHasPosterError]);

  const onPosterLoad = useCallback(() => {
    setHasPosterError(false);
  }, [setHasPosterError]);

  const onEditMoviePress = useCallback(() => {
    setIsEditMovieModalOpen(true);
  }, [setIsEditMovieModalOpen]);

  const onEditMovieModalClose = useCallback(() => {
    setIsEditMovieModalOpen(false);
  }, [setIsEditMovieModalOpen]);

  const onDeleteMoviePress = useCallback(() => {
    setIsEditMovieModalOpen(false);
    setIsDeleteMovieModalOpen(true);
  }, [setIsDeleteMovieModalOpen]);

  const onDeleteMovieModalClose = useCallback(() => {
    setIsDeleteMovieModalOpen(false);
  }, [setIsDeleteMovieModalOpen]);

  const link = `/movie/${tmdbId}`;

  const elementStyle = {
    width: `${posterWidth}px`,
    height: `${posterHeight}px`,
  };

  return (
    <div className={styles.content}>
      <div className={styles.posterContainer} title={title}>
        {isSelectMode ? <MovieIndexPosterSelect movieId={movieId} /> : null}

        <Label className={styles.controls}>
          <SpinnerIconButton
            name={icons.REFRESH}
            title={translate('RefreshMovie')}
            isSpinning={isRefreshingMovie}
            onPress={onRefreshPress}
          />

          {showSearchAction ? (
            <SpinnerIconButton
              className={styles.action}
              name={icons.SEARCH}
              title={translate('SearchForMovie')}
              isSpinning={isSearchingMovie}
              onPress={onSearchPress}
            />
          ) : null}

          <IconButton
            name={icons.EDIT}
            title={translate('EditMovie')}
            onPress={onEditMoviePress}
          />

          <span className={styles.externalLinks}>
            <Popover
              anchor={<Icon name={icons.EXTERNAL_LINK} size={12} />}
              title={translate('Links')}
              body={
                <MovieDetailsLinks
                  tmdbId={tmdbId}
                  imdbId={imdbId}
                  youTubeTrailerId={youTubeTrailerId}
                />
              }
            />
          </span>
        </Label>

        {status === 'deleted' ? (
          <div className={styles.deleted} title={translate('Deleted')} />
        ) : null}

        <Link className={styles.link} style={elementStyle} to={link}>
          <MoviePoster
            style={elementStyle}
            images={images}
            size={250}
            lazy={false}
            overflow={true}
            onError={onPosterLoadError}
            onLoad={onPosterLoad}
          />

          {hasPosterError ? (
            <div className={styles.overlayTitle}>{title}</div>
          ) : null}
        </Link>
      </div>

      <MovieIndexProgressBar
        movieId={movieId}
        movieFile={movieFile}
        monitored={monitored}
        hasFile={hasFile}
        isAvailable={isAvailable}
        status={status}
        width={posterWidth}
        detailedProgressBar={detailedProgressBar}
        bottomRadius={false}
      />

      {showTitle ? (
        <div className={styles.title} title={title}>
          {title}
        </div>
      ) : null}

      {showMonitored ? (
        <div className={styles.title}>
          {monitored ? translate('Monitored') : translate('Unmonitored')}
        </div>
      ) : null}

      {showQualityProfile && !!qualityProfile?.name ? (
        <div className={styles.title} title={translate('QualityProfile')}>
          {qualityProfile.name}
        </div>
      ) : null}

      {showCinemaRelease && inCinemas ? (
        <div
          className={styles.title}
          title={`${translate('InCinemas')}: ${formatDate(
            inCinemas,
            longDateFormat
          )}`}
        >
          <Icon name={icons.IN_CINEMAS} />{' '}
          {getRelativeDate({
            date: inCinemas,
            shortDateFormat,
            showRelativeDates,
            timeFormat,
            timeForToday: false,
          })}
        </div>
      ) : null}

      {showDigitalRelease && digitalRelease ? (
        <div
          className={styles.title}
          title={`${translate('DigitalRelease')}: ${formatDate(
            digitalRelease,
            longDateFormat
          )}`}
        >
          <Icon name={icons.MOVIE_FILE} />{' '}
          {getRelativeDate({
            date: digitalRelease,
            shortDateFormat,
            showRelativeDates,
            timeFormat,
            timeForToday: false,
          })}
        </div>
      ) : null}

      {showPhysicalRelease && physicalRelease ? (
        <div
          className={styles.title}
          title={`${translate('PhysicalRelease')}: ${formatDate(
            physicalRelease,
            longDateFormat
          )}`}
        >
          <Icon name={icons.DISC} />{' '}
          {getRelativeDate({
            date: physicalRelease,
            shortDateFormat,
            showRelativeDates,
            timeFormat,
            timeForToday: false,
          })}
        </div>
      ) : null}

      {showReleaseDate && releaseDate ? (
        <div
          className={styles.title}
          title={`${translate('ReleaseDate')}: ${formatDate(
            releaseDate,
            longDateFormat
          )}`}
        >
          <Icon name={icons.CALENDAR} />{' '}
          {getRelativeDate({
            date: releaseDate,
            shortDateFormat,
            showRelativeDates,
            timeFormat,
            timeForToday: false,
          })}
        </div>
      ) : null}

      {showTmdbRating && !!ratings.tmdb ? (
        <div className={styles.title}>
          <TmdbRating ratings={ratings} iconSize={12} />
        </div>
      ) : null}

      {showImdbRating && !!ratings.imdb ? (
        <div className={styles.title}>
          <ImdbRating ratings={ratings} iconSize={12} />
        </div>
      ) : null}

      {showRottenTomatoesRating && !!ratings.rottenTomatoes ? (
        <div className={styles.title}>
          <RottenTomatoRating ratings={ratings} iconSize={12} />
        </div>
      ) : null}

      {showTraktRating && !!ratings.trakt ? (
        <div className={styles.title}>
          <TraktRating ratings={ratings} iconSize={12} />
        </div>
      ) : null}

      {showTags && tags.length ? (
        <div className={styles.tags}>
          <div className={styles.tagsList}>
            <MovieTagList tags={tags} />
          </div>
        </div>
      ) : null}

      <MovieIndexPosterInfo
        studio={studio}
        qualityProfile={qualityProfile}
        added={added}
        year={year}
        showQualityProfile={showQualityProfile}
        showCinemaRelease={showCinemaRelease}
        showDigitalRelease={showDigitalRelease}
        showPhysicalRelease={showPhysicalRelease}
        showReleaseDate={showReleaseDate}
        showRelativeDates={showRelativeDates}
        shortDateFormat={shortDateFormat}
        longDateFormat={longDateFormat}
        timeFormat={timeFormat}
        inCinemas={inCinemas}
        physicalRelease={physicalRelease}
        digitalRelease={digitalRelease}
        releaseDate={releaseDate}
        ratings={ratings}
        sizeOnDisk={sizeOnDisk}
        sortKey={sortKey}
        path={path}
        certification={certification}
        originalTitle={originalTitle}
        originalLanguage={originalLanguage}
        tags={tags}
        showTmdbRating={showTmdbRating}
        showImdbRating={showImdbRating}
        showRottenTomatoesRating={showRottenTomatoesRating}
        showTraktRating={showTraktRating}
        showTags={showTags}
      />

      <EditMovieModal
        isOpen={isEditMovieModalOpen}
        movieId={movieId}
        onModalClose={onEditMovieModalClose}
        onDeleteMoviePress={onDeleteMoviePress}
      />

      <DeleteMovieModal
        isOpen={isDeleteMovieModalOpen}
        movieId={movieId}
        onModalClose={onDeleteMovieModalClose}
      />
    </div>
  );
}

export default MovieIndexPoster;

import { throttle } from 'lodash';
import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import useMeasure from 'Helpers/Hooks/useMeasure';
import Movie from 'Movie/Movie';
import dimensions from 'Styles/Variables/dimensions';
import getIndexOfFirstCharacter from 'Utilities/Array/getIndexOfFirstCharacter';
import MovieIndexOverview from './MovieIndexOverview';
import selectOverviewOptions from './selectOverviewOptions';

// Poster container dimensions
const columnPadding = parseInt(dimensions.movieIndexColumnPadding);
const columnPaddingSmallScreen = parseInt(
  dimensions.movieIndexColumnPaddingSmallScreen
);
const progressBarHeight = parseInt(dimensions.progressBarSmallHeight);
const detailedProgressBarHeight = parseInt(dimensions.progressBarMediumHeight);
const bodyPadding = parseInt(dimensions.pageContentBodyPadding);
const bodyPaddingSmallScreen = parseInt(
  dimensions.pageContentBodyPaddingSmallScreen
);

interface RowItemData {
  items: Movie[];
  sortKey: string;
  posterWidth: number;
  posterHeight: number;
  rowHeight: number;
  isSelectMode: boolean;
  isSmallScreen: boolean;
}

interface MovieIndexOverviewsProps {
  items: Movie[];
  sortKey: string;
  sortDirection?: string;
  jumpToCharacter?: string;
  scrollTop?: number;
  scrollerRef: RefObject<HTMLElement>;
  isSelectMode: boolean;
  isSmallScreen: boolean;
}

function Row({ index, style, data }: ListChildComponentProps<RowItemData>) {
  const { items, ...otherData } = data;

  if (index >= items.length) {
    return null;
  }

  const movie = items[index];

  return (
    <div style={style}>
      <MovieIndexOverview movieId={movie.id} {...otherData} />
    </div>
  );
}

function getWindowScrollTopPosition() {
  return document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function MovieIndexOverviews(props: MovieIndexOverviewsProps) {
  const {
    items,
    sortKey,
    jumpToCharacter,
    scrollerRef,
    isSelectMode,
    isSmallScreen,
  } = props;

  const { size: posterSize, detailedProgressBar } = useSelector(
    selectOverviewOptions
  );
  const listRef = useRef<List>(null);
  const [measureRef, bounds] = useMeasure();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const posterWidth = useMemo(() => {
    const maximumPosterWidth = isSmallScreen ? 152 : 162;

    if (posterSize === 'large') {
      return maximumPosterWidth;
    }

    if (posterSize === 'medium') {
      return Math.floor(maximumPosterWidth * 0.75);
    }

    return Math.floor(maximumPosterWidth * 0.5);
  }, [posterSize, isSmallScreen]);

  const posterHeight = useMemo(() => {
    return Math.ceil((250 / 170) * posterWidth);
  }, [posterWidth]);

  const rowHeight = useMemo(() => {
    const heights = [
      posterHeight,
      detailedProgressBar ? detailedProgressBarHeight : progressBarHeight,
      isSmallScreen ? columnPaddingSmallScreen : columnPadding,
    ];

    return heights.reduce((acc, height) => acc + height, 0);
  }, [detailedProgressBar, posterHeight, isSmallScreen]);

  useEffect(() => {
    const current = scrollerRef.current as HTMLElement;

    if (isSmallScreen) {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      return;
    }

    if (current) {
      const width = current.clientWidth;
      const padding =
        (isSmallScreen ? bodyPaddingSmallScreen : bodyPadding) - 5;

      setSize({
        width: width - padding * 2,
        height: window.innerHeight,
      });
    }
  }, [isSmallScreen, scrollerRef, bounds]);

  useEffect(() => {
    const currentScrollerRef = scrollerRef.current as HTMLElement;
    const currentScrollListener = isSmallScreen ? window : currentScrollerRef;

    const handleScroll = throttle(() => {
      const { offsetTop = 0 } = currentScrollerRef;
      const scrollTop =
        (isSmallScreen
          ? getWindowScrollTopPosition()
          : currentScrollerRef.scrollTop) - offsetTop;

      listRef.current?.scrollTo(scrollTop);
    }, 10);

    currentScrollListener.addEventListener('scroll', handleScroll);

    return () => {
      handleScroll.cancel();

      if (currentScrollListener) {
        currentScrollListener.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isSmallScreen, listRef, scrollerRef]);

  useEffect(() => {
    if (jumpToCharacter) {
      const index = getIndexOfFirstCharacter(items, jumpToCharacter);

      if (index != null) {
        let scrollTop = index * rowHeight;

        // If the offset is zero go to the top, otherwise offset
        // by the approximate size of the header + padding (37 + 20).
        if (scrollTop > 0) {
          const offset = 57;

          scrollTop += offset;
        }

        listRef.current?.scrollTo(scrollTop);
        scrollerRef.current?.scrollTo(0, scrollTop);
      }
    }
  }, [jumpToCharacter, rowHeight, items, scrollerRef, listRef]);

  return (
    <div ref={measureRef}>
      <List<RowItemData>
        ref={listRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'none',
        }}
        width={size.width}
        height={size.height}
        itemCount={items.length}
        itemSize={rowHeight}
        itemData={{
          items,
          sortKey,
          posterWidth,
          posterHeight,
          rowHeight,
          isSelectMode,
          isSmallScreen,
        }}
      >
        {Row}
      </List>
    </div>
  );
}

export default MovieIndexOverviews;

import PropTypes from 'prop-types';
import React from 'react';
import formatBytes from 'Utilities/Number/formatBytes';
import translate from 'Utilities/String/translate';
import EnhancedSelectInputSelectedValue from './EnhancedSelectInputSelectedValue';
import styles from './RootFolderSelectInputSelectedValue.css';

function RootFolderSelectInputSelectedValue(props) {
  const {
    value,
    freeSpace,
    movieFolder,
    includeFreeSpace,
    isWindows,
    ...otherProps
  } = props;

  const slashCharacter = isWindows ? '\\' : '/';

  return (
    <EnhancedSelectInputSelectedValue
      className={styles.selectedValue}
      {...otherProps}
    >
      <div className={styles.pathContainer}>
        <div className={styles.path}>
          {value}
        </div>

        {
          movieFolder ?
            <div className={styles.movieFolder}>
              {slashCharacter}
              {movieFolder}
            </div> :
            null
        }
      </div>

      {
        freeSpace != null && includeFreeSpace &&
          <div className={styles.freeSpace}>
            {translate('RootFolderSelectFreeSpace', { freeSpace: formatBytes(freeSpace) })}
          </div>
      }
    </EnhancedSelectInputSelectedValue>
  );
}

RootFolderSelectInputSelectedValue.propTypes = {
  value: PropTypes.string,
  freeSpace: PropTypes.number,
  movieFolder: PropTypes.string,
  isWindows: PropTypes.bool,
  includeFreeSpace: PropTypes.bool.isRequired
};

RootFolderSelectInputSelectedValue.defaultProps = {
  includeFreeSpace: true
};

export default RootFolderSelectInputSelectedValue;

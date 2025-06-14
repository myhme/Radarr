import classNames from 'classnames';
import React from 'react';
import formatBytes from 'Utilities/Number/formatBytes';
import translate from 'Utilities/String/translate';
import EnhancedSelectInputOption, {
  EnhancedSelectInputOptionProps,
} from './EnhancedSelectInputOption';
import styles from './RootFolderSelectInputOption.css';

interface RootFolderSelectInputOptionProps
  extends EnhancedSelectInputOptionProps {
  id: string;
  value: string;
  freeSpace?: number;
  isMissing?: boolean;
  movieFolder?: string;
  isMobile: boolean;
  isWindows?: boolean;
}

function RootFolderSelectInputOption({
  id,
  value,
  freeSpace,
  isMissing,
  movieFolder,
  isMobile,
  isWindows,
  ...otherProps
}: RootFolderSelectInputOptionProps) {
  const slashCharacter = isWindows ? '\\' : '/';

  return (
    <EnhancedSelectInputOption id={id} isMobile={isMobile} {...otherProps}>
      <div
        className={classNames(styles.optionText, isMobile && styles.isMobile)}
      >
        <div className={styles.value}>
          {value}

          {movieFolder && id !== 'addNew' ? (
            <div className={styles.movieFolder}>
              {slashCharacter}
              {movieFolder}
            </div>
          ) : null}
        </div>

        {freeSpace == null ? null : (
          <div className={styles.freeSpace}>
            {translate('RootFolderSelectFreeSpace', {
              freeSpace: formatBytes(freeSpace),
            })}
          </div>
        )}

        {isMissing ? (
          <div className={styles.isMissing}>{translate('Missing')}</div>
        ) : null}
      </div>
    </EnhancedSelectInputOption>
  );
}

export default RootFolderSelectInputOption;

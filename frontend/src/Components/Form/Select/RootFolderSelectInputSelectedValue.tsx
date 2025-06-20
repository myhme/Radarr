import React from 'react';
import formatBytes from 'Utilities/Number/formatBytes';
import translate from 'Utilities/String/translate';
import EnhancedSelectInputSelectedValue from './EnhancedSelectInputSelectedValue';
import { RootFolderSelectInputValue } from './RootFolderSelectInput';
import styles from './RootFolderSelectInputSelectedValue.css';

interface RootFolderSelectInputSelectedValueProps {
  selectedValue: string;
  values: RootFolderSelectInputValue[];
  movieFolder?: string;
  isWindows?: boolean;
  includeFreeSpace?: boolean;
}

function RootFolderSelectInputSelectedValue({
  selectedValue,
  values,
  movieFolder,
  includeFreeSpace = true,
  isWindows,
  ...otherProps
}: RootFolderSelectInputSelectedValueProps) {
  const slashCharacter = isWindows ? '\\' : '/';
  const { value, freeSpace, isMissing } =
    values.find((v) => v.key === selectedValue) ||
    ({} as RootFolderSelectInputValue);

  return (
    <EnhancedSelectInputSelectedValue
      className={styles.selectedValue}
      {...otherProps}
    >
      <div className={styles.pathContainer}>
        <div className={styles.path}>{value}</div>

        {movieFolder ? (
          <div className={styles.movieFolder}>
            {slashCharacter}
            {movieFolder}
          </div>
        ) : null}
      </div>

      {freeSpace != null && includeFreeSpace ? (
        <div className={styles.freeSpace}>
          {translate('RootFolderSelectFreeSpace', {
            freeSpace: formatBytes(freeSpace),
          })}
        </div>
      ) : null}

      {isMissing ? (
        <div className={styles.isMissing}>{translate('Missing')}</div>
      ) : null}
    </EnhancedSelectInputSelectedValue>
  );
}

export default RootFolderSelectInputSelectedValue;

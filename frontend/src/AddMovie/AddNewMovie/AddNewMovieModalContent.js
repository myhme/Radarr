import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MovieMinimumAvailabilityPopoverContent from 'AddMovie/MovieMinimumAvailabilityPopoverContent';
import CheckInput from 'Components/Form/CheckInput';
import Form from 'Components/Form/Form';
import FormGroup from 'Components/Form/FormGroup';
import FormInputGroup from 'Components/Form/FormInputGroup';
import FormLabel from 'Components/Form/FormLabel';
import Icon from 'Components/Icon';
import SpinnerButton from 'Components/Link/SpinnerButton';
import ModalBody from 'Components/Modal/ModalBody';
import ModalContent from 'Components/Modal/ModalContent';
import ModalFooter from 'Components/Modal/ModalFooter';
import ModalHeader from 'Components/Modal/ModalHeader';
import Popover from 'Components/Tooltip/Popover';
import { icons, inputTypes, kinds, tooltipPositions } from 'Helpers/Props';
import MoviePoster from 'Movie/MoviePoster';
import translate from 'Utilities/String/translate';
import styles from './AddNewMovieModalContent.css';

class AddNewMovieModalContent extends Component {

  //
  // Listeners

  onQualityProfileIdChange = ({ value }) => {
    this.props.onInputChange({ name: 'qualityProfileId', value: parseInt(value) });
  };

  onAddMoviePress = () => {
    this.props.onAddMoviePress();
  };

  //
  // Render

  render() {
    const {
      title,
      year,
      overview,
      images,
      isAdding,
      rootFolderPath,
      monitor,
      qualityProfileId,
      minimumAvailability,
      searchForMovie,
      folder,
      tags,
      isSmallScreen,
      isWindows,
      onModalClose,
      onInputChange
    } = this.props;

    return (
      <ModalContent onModalClose={onModalClose}>
        <ModalHeader>
          {title}

          {
            !title.contains(year) && !!year &&
              <span className={styles.year}>({year})</span>
          }
        </ModalHeader>

        <ModalBody>
          <div className={styles.container}>
            {
              !isSmallScreen &&
                <div className={styles.poster}>
                  <MoviePoster
                    className={styles.poster}
                    images={images}
                    size={250}
                  />
                </div>
            }

            <div className={styles.info}>
              {overview ? (
                <div className={styles.overview}>{overview}</div>
              ) : null}

              <Form>
                <FormGroup>
                  <FormLabel>{translate('RootFolder')}</FormLabel>

                  <FormInputGroup
                    type={inputTypes.ROOT_FOLDER_SELECT}
                    name="rootFolderPath"
                    valueOptions={{
                      movieFolder: folder,
                      isWindows
                    }}
                    selectedValueOptions={{
                      movieFolder: folder,
                      isWindows
                    }}
                    helpText={translate('AddNewMovieRootFolderHelpText', {
                      folder
                    })}
                    onChange={onInputChange}
                    {...rootFolderPath}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    {translate('Monitor')}
                  </FormLabel>

                  <FormInputGroup
                    type={inputTypes.MONITOR_MOVIES_SELECT}
                    name="monitor"
                    onChange={onInputChange}
                    {...monitor}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    {translate('MinimumAvailability')}

                    <Popover
                      anchor={
                        <Icon
                          className={styles.labelIcon}
                          name={icons.INFO}
                        />
                      }
                      title={translate('MinimumAvailability')}
                      body={<MovieMinimumAvailabilityPopoverContent />}
                      position={tooltipPositions.RIGHT}
                    />
                  </FormLabel>

                  <FormInputGroup
                    type={inputTypes.AVAILABILITY_SELECT}
                    name="minimumAvailability"
                    onChange={onInputChange}
                    {...minimumAvailability}
                    helpLink="https://wiki.servarr.com/radarr/faq#what-is-minimum-availability"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>{translate('QualityProfile')}</FormLabel>

                  <FormInputGroup
                    type={inputTypes.QUALITY_PROFILE_SELECT}
                    name="qualityProfileId"
                    onChange={this.onQualityProfileIdChange}
                    {...qualityProfileId}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>{translate('Tags')}</FormLabel>

                  <FormInputGroup
                    type={inputTypes.TAG}
                    name="tags"
                    onChange={onInputChange}
                    {...tags}
                  />
                </FormGroup>
              </Form>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className={styles.modalFooter}>
          <label className={styles.searchForMissingMovieLabelContainer}>
            <span className={styles.searchForMissingMovieLabel}>
              {translate('StartSearchForMissingMovie')}
            </span>

            <CheckInput
              containerClassName={styles.searchForMissingMovieContainer}
              className={styles.searchForMissingMovieInput}
              name="searchForMovie"
              onChange={onInputChange}
              {...searchForMovie}
            />
          </label>

          <SpinnerButton
            className={styles.addButton}
            kind={kinds.SUCCESS}
            isSpinning={isAdding}
            onPress={this.onAddMoviePress}
          >
            {translate('AddMovie')}
          </SpinnerButton>
        </ModalFooter>
      </ModalContent>
    );
  }
}

AddNewMovieModalContent.propTypes = {
  title: PropTypes.string.isRequired,
  year: PropTypes.number.isRequired,
  overview: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.object).isRequired,
  isAdding: PropTypes.bool.isRequired,
  addError: PropTypes.object,
  rootFolderPath: PropTypes.object,
  monitor: PropTypes.object.isRequired,
  qualityProfileId: PropTypes.object,
  minimumAvailability: PropTypes.object.isRequired,
  searchForMovie: PropTypes.object.isRequired,
  folder: PropTypes.string.isRequired,
  tags: PropTypes.object.isRequired,
  isSmallScreen: PropTypes.bool.isRequired,
  isWindows: PropTypes.bool.isRequired,
  onModalClose: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onAddMoviePress: PropTypes.func.isRequired
};

export default AddNewMovieModalContent;
